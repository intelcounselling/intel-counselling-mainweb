import { authenticateRequest } from '../token.js';
import { getAccountById } from '../db.js';
import { getPrices } from '../pricing.js';
import { escapeHtml } from '../escape.js';
import {
  INTELL_TEST_IDS, INTELL_SERVICE_ID, publicDefinitions, hasIntellAccess, loadIntellResults, intellProfile, writeReport,
} from '../intell.js';

// GET /api/intell/tests — public: what the assessments are, plus the questions of the
// five Intell tests (PHQ-9 / GAD-7 run in the site's existing screening flow).
export function testsHandler(req, res) {
  res.json({ tests: publicDefinitions(), price: getPrices()[INTELL_SERVICE_ID] });
}

// GET /api/intell/status — the signed-in user's access, progress and integrated profile.
export async function statusHandler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const [entitled, results] = await Promise.all([hasIntellAccess(userId), loadIntellResults(userId)]);
    const latest = {};
    for (const r of results) if (!latest[r.testId]) latest[r.testId] = r;

    res.json({
      entitled,
      price: getPrices()[INTELL_SERVICE_ID],
      tests: INTELL_TEST_IDS.map((id) => ({
        id,
        done: !!latest[id],
        lastTakenAt: latest[id]?.takenAt || null,
        lastResultId: latest[id]?.id || null,
        severity: latest[id]?.severity || null,
      })),
      // Only buyers get the integrated profile (PHQ-9/GAD-7 alone stay free screenings)
      profile: entitled && results.length ? intellProfile(results) : null,
    });
  } catch (err) {
    console.error('intell status failed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// GET /api/intell/report — the full PDF (profile, test-wise interpretation, answers).
export async function reportHandler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!(await hasIntellAccess(userId))) return res.status(402).json({ error: 'Payment required' });
    const results = await loadIntellResults(userId);
    if (!results.length) return res.status(404).json({ error: 'Take an assessment first' });
    await writeReport(res, await getAccountById(userId), results);
  } catch (err) {
    console.error('intell report failed:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Email the team when a buyer's new result on its own needs clinical review.
// No answers in the email — the counsellor reads them in the report.
export async function notifyHighRisk(account, testName) {
  const apiKey = process.env.BREVO_API_KEY;
  const admin = process.env.ADMIN_EMAIL || 'intelcounselling@gmail.com';
  if (!apiKey) {
    console.warn(`[intell] high-risk result for ${account?.email} (${testName}); BREVO_API_KEY not set, no alert email sent`);
    return;
  }
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      to: [{ email: admin, name: 'Intel Counselling' }],
      sender: { email: process.env.SENDER_EMAIL || admin, name: 'Intel Counselling Alerts' },
      subject: `Priority review: Intell assessment result (${testName})`,
      htmlContent: `<p>A client's <strong>${escapeHtml(testName)}</strong> result needs clinical review (high score or the self-harm item).</p>
        <p>Client: <strong>${escapeHtml(account?.name || '')}</strong> &lt;${escapeHtml(account?.email || '')}&gt;${account?.phone ? `, ${escapeHtml(account.phone)}` : ''}</p>
        <p>Please reach out to them. Their full report is attached to any session they book, and they can share it from My Results.</p>`,
    }),
  });
  if (!res.ok) console.error('High-risk alert email failed:', res.status, await res.text().catch(() => ''));
}
