import { linkResultToUser } from '../db.js';
import { getAuthenticatedUserId } from '../token.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Results may only be linked to the authenticated user's own account;
    // any client-supplied userId is ignored.
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { resultId } = req.body;

    if (!resultId) {
      return res.status(400).json({ error: 'Missing resultId' });
    }

    const linked = await linkResultToUser(resultId, userId);
    if (!linked) {
      return res.status(409).json({ error: 'Result not found or already linked to an account' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in linkResult handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
