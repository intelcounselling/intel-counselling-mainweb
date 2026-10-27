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

// Brevo is what the rest of the platform already uses, so prefer it when its key is set;
// SMTP stays as a fallback for deployments that configure it instead.
async function sendViaBrevo({ to, subject, html, text }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      to: [{ email: to }],
      sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling' },
      subject,
      ...(html ? { htmlContent: html } : { textContent: text }),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Brevo ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json().catch(() => ({}));
}

async function sendEmail({ to, subject, html, text }) {
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey && brevoKey !== 'dummy') {
    try {
      const result = await sendViaBrevo({ to, subject, html, text });
      logger.info(`Email sent to ${to} via Brevo`);
      return result;
    } catch (err) {
      logger.error(`Email failed to ${to} (Brevo):`, err);
      throw err;
    }
  }

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
// Built on the shared email theme (an ES module, loaded lazily from this CommonJS file).
// Every dynamic value is escaped before it reaches the HTML.

let themeP;
function theme() {
  if (!themeP) themeP = Promise.all([import('../../emailTheme.js'), import('../../escape.js')]).then(([t, e]) => ({ ...t, esc: e.escapeHtml }));
  return themeP;
}

const FRONTEND = () => process.env.FRONTEND_URL || 'http://localhost:5173';

async function alertEmailHtml({ psychiatristName, studentName, testName, score, maxScore, severity, schoolName, appUrl }) {
  const t = await theme();
  const tint = { severe: 'peach', moderate: 'peach', mild: 'cream', minimal: 'sage' }[severity] || 'cream';
  return t.emailLayout({
    title: 'Student alert',
    preheader: `${t.esc(studentName)}: ${t.esc(testName)} needs your attention`,
    eyebrow: 'Student alert',
    heading: 'A screening needs your attention',
    audience: 'team',
    body:
      t.p(`Dear Dr. ${t.esc(psychiatristName)}, a student at <strong>${t.esc(schoolName)}</strong> has completed a screening that needs your attention.`) +
      t.facts([
        ['Student', `<strong>${t.esc(studentName)}</strong>`],
        ['Assessment', t.esc(testName)],
        ['Score', `${t.esc(score)} / ${t.esc(maxScore)}`],
        ['Severity', `<strong>${t.esc(String(severity).toUpperCase())}</strong>`],
      ]) +
      t.panel("Please sign in to review this student's profile and consider scheduling a session.", tint) +
      t.button('View alert', `${appUrl}/psychiatrist/alerts`),
  });
}

async function appointmentEmailHtml({ parentName, studentName, psychiatristName, slot, notes, meetingLink, appUrl }) {
  const t = await theme();
  return t.emailLayout({
    title: 'Appointment confirmed',
    preheader: `An appointment is booked for ${t.esc(studentName)}`,
    eyebrow: 'Appointment confirmed',
    heading: `A session is booked for ${t.esc(studentName)}`,
    body:
      t.p(`Dear ${t.esc(parentName)}, an appointment has been scheduled for <strong>${t.esc(studentName)}</strong>.`) +
      t.facts([
        ['Date and time', `<strong>${t.esc(new Date(slot).toLocaleString())}</strong>`],
        ['Counsellor', `Dr. ${t.esc(psychiatristName)}`],
        ['Notes', notes ? t.esc(notes) : ''],
        ['Meeting link', meetingLink ? `<a href="${t.esc(meetingLink)}" style="color:#1C3F39;">${t.esc(meetingLink)}</a>` : ''],
      ]) +
      t.button('View appointment', `${appUrl}/parent/appointments`),
  });
}

async function credentialsEmailHtml({ recipientName, email, password, role, appUrl }) {
  const t = await theme();
  return t.emailLayout({
    title: 'Your login',
    preheader: 'Your Intel Counselling account is ready.',
    eyebrow: 'Welcome',
    heading: 'Your account is ready',
    body:
      t.p(`Dear ${t.esc(recipientName)}, your ${t.esc(role)} account has been created on Intel Counselling. Here are your sign-in details.`) +
      t.facts([
        ['Email', t.esc(email)],
        ['Password', `<span style="font-family:Consolas,monospace;font-size:16px;">${t.esc(password)}</span>`],
      ]) +
      t.panel('You will be asked to choose a new password the first time you sign in.', 'peach') +
      t.button('Sign in', `${appUrl}/login`),
  });
}

