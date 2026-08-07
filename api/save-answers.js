import crypto from 'crypto';
import { encrypt } from './_encryption.js';
import { db } from './_firebase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { answers } = req.body;
    if (!answers || typeof answers !== 'string') {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }

    const { encrypted, iv } = encrypt(answers);
    const id = crypto.randomUUID();
    
    if (db) {
      // Set to Firestore in the 'assessments' collection
      await db.collection('assessments').doc(id).set({
        encrypted,
        iv,
        createdAt: new Date()
      });
    } else {
      console.warn('Firebase DB not initialized. Skipping save.');
      return res.status(500).json({ error: 'Database not configured' });
    }

    res.status(200).json({ id });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
