import crypto from 'crypto';
import { getUserByEmail, resetUserPassword } from '../db.js';

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

    // Verify OTP code
    const hashedProvidedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (user.otp_code !== hashedProvidedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Hash new password using SHA256 (matches registration / login)
    const newPasswordHash = crypto.createHash('sha256').update(newPassword).digest('hex');

    await resetUserPassword(trimmedEmail, newPasswordHash);

    res.status(200).json({
      success: true,
      message: 'Password reset successfully.'
    });
  } catch (error) {
    console.error('Error in verify OTP handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
