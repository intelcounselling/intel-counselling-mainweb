import { bumpTokenVersion } from '../db.js';
import { authenticateRequest } from '../token.js';

// "Log out everywhere": bumps the user's token_version, which invalidates
// every outstanding session token — including the one used for this request.
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
    const userId = await authenticateRequest(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await bumpTokenVersion(userId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in logout-all handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
