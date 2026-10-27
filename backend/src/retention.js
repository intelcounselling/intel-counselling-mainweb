// Data retention (DPDP Act: keep personal data only as long as it is needed).
//
// Runs once a day from server.js. Safe by default: unless RETENTION_ENABLED=true it
// only logs what it WOULD delete, so turning it on is a deliberate step.
//
//   RETENTION_ANON_DAYS      unclaimed anonymous screenings         (default 30)
//   RETENTION_INACTIVE_DAYS  website accounts with no activity      (default 1095 = 3 years)
//   RETENTION_WARNING_DAYS   warning email → deletion               (default 30)
//   RETENTION_SESSION_DAYS   school-portal session records after the
//                            student's last session                 (default 1095)
import { createRequire } from 'module';
import { emailLayout, p as para, panel, button } from './emailTheme.js';
import { countOrDeleteAnonymousResults, findInactiveUsers, markInactivityWarned, eraseUser } from './db.js';

const require = createRequire(import.meta.url);
const DAY = 24 * 60 * 60 * 1000;
const days = (name, fallback) => {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? v : fallback;
};
const ago = (d) => new Date(Date.now() - d * DAY).toISOString();

async function sendWarning(user, deleteOn) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return console.log(`[retention] (no BREVO_API_KEY) would warn ${user.email}`);
  const site = process.env.PUBLIC_BASE_URL || 'https://intelcounselling.com';
  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      to: [{ email: user.email, name: user.name }],
      sender: { email: process.env.SENDER_EMAIL || 'intelcounselling@gmail.com', name: 'Intel Counselling' },
      subject: 'Your Intel Counselling account will be deleted',
      htmlContent: emailLayout({
        title: 'Your Intel Counselling account will be deleted',
        preheader: `We will delete your inactive account on ${deleteOn}.`,
        eyebrow: 'Privacy notice',
        heading: 'We will delete your inactive account',
        body:
          para(`Hi ${String(user.name || '').split(' ')[0]}, you have not used your Intel Counselling account for a long time, so to protect your privacy we will delete it, together with your results, on <strong>${deleteOn}</strong>.`) +
          panel('Want to keep it? Just sign in and take or retake any assessment before then. You can also download your data from My Results first.', 'sage') +
          button('Sign in to keep my account', `${site}/login`),
      }),
    }),
  }).catch((e) => console.error('[retention] warning email failed', e.message));
}

export async function runRetention() {
  const apply = process.env.RETENTION_ENABLED === 'true';
  const tag = apply ? '[retention]' : '[retention dry-run]';

  // 1. Anonymous screenings nobody claimed
  const anon = await countOrDeleteAnonymousResults(ago(days('RETENTION_ANON_DAYS', 30)), apply);
  console.log(`${tag} anonymous screenings ${apply ? 'deleted' : 'to delete'}: ${anon}`);

  // 2. Inactive website accounts: warn, then delete after the warning period
  const warnDays = days('RETENTION_WARNING_DAYS', 30);
  const inactive = await findInactiveUsers(ago(days('RETENTION_INACTIVE_DAYS', 1095)));
  let warned = 0;
  let erased = 0;
  for (const u of inactive) {
    if (!u.inactivity_warned_at) {
      warned++;
      if (apply) {
        await sendWarning(u, new Date(Date.now() + warnDays * DAY).toDateString());
        await markInactivityWarned(u.id);
      }
    } else if (new Date(u.inactivity_warned_at) < new Date(Date.now() - warnDays * DAY)) {
      erased++;
      if (apply) await eraseUser(u.id, u.email);
    }
  }
  console.log(`${tag} inactive accounts warned: ${warned}, deleted after warning: ${erased}`);

  // 3. School-portal counselling records, 3 years after the student's last session
  try {
    const prisma = require('./mindbridge/prisma.js');
    const cutoff = new Date(ago(days('RETENTION_SESSION_DAYS', 1095)));
    const lastSessions = await prisma.appointment.groupBy({ by: ['patientId'], _max: { slot: true } });
    const expired = lastSessions.filter((s) => s._max.slot && s._max.slot < cutoff).map((s) => s.patientId);
    if (expired.length && apply) {
      await prisma.counsellingNote.deleteMany({ where: { patientId: { in: expired } } });
      await prisma.appointment.deleteMany({ where: { patientId: { in: expired } } });
    }
    console.log(`${tag} students whose session records ${apply ? 'were deleted' : 'would be deleted'}: ${expired.length}`);
    // 4. Access logs older than a year
    const pruned = apply ? (await prisma.auditLog.deleteMany({ where: { at: { lt: new Date(ago(365)) } } })).count
      : await prisma.auditLog.count({ where: { at: { lt: new Date(ago(365)) } } });
    console.log(`${tag} access-log entries older than a year ${apply ? 'deleted' : 'to delete'}: ${pruned}`);
  } catch (err) {
    console.error('[retention] school-portal step failed:', err.message);
  }
}

// Daily, starting a minute after boot (never blocks startup)
export function scheduleRetention() {
  const tick = () => runRetention().catch((e) => console.error('[retention] failed:', e));
  setTimeout(tick, 60 * 1000).unref?.();
  setInterval(tick, DAY).unref?.();
}
