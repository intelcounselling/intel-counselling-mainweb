import crypto from 'crypto';
import { getUserByEmail, resetUserPassword, incrementOtpAttempts, clearUserOTP } from '../db.js';
import { hashPassword } from '../password.js';

const MAX_OTP_ATTEMPTS = 5;

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

    const trimmedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(trimmedEmail);

    if (!user || !user.otp_code || !user.otp_expires_at) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Verify expiry
    if (new Date() > new Date(user.otp_expires_at)) {
      return res.status(400).json({ error: 'OTP has expired' });
    }

    // Lock out brute-force attempts: the OTP is only 6 digits
    if ((user.otp_attempts || 0) >= MAX_OTP_ATTEMPTS) {
      await clearUserOTP(trimmedEmail);
      return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
    }

    // Verify OTP code (constant-time comparison)
    const hashedProvidedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    const a = Buffer.from(hashedProvidedOtp);
    const b = Buffer.from(user.otp_code);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      const attempts = await incrementOtpAttempts(trimmedEmail);
      if (attempts >= MAX_OTP_ATTEMPTS) {
        await clearUserOTP(trimmedEmail);
      }
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    await resetUserPassword(trimmedEmail, await hashPassword(newPassword));

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (error) {
    console.error('Error in verify OTP handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
