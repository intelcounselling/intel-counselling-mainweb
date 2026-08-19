import crypto from 'crypto';
import { encrypt } from '../encryption.js';
import { insertResult } from '../db.js';
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
    const { answers, testId } = req.body;

    if (!answers || typeof answers !== 'string') {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }

    // Owner identity comes only from the auth token — a client-supplied userId
    // could attach a result to someone else's account.
    const userId = getAuthenticatedUserId(req);

    const { encrypted, iv } = encrypt(answers);
    const id = crypto.randomUUID();

    // Default to 'career' if answers length is 200
    const resolvedTestId = testId || (answers.length === 200 ? 'career' : null);

    await insertResult(id, encrypted, iv, userId || null, resolvedTestId);

    res.status(200).json({ id });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
