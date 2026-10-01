import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { getUserByEmail, createVerifiedUser, claimUnverifiedAccount, setUserEmailVerified } from '../db.js';
import { signToken } from '../token.js';

const googleClient = new OAuth2Client();

// Unusable password marker for Google-only accounts: verifyPassword() can never
// match it, and the user can still set a password later via "Forgot password".
const NO_PASSWORD = '!google';

// Signs in (creating the account if needed) for an email Google has verified.
export async function signInWithGoogleIdentity({ email, name }) {
  const normalized = String(email).trim().toLowerCase();
  let user = await getUserByEmail(normalized);
  if (!user) {
    await createVerifiedUser(crypto.randomUUID(), String(name || normalized.split('@')[0]).slice(0, 100), normalized, NO_PASSWORD);
    user = await getUserByEmail(normalized);
  } else if (user.email_verified === 0 || user.email_verified === false) {
    // Someone registered this email with a password but never proved they own
    // it. Google just did — drop that password and its sessions so a squatter
    // can't keep access to the real owner's account (pre-hijack defence).
    await claimUnverifiedAccount(normalized, NO_PASSWORD);
    user = await getUserByEmail(normalized);
  } else if (user.email_verified == null) {
    await setUserEmailVerified(normalized);
  }
  return {
    token: signToken(user.id, user.token_version == null ? 0 : user.token_version),
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: 'Google sign-in is not configured' });

  const { credential } = req.body || {};
  if (typeof credential !== 'string' || credential.length > 4096) {
    return res.status(400).json({ error: 'Missing Google credential' });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch (err) {
    return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
  }
  if (!payload?.email || payload.email_verified !== true) {
    return res.status(401).json({ error: 'Your Google account email is not verified.' });
  }

  try {
    res.status(200).json({ success: true, ...(await signInWithGoogleIdentity(payload)) });
  } catch (error) {
    console.error('Error in google-login handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
