import crypto from 'crypto';
import { encrypt } from './_encryption.js';

// Vercel KV (Redis) — automatically injected when you add KV store in Vercel dashboard
// Falls back to a simple in-memory map for local dev (won't persist across restarts)
let kv;
const memoryStore = new Map();

async function getKV() {
  if (kv) return kv;
  try {
    // Vercel KV SDK — installed via @vercel/kv
    const { kv: vercelKV } = await import('@vercel/kv');
    kv = vercelKV;
    return kv;
  } catch {
    // Fallback: in-memory (local dev without KV configured)
    return null;
  }
}

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
    const payload = JSON.stringify({ encrypted, iv });

    const store = await getKV();
    if (store) {
      // Store with 24-hour TTL (86400 seconds)
      await store.set(`assessment:${id}`, payload, { ex: 86400 });
    } else {
      // Local dev fallback
      memoryStore.set(id, payload);
    }

    res.status(200).json({ id });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
