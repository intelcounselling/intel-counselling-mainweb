const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('Email: SMTP not configured. Emails will be logged only.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { messageId: 'dev-mode' };
  }

  try {
    const result = await t.sendMail({
      from: process.env.SMTP_FROM || 'Intel Counselling <noreply@mindbridge.app>',
      to,
      subject,
      html,
      text,
    });
    logger.info(`Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (err) {
    logger.error(`Email failed to ${to}:`, err);
    throw err;
  }
}

// ── Templates ────────────────────────────────────────────────

function alertEmailHtml({ psychiatristName, studentName, testName, score, maxScore, severity, schoolName, appUrl }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #4F46E5, #0EA5E9); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .alert-badge { display: inline-block; padding: 6px 16px; border-radius: 999px; font-weight: bold; font-size: 14px; margin: 8px 0; }
  .severe { background: #fef2f2; color: #dc2626; }
  .moderate { background: #fff7ed; color: #ea580c; }
  .mild { background: #fefce8; color: #ca8a04; }
  .minimal { background: #f0fdf4; color: #16a34a; }
  .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
  .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
</style></head>
<body>
  <div class="card">
    <div class="header"><h1>🧠 Intel Counselling Alert</h1></div>
    <p>Dear Dr. ${psychiatristName},</p>
    <p>A student at <strong>${schoolName}</strong> has completed a mental health screening that requires your attention.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;color:#6b7280;">Student</td><td style="padding:8px;font-weight:bold;">${studentName}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Assessment</td><td style="padding:8px;">${testName}</td></tr>
      <tr><td style="padding:8px;color:#6b7280;">Score</td><td style="padding:8px;">${score} / ${maxScore}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Severity</td><td style="padding:8px;"><span class="alert-badge ${severity}">${severity.toUpperCase()}</span></td></tr>
    </table>
    <p>Please log in to review this student's profile and consider scheduling a session.</p>
    <a href="${appUrl}/psychiatrist/alerts" class="btn">View Alert →</a>
    <div class="footer">This is an automated notification from Intel Counselling. Do not reply to this email.</div>
  </div>
</body>
</html>`;
}

function appointmentEmailHtml({ parentName, studentName, psychiatristName, slot, notes, meetingLink, appUrl }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #4F46E5, #0EA5E9); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
  .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
</style></head>
<body>
  <div class="card">
    <div class="header"><h1>📅 Appointment Confirmed</h1></div>
    <p>Dear ${parentName},</p>
    <p>An appointment has been scheduled for <strong>${studentName}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px;color:#6b7280;">Date & Time</td><td style="padding:8px;font-weight:bold;">${new Date(slot).toLocaleString()}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Psychiatrist</td><td style="padding:8px;">Dr. ${psychiatristName}</td></tr>
      ${notes ? `<tr><td style="padding:8px;color:#6b7280;">Notes</td><td style="padding:8px;">${notes}</td></tr>` : ''}
      ${meetingLink ? `<tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Meeting Link</td><td style="padding:8px;"><a href="${meetingLink}">${meetingLink}</a></td></tr>` : ''}
    </table>
    <a href="${appUrl}/parent/appointments" class="btn">View Appointment →</a>
    <div class="footer">Intel Counselling — Student Mental Health Platform</div>
  </div>
</body>
</html>`;
}

function credentialsEmailHtml({ recipientName, email, password, role, appUrl }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #4F46E5, #0EA5E9); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .cred-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace; }
  .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
</style></head>
<body>
  <div class="card">
    <div class="header"><h1>🔐 Your Intel Counselling Login</h1></div>
    <p>Dear ${recipientName},</p>
    <p>Your ${role} account has been created on Intel Counselling. Here are your login credentials:</p>
    <div class="cred-box">
      <div><strong>Email:</strong> ${email}</div>
      <div><strong>Password:</strong> ${password}</div>
    </div>
    <p>⚠️ You will be asked to change your password on first login.</p>
    <a href="${appUrl}/login" class="btn">Login Now →</a>
  </div>
</body>
</html>`;
}

async function sendAlertEmail({ to, psychiatristName, studentName, testName, score, maxScore, severity, schoolName }) {
  return sendEmail({
    to,
    subject: `⚠️ Intel Counselling Alert: ${studentName} — ${testName} Score Requires Attention`,
    html: alertEmailHtml({
      psychiatristName, studentName, testName, score, maxScore, severity, schoolName,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    }),
  });
}

async function sendAppointmentEmail({ to, parentName, studentName, psychiatristName, slot, notes, meetingLink }) {
  return sendEmail({
    to,
    subject: `📅 Intel Counselling: Appointment Confirmed for ${studentName}`,
    html: appointmentEmailHtml({
      parentName, studentName, psychiatristName, slot, notes, meetingLink,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    }),
  });
}

async function sendCredentialsEmail({ to, recipientName, email, password, role }) {
  return sendEmail({
    to,
    subject: '🔐 Your Intel Counselling Login Credentials',
    html: credentialsEmailHtml({
      recipientName, email, password, role,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    }),
  });
}

function otpEmailHtml({ recipientName, otp }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1A1A1A, #333333); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .otp-box { background: #f8fafc; border: 2px dashed #4F46E5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #4F46E5; }
  .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
</style></head>
<body>
  <div class="card">
    <div class="header"><h1>🧠 Intel Counselling</h1></div>
    <p>Dear ${recipientName},</p>
    <p>You requested to reset your password. Use the following 6-digit One-Time Password (OTP) to proceed. This code is valid for 10 minutes:</p>
    <div class="otp-box">${otp}</div>
    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    <div class="footer">Intel Counselling — Student Mental Health Platform</div>
  </div>
</body>
</html>`;
}

async function sendOTPEmail({ to, recipientName, otp }) {
  return sendEmail({
    to,
    subject: '🔐 Your Intel Counselling Password Reset OTP',
    html: otpEmailHtml({ recipientName, otp }),
  });
}

function parentAlertEmailHtml({ parentName, studentName, testName, appUrl }) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Inter, Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 12px; padding: 32px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1A1A1A, #333333); border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center; }
  .header h1 { color: white; margin: 0; font-size: 24px; }
  .btn { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 16px; }
  .footer { color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; }
</style></head>
<body>
  <div class="card">
    <div class="header"><h1>🧠 Intel Counselling</h1></div>
    <p>Dear ${parentName},</p>
    <p>Your child <strong>${studentName}</strong> has completed a mental health screening (<strong>${testName}</strong>) that indicates they may benefit from additional support.</p>
    <p>Please log in to your portal to review the results and schedule a counseling session if needed.</p>
    <a href="${appUrl}/parent/appointments" class="btn">Log In to Portal →</a>
    <div class="footer">Intel Counselling — Student Mental Health Platform</div>
  </div>
</body>
</html>`;
}

async function sendParentAlertEmail({ to, parentName, studentName, testName }) {
  return sendEmail({
    to,
    subject: `⚠️ Intel Counselling Alert: Support resources for ${studentName}`,
    html: parentAlertEmailHtml({
      parentName, studentName, testName,
      appUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    }),
  });
}

module.exports = { sendEmail, sendAlertEmail, sendAppointmentEmail, sendCredentialsEmail, sendOTPEmail, sendParentAlertEmail };
