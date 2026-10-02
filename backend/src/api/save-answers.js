import crypto from 'crypto';
import { encrypt } from '../encryption.js';
import { insertResult, getOrder, linkOrderToResult, saveResultRegistration, getPaidCareerResultCount } from '../db.js';
import { authenticateRequest } from '../token.js';
import { registrationFor } from '../profile.js';
import { getAccountById } from '../db.js';
import { INTELL_TEST_IDS, isIntellOnlyTest, validAnswers, hasIntellAccess, scoreResult, isHighRisk } from '../intell.js';
import { notifyHighRisk } from './intell.js';

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

    const KNOWN_TESTS = ['career', 'phq9', 'gad7', 'sleep', 'pss10', 'sas', ...INTELL_TEST_IDS.filter(isIntellOnlyTest)];
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
    let order = null;
    if (orderId !== undefined && orderId !== null) {
      if (typeof orderId !== 'string' || !/^ORDER_[a-f0-9]+$/.test(orderId)) {
        return res.status(400).json({ error: 'Invalid orderId' });
      }
      order = await getOrder(orderId);
      if (!order || order.status !== 'PAID' || !String(order.service_id).startsWith('career') || order.result_id) {
        return res.status(409).json({ error: 'Order already used or not eligible' });
      }
    }

    // Owner identity comes only from the auth token — a client-supplied userId
    // could attach a result to someone else's account.
    const userId = await authenticateRequest(req);

    // Signed-in users: identity + intake come from the account, never the client
    if (userId) {
      const accountRegistration = await registrationFor(userId);
      if (accountRegistration) sanitizedRegistration = accountRegistration;
    }

    // Default to 'career' if answers length is 200
    const resolvedTestId = testId || (answers.length === 200 ? 'career' : null);

    // The career assessment is a paid product: storing (and so re-viewing or
    // emailing) a result requires a verified PAID order, or a signed-in account
    // that already owns a paid career result (free retakes).
    if (resolvedTestId === 'career' && !order) {
      const entitled = userId ? (await getPaidCareerResultCount(userId)) > 0 : false;
      if (!entitled) {
        return res.status(402).json({ error: 'Payment required to save a career assessment result' });
      }
    }

    // Intell assessments are paid (one purchase per account) and fully validated:
    // a missing or out-of-range answer would silently skew the score.
    const intellBuyer = userId ? await hasIntellAccess(userId) : false;
    if (isIntellOnlyTest(resolvedTestId)) {
      if (!intellBuyer) return res.status(402).json({ error: 'Payment required for the Intell assessments' });
      if (!validAnswers(resolvedTestId, answers)) return res.status(400).json({ error: 'Please answer every question' });
    }

    const { encrypted, iv } = encrypt(answers);
    const id = crypto.randomUUID();

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

    // Buyers' PHQ-9 / GAD-7 / Intell results feed their profile; one that on its own
    // needs clinical review alerts the team (fire-and-forget: never blocks the save).
    if (intellBuyer && INTELL_TEST_IDS.includes(resolvedTestId) && validAnswers(resolvedTestId, answers)) {
      const scored = scoreResult(resolvedTestId, answers, new Date(), id);
      if (isHighRisk(scored)) {
        getAccountById(userId).then((acct) => notifyHighRisk(acct, scored.test.name)).catch((e) => console.error('High-risk alert failed:', e));
      }
    }

    // Only the "+ session" package includes the complimentary session — the
    // client uses this to decide whether to offer it at all.
    res.status(200).json({ id, freeSessionAvailable: order?.service_id === 'career_assessment_plus' });
  } catch (error) {
    console.error('Error saving answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
