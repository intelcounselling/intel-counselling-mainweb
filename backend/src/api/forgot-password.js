import crypto from 'crypto';
import { getUserByEmail, updateUserOTP } from '../db.js';

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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(trimmedEmail);

    if (!user) {
      // Return success to prevent email harvesting
      console.log(`Password reset requested for non-existent email: ${trimmedEmail}`);
      return res.status(200).json({ success: true, message: 'If the account exists, an OTP code has been sent.' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    await updateUserOTP(trimmedEmail, hashedOtp, expiresAt);

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.log(`\n==================================================`);
      console.log(`[DEV EMAIL] To: ${trimmedEmail}`);
      console.log(`[DEV EMAIL] Subject: Your Password Reset OTP`);
      console.log(`[DEV EMAIL] Code: ${otp}`);
      console.log(`==================================================\n`);
      return res.status(200).json({ success: true, message: 'OTP code generated (logged in dev)' });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Reset your password</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #F7EBD3; padding: 20px;">
        <div style="background-color: #1F1E1B; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; color: white; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #E2A080; margin-top: 0;">Password Reset Request</h2>
          <p style="color: rgba(255,255,255,0.7); font-size: 15px;">You requested to reset your password. Use the following 6-digit OTP code to proceed. This code is valid for 10 minutes:</p>
          <div style="background-color: rgba(255,255,255,0.05); border: 2px dashed #E2A080; border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #E2A080; margin: 24px 0;">
            ${otp}
          </div>
          <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 30px;">If you did not request a password reset, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    const payload = {
      to: [{ email: trimmedEmail, name: user.name }],
      sender: { email: 'intelcounselling@gmail.com', name: 'Intel Counselling Support' },
      subject: `Your Password Reset OTP`,
      htmlContent: htmlContent
    };

    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Failed to send forgot password email:', err);
      return res.status(500).json({ error: `Failed to send OTP email: ${err.message || JSON.stringify(err)}` });
    }

    res.status(200).json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error in forgot password handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
