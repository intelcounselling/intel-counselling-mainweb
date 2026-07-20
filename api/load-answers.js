import { decrypt } from './_encryption.js';

let kv;
const memoryStore = new Map();

async function getKV() {
  if (kv) return kv;
  try {
    const { kv: vercelKV } = await import('@vercel/kv');
    kv = vercelKV;
    return kv;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id parameter' });

    const store = await getKV();
    let raw;

    if (store) {
      raw = await store.get(`assessment:${id}`);
    } else {
      raw = memoryStore.get(id) || null;
    }

    if (!raw) return res.status(404).json({ error: 'Result not found' });

    const { encrypted, iv } = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const answers = decrypt(encrypted, iv);

    res.status(200).json({ answers });
  } catch (error) {
    console.error('Error loading answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
