import { getUserByEmail, resetUserPassword, incrementOtpAttempts, clearUserOTP, bumpTokenVersion } from '../db.js';
import { hashPassword } from '../password.js';
import { otpMatches, sendPasswordChangedEmail, OTP_PURPOSE, OTP_MAX_ATTEMPTS } from '../otp.js';

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
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Server-side password policy — never trust the client's check alone.
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await getUserByEmail(trimmedEmail);

    if (!user || !user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Purpose-scoped: only codes issued for password reset may complete a reset.
    if (user.otp_purpose !== OTP_PURPOSE.RESET_PASSWORD) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify expiry
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Lock out brute-force attempts: the OTP is only 6 digits
    if ((user.otp_attempts || 0) >= OTP_MAX_ATTEMPTS) {
      await clearUserOTP(trimmedEmail);
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP code (constant-time comparison against the stored hash)
    if (!otpMatches(otp, user.otp_code)) {
      const attempts = await incrementOtpAttempts(trimmedEmail);
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await clearUserOTP(trimmedEmail);
      }
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await resetUserPassword(trimmedEmail, await hashPassword(newPassword));

    // Revoke every outstanding session — an attacker (or old device) holding a
    // pre-reset token must not keep access.
    await bumpTokenVersion(user.id).catch((err) =>
      console.error('Failed to bump token version after password reset:', err)
    );

    // Best-effort security notification (never blocks the reset response).
    sendPasswordChangedEmail(trimmedEmail, user.name).catch((err) =>
      console.error('Password-changed notification failed:', err)
    );

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (error) {
    console.error('Error in verify OTP handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