async function otpEmailHtml({ recipientName, otp }) {
  const t = await theme();
  return t.emailLayout({
    title: 'Password reset code',
    preheader: `Your code is ${t.esc(otp)}. It is valid for 10 minutes.`,
    eyebrow: 'Password reset',
    heading: 'Reset your password',
    body:
      t.p(`Dear ${t.esc(recipientName)}, use this 6-digit code to reset your password.`) +
      t.codeBox(t.esc(otp)) +
      t.p('This code is valid for <strong>10 minutes</strong>.', 'text-align:center;') +
      t.note("If you didn't ask for a reset, you can ignore this email, or contact us if you are worried."),
  });
}

async function parentAlertEmailHtml({ parentName, studentName, testName, appUrl }) {
  const t = await theme();
  return t.emailLayout({
    title: 'Support for your child',
    preheader: `${t.esc(studentName)} may benefit from some extra support`,
    eyebrow: 'A gentle heads-up',
    heading: `${t.esc(studentName)} may benefit from extra support`,
    body:
      t.p(`Dear ${t.esc(parentName)}, your child <strong>${t.esc(studentName)}</strong> completed a screening (<strong>${t.esc(testName)}</strong>) that suggests they may benefit from some additional support.`) +
      t.panel('This is not a diagnosis. It is a prompt to check in, and a counsellor can help from here.', 'sage') +
      t.p('Please sign in to the portal to see the details and book a counselling session if you would like one.') +
      t.button('Open the portal', `${appUrl}/parent/appointments`),
  });
}

async function sendAlertEmail({ to, psychiatristName, studentName, testName, score, maxScore, severity, schoolName }) {
  return sendEmail({
    to,
    subject: `Intel Counselling alert: ${studentName}, ${testName} needs attention`,
    html: await alertEmailHtml({ psychiatristName, studentName, testName, score, maxScore, severity, schoolName, appUrl: FRONTEND() }),
  });
}

async function sendAppointmentEmail({ to, parentName, studentName, psychiatristName, slot, notes, meetingLink }) {
  return sendEmail({
    to,
    subject: `Intel Counselling: appointment confirmed for ${studentName}`,
    html: await appointmentEmailHtml({ parentName, studentName, psychiatristName, slot, notes, meetingLink, appUrl: FRONTEND() }),
  });
}

async function sendCredentialsEmail({ to, recipientName, email, password, role }) {
  return sendEmail({
    to,
    subject: 'Your Intel Counselling login',
    html: await credentialsEmailHtml({ recipientName, email, password, role, appUrl: FRONTEND() }),
  });
}

async function sendOTPEmail({ to, recipientName, otp }) {
  return sendEmail({
    to,
    subject: 'Your Intel Counselling password reset code',
    html: await otpEmailHtml({ recipientName, otp }),
  });
}

async function sendParentAlertEmail({ to, parentName, studentName, testName }) {
  return sendEmail({
    to,
    subject: `Intel Counselling: support for ${studentName}`,
    html: await parentAlertEmailHtml({ parentName, studentName, testName, appUrl: FRONTEND() }),
  });
}

async function sendMfaEmail({ to, otp }) {
  const t = await theme();
  return sendEmail({
    to,
    subject: 'Your Intel Counselling sign-in code',
    text: `Your sign-in code is ${otp}. It expires in 10 minutes. If you did not just sign in, change your password now.`,
    html: t.emailLayout({
      title: 'Sign-in code',
      preheader: `Your sign-in code is ${t.esc(otp)}.`,
      eyebrow: 'Admin sign-in',
      heading: 'Your sign-in code',
      audience: 'team',
      body:
        t.p('Enter this code to finish signing in.') +
        t.codeBox(t.esc(otp)) +
        t.p('It expires in <strong>10 minutes</strong>.', 'text-align:center;') +
        t.panel("If you didn't just sign in, change your password now and tell the team.", 'peach'),
    }),
  });
}

async function sendDeletionRequestEmail({ to, name, email, role, userId }) {
  const t = await theme();
  return sendEmail({
    to,
    subject: 'Data deletion request: school portal',
    text: `${name} <${email}> (${role}, user id ${userId}) has asked for their account and data to be deleted. Delete the user from User Management and reply to confirm.`,
    html: t.emailLayout({
      title: 'Data deletion request',
      preheader: `${t.esc(name)} has asked for their data to be deleted`,
      eyebrow: 'Privacy request',
      heading: 'A deletion request needs action',
      audience: 'team',
      body:
        t.facts([
          ['Name', `<strong>${t.esc(name)}</strong>`],
          ['Email', t.esc(email)],
          ['Role', t.esc(role)],
          ['User id', t.esc(userId)],
        ]) +
        t.panel('Delete this user from User Management and reply to confirm, within the legal deadline.', 'peach'),
    }),
  });
}

module.exports = { sendEmail, sendAlertEmail, sendAppointmentEmail, sendCredentialsEmail, sendOTPEmail, sendParentAlertEmail, sendMfaEmail, sendDeletionRequestEmail };
