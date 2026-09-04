import { getUserByEmail, updateUserOTP } from '../db.js';
import { generateOtp, hashOtp, otpExpiresAt, sendOtpEmail, checkResendCooldown, OTP_PURPOSE } from '../otp.js';

// Re-sends the email-verification code. Anti-enumeration: unknown or already
// verified accounts get the same generic success response as pending ones.
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

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await getUserByEmail(trimmedEmail);

    const genericResponse = () =>
      res.status(200).json({ success: true, message: 'If the account exists and is unverified, a new code has been sent.' });

    if (!user) {
      console.log(`Verification resend requested for non-existent email: ${trimmedEmail}`);
      return genericResponse();
    }

    if (user.email_verified === 1 || user.email_verified === true) {
      return genericResponse();
    }

    // Per-account cooldown — stops OTP email spam / Brevo quota burning even
    // when the attacker rotates IPs (the IP limiter alone can't do that).
    const cooldown = checkResendCooldown(user.otp_last_sent_at);
    if (!cooldown.allowed) {
      return res.status(429).json({
        error: `Please wait ${cooldown.retryAfterSeconds}s before requesting another code.`,
        code: 'RESEND_COOLDOWN',
        retryAfterSeconds: cooldown.retryAfterSeconds,
      });
    }

    const otp = generateOtp();
    await updateUserOTP(trimmedEmail, hashOtp(otp), otpExpiresAt(), OTP_PURPOSE.VERIFY_EMAIL);

    const delivered = await sendOtpEmail({
      to: trimmedEmail,
      name: user.name,
      otp,
      purpose: OTP_PURPOSE.VERIFY_EMAIL,
    });

    if (!delivered) {
      return res.status(502).json({ error: 'Failed to send the verification email. Please try again shortly.' });
    }

    return genericResponse();
  } catch (error) {
    console.error('Error in resend-verification handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
