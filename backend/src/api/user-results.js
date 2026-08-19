import { getUserResults } from '../db.js';
import { getAuthenticatedUserId } from '../token.js';

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
    // The authenticated user is the only one allowed to list their results;
    // any client-supplied userId is ignored.
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const results = await getUserResults(userId);

    res.status(200).json({ results });
  } catch (error) {
    console.error('Error fetching user results:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
