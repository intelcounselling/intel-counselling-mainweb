import { getAccountById, setUserProfile } from '../db.js';
import { authenticateRequest } from '../token.js';
import { sanitizeProfile, isProfileComplete, encryptProfile, readProfile } from '../profile.js';
import { recordConsent } from '../db.js';
import { CONSENT_VERSION, guardianConsentNeeded } from './consent.js';

// The pending parent code never leaves the server
const publicProfile = (p) => {
  if (!p) return p;
  const { guardianPending, ...rest } = p;
  return rest;
};

// GET /api/profile → { user, profile, complete, guardianRequired }
// PUT /api/profile { name?, phone, age, gender, occupation, reason? }
export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const account = await getAccountById(userId);
    if (!account) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'PUT') {
      const { profile, error } = sanitizeProfile(req.body);
      if (error) return res.status(400).json({ error });
      if (!isProfileComplete(profile)) {
        return res.status(400).json({ error: 'Please fill in phone, age, gender and occupation.' });
      }
      // DPDP: processing needs the person's consent to the current notice
      if (req.body.consent !== true) {
        return res.status(400).json({ error: 'Please read and accept the consent notice to continue.' });
      }
      // Keep a parent's earlier confirmation when the intake is edited
      const previous = readProfile(account);
      if (previous?.guardian) profile.guardian = previous.guardian;
      if (previous?.guardianPending) profile.guardianPending = previous.guardianPending;
      const name = typeof req.body.name === 'string' && req.body.name.trim()
        ? req.body.name.trim().slice(0, 100)
        : account.name;
      const { encrypted, iv } = encryptProfile(profile);
      await setUserProfile(userId, name, profile.phone, encrypted, iv);
      await recordConsent(userId, 'assessment_processing', CONSENT_VERSION);
      return res.status(200).json({
        user: { id: account.id, name, email: account.email, phone: profile.phone },
        profile: publicProfile(profile),
        complete: true,
        guardianRequired: guardianConsentNeeded(profile),
        firstTime: !account.profile,
      });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const profile = readProfile(account);
    res.status(200).json({
      user: { id: account.id, name: account.name, email: account.email, phone: account.phone },
      profile: publicProfile(profile),
      complete: isProfileComplete(profile),
      // under 18 and no parent has confirmed yet (DPDP Act)
      guardianRequired: guardianConsentNeeded(profile),
    });
  } catch (error) {
    console.error('Error in profile handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
