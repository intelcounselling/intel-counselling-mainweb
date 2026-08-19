import { decrypt } from './_encryption.js';
import { db } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });

    if (!db) {
      return res.status(500).json({ error: 'Database not configured' });
    }

    const docRef = db.collection('assessments').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    const data = doc.data();
    const answers = decrypt(data.encrypted, data.iv);

    res.status(200).json({ answers });
  } catch (error) {
    console.error('Error loading answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
