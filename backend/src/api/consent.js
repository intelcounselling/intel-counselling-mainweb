import { getAccountById, setUserProfile, recordConsent } from '../db.js';
import { authenticateRequest } from '../token.js';
import { readProfile, encryptProfile } from '../profile.js';
import { generateOtp, hashOtp, otpMatches, OTP_TTL_MS, OTP_MAX_ATTEMPTS, OTP_PURPOSE, sendOtpEmail } from '../otp.js';

// Version of the consent notice shown on the site (bump when its wording changes;
// the consent log records which version each person agreed to).
export const CONSENT_VERSION = '2026-10';

// DPDP Act: a child's data needs verifiable consent from a parent or guardian.
export const isMinor = (profile) => Number(profile?.age) > 0 && Number(profile.age) < 18;
export const guardianConsentNeeded = (profile) => isMinor(profile) && !profile?.guardian?.consentAt;

// Signed-in user whose intake says under 18 and no parent has confirmed yet
export async function needsGuardianConsent(userId) {
  if (!userId) return false;
  return guardianConsentNeeded(readProfile(await getAccountById(userId)));
}

async function saveProfile(account, profile) {
  const { encrypted, iv } = encryptProfile(profile);
  await setUserProfile(account.id, account.name, account.phone, encrypted, iv);
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/guardian-consent/start { guardianName, guardianEmail } — emails the parent a code
export async function startHandler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await getAccountById(userId);
    const profile = readProfile(account);
    if (!guardianConsentNeeded(profile)) return res.status(409).json({ error: 'Parent consent is not needed for this account' });

    const guardianName = String(req.body?.guardianName || '').trim().slice(0, 100);
    const guardianEmail = String(req.body?.guardianEmail || '').trim().toLowerCase().slice(0, 200);
    if (!guardianName || !EMAIL.test(guardianEmail)) return res.status(400).json({ error: "Enter your parent or guardian's name and email" });
    if (guardianEmail === String(account.email).toLowerCase()) {
      return res.status(400).json({ error: "Please use your parent or guardian's own email address" });
    }

    const pending = profile.guardianPending || {};
    if (pending.sentAt && Date.now() - Date.parse(pending.sentAt) < 60 * 1000) {
      return res.status(429).json({ error: 'Please wait a minute before asking for another code' });
    }
    const otp = generateOtp();
    profile.guardianPending = {
      name: guardianName,
      email: guardianEmail,
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + OTP_TTL_MS).toISOString(),
      attempts: 0,
      sentAt: new Date().toISOString(),
    };
    await saveProfile(account, profile);
    const sent = await sendOtpEmail({ to: guardianEmail, name: guardianName, otp, purpose: OTP_PURPOSE.GUARDIAN_CONSENT, childName: account.name });
    if (!sent) return res.status(502).json({ error: 'Could not send the email. Please check the address and try again.' });
    res.json({ sent: true });
  } catch (err) {
    console.error('guardian consent start failed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// POST /api/guardian-consent/verify { otp } — the parent's code confirms consent
export async function verifyHandler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await getAccountById(userId);
    const profile = readProfile(account);
    const pending = profile?.guardianPending;
    if (!guardianConsentNeeded(profile) || !pending) return res.status(400).json({ error: 'Ask for a code first' });
    if (Date.parse(pending.expiresAt) < Date.now()) return res.status(400).json({ error: 'That code has expired. Please ask for a new one.' });
    if ((pending.attempts || 0) >= OTP_MAX_ATTEMPTS) return res.status(429).json({ error: 'Too many attempts. Please ask for a new code.' });

    if (!otpMatches(String(req.body?.otp || ''), pending.otpHash)) {
      pending.attempts = (pending.attempts || 0) + 1;
      await saveProfile(account, profile);
      return res.status(400).json({ error: 'That code is not right. Please check the email and try again.' });
    }

    profile.guardian = { name: pending.name, email: pending.email, consentAt: new Date().toISOString(), version: CONSENT_VERSION };
    delete profile.guardianPending;
    await saveProfile(account, profile);
    await recordConsent(userId, 'guardian_consent', CONSENT_VERSION, { guardianName: pending.name, guardianEmail: pending.email });
    res.json({ verified: true });
  } catch (err) {
    console.error('guardian consent verify failed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
