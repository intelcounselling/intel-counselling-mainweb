import { getUserByEmail, setUserEmailVerified } from '../db.js';
import { signToken } from '../token.js';
import { otpMatches, OTP_PURPOSE, OTP_MAX_ATTEMPTS } from '../otp.js';
import { incrementOtpAttempts, clearUserOTP } from '../db.js';

// Confirms the 6-digit code sent at registration. On success the account is
// marked verified and the user is logged in (session token returned).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Missing email or verification code' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await getUserByEmail(trimmedEmail);

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Already verified (e.g. double submit) — just log them in.
    if (user.email_verified === 1 || user.email_verified === true) {
      return res.status(200).json({
        success: true,
        token: signToken(user.id, user.token_version == null ? 0 : user.token_version),
        user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
      });
    }

    if (!user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (user.otp_purpose !== OTP_PURPOSE.VERIFY_EMAIL) {
      // A code issued for a different purpose must never verify an email.
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'This code has expired. Please request a new one.' });
    }

    // Lock out brute force: 6-digit code space means unlimited guessing wins.
    if ((user.otp_attempts || 0) >= OTP_MAX_ATTEMPTS) {
      await clearUserOTP(trimmedEmail);
      return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
    }

    if (!otpMatches(otp, user.otp_code)) {
      const attempts = await incrementOtpAttempts(trimmedEmail);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await clearUserOTP(trimmedEmail);
      }
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    await setUserEmailVerified(trimmedEmail);

    res.status(200).json({
      success: true,
      token: signToken(user.id, user.token_version == null ? 0 : user.token_version),
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
    });
  } catch (error) {
    console.error('Error in verify-email handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
