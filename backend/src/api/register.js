import crypto from 'crypto';
import { createUser, getUserByEmail } from '../db.js';

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
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const userId = crypto.randomUUID();
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    await createUser(userId, name, email, hashedPassword, phone);

    res.status(200).json({
      success: true,
      user: { id: userId, name, email, phone }
    });
  } catch (error) {
    console.error('Error in registration handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
