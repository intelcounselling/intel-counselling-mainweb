import { decrypt } from '../encryption.js';
import { getResultById } from '../db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }

    const row = await getResultById(id);

    if (!row) {
      return res.status(404).json({ error: 'Result not found' });
    }

    const answers = decrypt(row.encrypted_answers, row.iv);

    res.status(200).json({ answers });
  } catch (error) {
    console.error('Error loading answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
