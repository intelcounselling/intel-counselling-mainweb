import { getAccountById, exportUserData, eraseUser } from '../db.js';
import { authenticateRequest } from '../token.js';
import { decrypt } from '../encryption.js';
import { readProfile } from '../profile.js';

// GET /api/my-data — everything we hold about the signed-in person, as a JSON download
export async function exportHandler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const account = await getAccountById(userId);
    if (!account) return res.status(401).json({ error: 'Unauthorized' });

    const data = await exportUserData(userId, account.email);
    const { guardianPending, ...profile } = readProfile(account) || {};
    const results = data.results.map((r) => {
      let answers = null;
      try { answers = decrypt(r.encrypted_answers, r.iv); } catch { /* unreadable row */ }
      return { id: r.id, test: r.test_id, takenAt: r.created_at, answers };
    });

    res.setHeader('Content-Disposition', 'attachment; filename="intel-counselling-my-data.json"');
    res.json({
      exportedAt: new Date().toISOString(),
      account: { name: account.name, email: account.email, phone: account.phone },
      intake: profile,
      results,
      payments: data.orders,
      bookings: data.bookings,
      consents: data.consents,
    });
  } catch (err) {
    console.error('my-data export failed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

// DELETE /api/account { confirm: 'DELETE MY ACCOUNT' } — erases the account and its results
export async function deleteHandler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (req.body?.confirm !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({ error: 'Type DELETE MY ACCOUNT to confirm' });
    }
    const account = await getAccountById(userId);
    if (!account) return res.status(401).json({ error: 'Unauthorized' });
    await eraseUser(userId, account.email);
    res.json({ deleted: true });
  } catch (err) {
    console.error('account deletion failed:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
