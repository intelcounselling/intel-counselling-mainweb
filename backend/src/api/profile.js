import { getAccountById, setUserProfile } from '../db.js';
import { authenticateRequest } from '../token.js';
import { sanitizeProfile, isProfileComplete, encryptProfile, readProfile } from '../profile.js';

// GET /api/profile → { user, profile, complete }
// PUT /api/profile { name?, phone, age, gender, occupation, reason? }
export default async function handler(req, res) {
  try {
    const userId = await authenticateRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const account = await getAccountById(userId);
    if (!account) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'PUT') {
      const { profile, error } = sanitizeProfile(req.body);
      if (error) return res.status(400).json({ error });
      if (!isProfileComplete(profile)) {
        return res.status(400).json({ error: 'Please fill in phone, age, gender and occupation.' });
      }
      const name = typeof req.body.name === 'string' && req.body.name.trim()
        ? req.body.name.trim().slice(0, 100)
        : account.name;
      const { encrypted, iv } = encryptProfile(profile);
      await setUserProfile(userId, name, profile.phone, encrypted, iv);
      return res.status(200).json({
        user: { id: account.id, name, email: account.email, phone: profile.phone },
        profile,
        complete: true,
        firstTime: !account.profile,
      });
    }

    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const profile = readProfile(account);
    res.status(200).json({
      user: { id: account.id, name: account.name, email: account.email, phone: account.phone },
      profile,
      complete: isProfileComplete(profile),
    });
  } catch (error) {
    console.error('Error in profile handler:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
