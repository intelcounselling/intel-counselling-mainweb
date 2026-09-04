import { getPaidCareerResultCount } from '../db.js';
import { authenticateRequest } from '../token.js';

// Purchase entitlement for the career guidance assessment. A signed-in user
// is entitled once they own at least one career result with a verified paid
// order linked — they may then re-view and re-take the test for free.
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
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const paidCount = await getPaidCareerResultCount(userId);
    res.status(200).json({ entitled: paidCount > 0 });
  } catch (error) {
    console.error('Error checking career access:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
