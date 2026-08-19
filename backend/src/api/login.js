import { getUserByEmail, updateUserPassword } from '../db.js';
import { hashPassword, verifyPassword } from '../password.js';
import { signToken } from '../token.js';

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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const { valid, needsUpgrade } = await verifyPassword(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Transparently migrate legacy unsalted SHA-256 hashes to scrypt
    if (needsUpgrade) {
      await updateUserPassword(user.email, await hashPassword(password)).catch((err) =>
        console.error('Failed to upgrade legacy password hash:', err)
      );
    }

    res.status(200).json({
      success: true,
      token: signToken(user.id, user.token_version == null ? 0 : user.token_version),
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone }
    });
  } catch (error) {
    console.error('Error in login handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
