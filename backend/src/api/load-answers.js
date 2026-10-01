import { decrypt } from '../encryption.js';
import { getResultFull, getOrder } from '../db.js';
import { authenticateRequest } from '../token.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id } = req.query;

    // ?id=a&id=b arrives as an array and would crash the query with a 500
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing id parameter' });
    }

    const row = await getResultFull(id);

    if (!row) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Anonymous results (no owner yet) are viewable by anyone holding the
    // unguessable UUID — needed right after taking a test while logged out.
    // Once a result is linked to an account, only that user may read it.
    if (row.user_id) {
      const authenticatedUserId = await authenticateRequest(req);
      if (!authenticatedUserId || authenticatedUserId !== row.user_id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const answers = decrypt(row.encrypted_answers, row.iv);

    // Free session is still claimable only while the plus-package order is PAID (USED = claimed)
    const order = row.order_id ? await getOrder(row.order_id) : null;
    const freeSessionAvailable = order?.service_id === 'career_assessment_plus' && order.status === 'PAID';

    res.status(200).json({ answers, freeSessionAvailable });
  } catch (error) {
    console.error('Error loading answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
