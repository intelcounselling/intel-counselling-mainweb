import crypto from 'crypto';
import { createUser, getUserByEmail, updateUserOTP } from '../db.js';
import { hashPassword } from '../password.js';
import { generateOtp, hashOtp, otpExpiresAt, sendOtpEmail, OTP_PURPOSE } from '../otp.js';

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
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();

    // Basic password policy (mirrors the client-side rule)
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existingUser = await getUserByEmail(trimmedEmail);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = await hashPassword(password);

    await createUser(userId, name, trimmedEmail, hashedPassword, phone || null);

    // Issue an email-verification code. The account stays unverified (no
    // session token) until the code is confirmed via /api/verify-email.
    const otp = generateOtp();
    await updateUserOTP(trimmedEmail, hashOtp(otp), otpExpiresAt(), OTP_PURPOSE.VERIFY_EMAIL);
    const delivered = await sendOtpEmail({
      to: trimmedEmail,
      name,
      otp,
      purpose: OTP_PURPOSE.VERIFY_EMAIL,
    });

    if (!delivered) {
      // The account exists but the code email failed — the user can retry
      // via /api/resend-verification. Do not create a session.
      console.error(`Verification email failed to send for ${trimmedEmail}`);
      return res.status(502).json({
        error: 'Account created, but the verification email could not be sent. Please use "Resend code".',
        code: 'EMAIL_SEND_FAILED',
      });
    }

    res.status(200).json({
      success: true,
      requiresVerification: true,
      message: 'Account created. We sent a 6-digit verification code to your email.',
    });
  } catch (error) {
    console.error('Error in registration handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
