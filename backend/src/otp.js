import crypto from 'crypto';

// Shared OTP machinery for email verification and password reset.
// Security properties:
//  - Codes are crypto-random 6-digit numbers (1M possibilities)
//  - Stored only as SHA-256 hashes, never plaintext
//  - Short TTL (10 min) and per-account resend cooldown
//  - Purpose-scoped: a verification code can never be replayed as a reset code

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60s between sends per account
export const OTP_MAX_ATTEMPTS = 5;

export const OTP_PURPOSE = {
  VERIFY_EMAIL: 'verify_email',
  RESET_PASSWORD: 'reset_password',
};

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

export function otpExpiresAt() {
  return new Date(Date.now() + OTP_TTL_MS).toISOString();
}

// Constant-time comparison of a provided code against a stored hash.
export function otpMatches(providedOtp, storedHash) {
  if (typeof storedHash !== 'string' || !storedHash) return false;
  const a = Buffer.from(hashOtp(providedOtp));
  const b = Buffer.from(storedHash);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Shared email styles matching the site's dark/gold brand.
function emailShell(title, introHtml, bodyHtml, footerHtml) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>${title}</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #F7EBD3; padding: 20px;">
      <div style="background-color: #1F1E1B; max-width: 600px; margin: 0 auto; padding: 40px; border-radius: 24px; color: white; border: 1px solid rgba(255,255,255,0.1);">
        ${introHtml}
        ${bodyHtml}
        ${footerHtml}
      </div>
    </body>
    </html>
  `;
}

function otpBodyHtml(name, otp, minutes, purposeLabel) {
  const firstName = String(name || 'there').split(' ')[0].slice(0, 50);
  return emailShell(
    purposeLabel,
    `<h2 style="color: #E2A080; margin-top: 0;">${purposeLabel}</h2>
     <p style="color: rgba(255,255,255,0.7); font-size: 15px;">Hi ${firstName}, use the following 6-digit code to continue. This code is valid for ${minutes} minutes:</p>`,
    `<div style="background-color: rgba(255,255,255,0.05); border: 2px dashed #E2A080; border-radius: 12px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #E2A080; margin: 24px 0;">
       ${otp}
     </div>`,
    `<p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 30px;">If you did not request this, you can safely ignore this email — your account is secure.</p>`
  );
}

// Sends an OTP code via Brevo. Returns true when delivered, false when the
// provider rejects/errs. When BREVO_API_KEY is absent (local dev), the code
// is printed to the server console instead and the send is treated as success
// so flows remain testable offline.
export async function sendOtpEmail({ to, name, otp, purpose }) {
  const minutes = Math.round(OTP_TTL_MS / 60000);
  const subject = purpose === OTP_PURPOSE.VERIFY_EMAIL
    ? 'Verify your email — Intel Counselling'
    : 'Your Password Reset Code — Intel Counselling';
  const label = purpose === OTP_PURPOSE.VERIFY_EMAIL
    ? 'Verify Your Email'
    : 'Password Reset Request';

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey === 'dummy') {
    console.log(`\n==================================================`);
    console.log(`[DEV EMAIL] To: ${to}`);
    console.log(`[DEV EMAIL] Subject: ${subject}`);
    console.log(`[DEV EMAIL] Code: ${otp} (valid ${minutes} min, purpose: ${purpose})`);
    console.log(`==================================================\n`);
    return true;
  }

  const payload = {
    to: [{ email: to, name: name || undefined }],
    sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Support' },
    subject,
    htmlContent: otpBodyHtml(name, otp, minutes, label),
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Brevo send failed:', response.status, err);
      // In dev, degrade to console delivery instead of blocking the flow.
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV EMAIL FALLBACK] Code for ${to}: ${otp}`);
        return true;
      }
      return false;
    }
    return true;
  } catch (err) {
    console.error('Brevo send threw:', err);
    return false;
  }
}

// Best-effort security notification after a password change.
export async function sendPasswordChangedEmail(to, name) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(`[DEV EMAIL] Password-changed notice for ${to} (suppressed — no BREVO_API_KEY)`);
    return true;
  }

  const firstName = String(name || 'there').split(' ')[0].slice(0, 50);
  const html = emailShell(
    'Your password was changed',
    `<h2 style="color: #E2A080; margin-top: 0;">Password Changed</h2>
     <p style="color: rgba(255,255,255,0.7); font-size: 15px;">Hi ${firstName}, your Intel Counselling account password was just changed successfully.</p>`,
    `<p style="color: rgba(255,255,255,0.7); font-size: 14px;">All active sessions were signed out. If this wasn't you, please reset your password immediately from the login screen and contact support.</p>`,
    `<p style="color: rgba(255,255,255,0.4); font-size: 12px; margin-top: 30px;">This is an automated security notification.</p>`
  );

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        to: [{ email: to, name: name || undefined }],
        sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling Support' },
        subject: 'Your Intel Counselling password was changed',
        htmlContent: html,
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Brevo password-changed notice failed:', response.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Brevo password-changed notice threw:', err);
    return false;
  }
}

// Per-account resend cooldown, backed by otp_last_sent_at.
// Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
export function checkResendCooldown(otpLastSentAt, now = Date.now()) {
  if (!otpLastSentAt) return { allowed: true };
  const last = new Date(otpLastSentAt).getTime();
  if (Number.isNaN(last)) return { allowed: true };
  const elapsed = now - last;
  if (elapsed >= OTP_RESEND_COOLDOWN_MS) return { allowed: true };
  return { allowed: false, retryAfterSeconds: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000) };
}
