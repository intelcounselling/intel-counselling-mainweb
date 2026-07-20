import { linkResultToUser } from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { resultId, userId } = req.body;

    if (!resultId || !userId) {
      return res.status(400).json({ error: 'Missing resultId or userId' });
    }

    await linkResultToUser(resultId, userId);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in linkResult handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
