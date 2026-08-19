import crypto from 'crypto';
import { encrypt } from '../encryption.js';
import { insertResult, getOrder, linkOrderToResult, saveResultRegistration } from '../db.js';
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
    const { answers, testId, registration, orderId } = req.body;

    // Answers are always a digit string (one digit per question, max 200 questions)
    if (!answers || typeof answers !== 'string' || !/^\d{1,300}$/.test(answers)) {
      return res.status(400).json({ error: 'Invalid answers payload' });
    }

    const KNOWN_TESTS = ['career', 'phq9', 'gad7', 'sleep', 'pss10', 'sas'];
    if (testId != null && !KNOWN_TESTS.includes(testId)) {
      return res.status(400).json({ error: 'Unknown test id' });
    }

    // Optional registration details (health data — validated, encrypted, never logged)
    let sanitizedRegistration = null;
    if (registration !== undefined && registration !== null) {
      if (typeof registration !== 'object' || Array.isArray(registration)) {
        return res.status(400).json({ error: 'Invalid registration payload' });
      }
      const ALLOWED_KEYS = ['name', 'email', 'phone', 'age', 'gender', 'occupation', 'reason'];
      sanitizedRegistration = {};
      for (const key of ALLOWED_KEYS) {
        const value = registration[key];
        if (value === undefined || value === null) continue;
        if (typeof value !== 'string' && typeof value !== 'number') {
          return res.status(400).json({ error: 'Invalid registration payload' });
        }
        sanitizedRegistration[key] = String(value).slice(0, 200);
      }
      if (!sanitizedRegistration.name || !sanitizedRegistration.email) {
        return res.status(400).json({ error: 'Invalid registration payload' });
      }
    }

    // Optional paid-order link (career tests only, single-use, must be verified PAID)
    if (orderId !== undefined && orderId !== null) {
      if (typeof orderId !== 'string' || !/^ORDER_[a-f0-9]+$/.test(orderId)) {
        return res.status(400).json({ error: 'Invalid orderId' });
      }
      const order = await getOrder(orderId);
      if (!order || order.status !== 'PAID' || !String(order.service_id).startsWith('career') || order.result_id) {
        return res.status(409).json({ error: 'Order already used or not eligible' });
      }
    }

    // Owner identity comes only from the auth token — a client-supplied userId
    // could attach a result to someone else's account.
    const userId = getAuthenticatedUserId(req);

    const { encrypted, iv } = encrypt(answers);
    const id = crypto.randomUUID();

    // Default to 'career' if answers length is 200
    const resolvedTestId = testId || (answers.length === 200 ? 'career' : null);

    await insertResult(id, encrypted, iv, userId || null, resolvedTestId);

    if (sanitizedRegistration) {
      const { encrypted: regEncrypted, iv: regIv } = encrypt(JSON.stringify(sanitizedRegistration));
      await saveResultRegistration(id, regEncrypted, regIv);
    }

    if (orderId) {
      // Atomic claim — a concurrent request may have consumed the order since the pre-check
      const linked = await linkOrderToResult(orderId, id);
      if (!linked) {
        return res.status(409).json({ error: 'Order already used or not eligible' });
      }
    }

    res.status(200).json({ id });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
