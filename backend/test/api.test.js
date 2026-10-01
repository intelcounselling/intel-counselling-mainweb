// Integration tests for the main-site API (auth, results pipeline, payments).
// Runs against an isolated temp SQLite DB — never touches database.sqlite.
//   npm test --workspace=backend
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Env must be set before importing app modules
process.env.ENCRYPTION_KEY = 'test-encryption-key';
process.env.AUTH_TOKEN_SECRET = 'test-token-secret';
process.env.CASHFREE_SECRET_KEY = 'test-cashfree-secret';
delete process.env.BREVO_API_KEY; // never send real email from tests
delete process.env.DATABASE_URL;  // tests always run against the SQLite driver
const TMP_DB = path.join(os.tmpdir(), `intel-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`);
process.env.SQLITE_PATH = TMP_DB;

const express = (await import('express')).default;
const apiRouter = (await import('../src/routes/api.js')).default;
const db = await import('../src/db.js');
const { scoreCareerAnswers } = await import('../src/careerScoring.js');
const { signInWithGoogleIdentity } = await import('../src/api/google-login.js');
const { decrypt } = await import('../src/encryption.js');
const { hashOtp, OTP_PURPOSE } = await import('../src/otp.js');

let server;
let base;

before(async () => {
  const app = express();
  app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
  app.use('/api', apiRouter);
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  base = `http://127.0.0.1:${server.address().port}`;
  // Let the async table/column migrations drain through sqlite's queue
  await new Promise((r) => setTimeout(r, 500));
});

after(async () => {
  await new Promise((r) => server.close(r));
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(TMP_DB + suffix); } catch {}
  }
});

const post = (p, body, headers = {}) =>
  fetch(`${base}/api${p}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
const get = (p, headers = {}) => fetch(`${base}/api${p}`, { headers });

const EMAIL = 'tester@example.com';
const PASSWORD = 'S0me-Str0ng-Pass!';
let token;
let userId;

test('register requires email verification before issuing a session', async () => {
  const res = await post('/register', { name: 'Tester', email: EMAIL, password: PASSWORD, phone: '9999999999' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.requiresVerification, true);
  assert.ok(!data.token, 'unverified register must not return a token');

  // Unverified login is rejected with EMAIL_NOT_VERIFIED (only after the
  // password checks out — no account enumeration).
  const locked = await post('/login', { email: EMAIL, password: PASSWORD });
  assert.equal(locked.status, 403);
  const lockedData = await locked.json();
  assert.equal(lockedData.code, 'EMAIL_NOT_VERIFIED');

  // Seed a known OTP so verification completes without real email delivery.
  await db.updateUserOTP(EMAIL, hashOtp('654321'), new Date(Date.now() + 10 * 60 * 1000).toISOString(), OTP_PURPOSE.VERIFY_EMAIL);
  const ver = await post('/verify-email', { email: EMAIL, otp: '654321' });
  assert.equal(ver.status, 200);
  const vdata = await ver.json();
  assert.ok(vdata.token, 'verified user must receive a session token');
  assert.ok(vdata.user?.id, 'user id missing');
  token = vdata.token;
  userId = vdata.user.id;
});

test('login succeeds with correct password, fails with wrong one', async () => {
  const ok = await post('/login', { email: EMAIL, password: PASSWORD });
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.ok(data.token);
  token = data.token;

  const bad = await post('/login', { email: EMAIL, password: 'wrong-password' });
  assert.equal(bad.status, 400);
});

test('save-answers validates input', async () => {
  assert.equal((await post('/save-answers', { answers: 'abc' })).status, 400);
  assert.equal((await post('/save-answers', { answers: '123', testId: 'nope' })).status, 400);
  const ok = await post('/save-answers', { answers: '0123', testId: 'phq9' });
  assert.equal(ok.status, 200);
  assert.ok((await ok.json()).id);
});

test('user-results requires a valid token', async () => {
  assert.equal((await get('/user-results')).status, 401);
  assert.equal((await get('/user-results', { Authorization: 'Bearer garbage' })).status, 401);
  const ok = await get('/user-results', { Authorization: `Bearer ${token}` });
  assert.equal(ok.status, 200);
  assert.deepEqual((await ok.json()).results, []);
});

test('anonymous results are readable; owned results require the owner token', async () => {
  // Anonymous save → readable without auth (capability UUID)
  const anon = await (await post('/save-answers', { answers: '01230', testId: 'gad7' })).json();
  const anonLoad = await get(`/load-answers?id=${anon.id}`);
  assert.equal(anonLoad.status, 200);
  assert.equal((await anonLoad.json()).answers, '01230');

  // Owned save (token) → 403 without token, 200 with it
  const owned = await (await post('/save-answers', { answers: '43210', testId: 'pss10' }, { Authorization: `Bearer ${token}` })).json();
  assert.equal((await get(`/load-answers?id=${owned.id}`)).status, 403);
  const withAuth = await get(`/load-answers?id=${owned.id}`, { Authorization: `Bearer ${token}` });
  assert.equal(withAuth.status, 200);
});

test('link-result claims an unowned result once, then conflicts', async () => {
  const anon = await (await post('/save-answers', { answers: '11111', testId: 'sas' })).json();
  assert.equal((await post('/link-result', { resultId: anon.id })).status, 401);
  const first = await post('/link-result', { resultId: anon.id }, { Authorization: `Bearer ${token}` });
  assert.equal(first.status, 200);
  const second = await post('/link-result', { resultId: anon.id }, { Authorization: `Bearer ${token}` });
  assert.equal(second.status, 409);
});

test('order lifecycle gates the career pipeline', async () => {
  // Unknown orderId on save-answers → 409
  const badOrder = await post('/save-answers', {
    answers: '4'.repeat(200),
    orderId: 'ORDER_' + 'a'.repeat(16),
  });
  assert.equal(badOrder.status, 409);

  // Created-but-unpaid order → still 409
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'career_assessment_plus', 4999);
  const unpaid = await post('/save-answers', { answers: '4'.repeat(200), orderId });
  assert.equal(unpaid.status, 409);

  // Paid order + registration → linked result
  await db.markOrderPaid(orderId);
  const paid = await post('/save-answers', {
    answers: '4'.repeat(200),
    orderId,
    registration: { name: 'Tester', email: EMAIL, age: 21 },
  });
  assert.equal(paid.status, 200);
  const { id: resultId, freeSessionAvailable } = await paid.json();
  assert.equal(freeSessionAvailable, true, 'plus package offers the free session');
  assert.equal((await (await get(`/load-answers?id=${resultId}`)).json()).freeSessionAvailable, true);

  // Same order can't back a second result
  const reuse = await post('/save-answers', { answers: '3'.repeat(200), orderId });
  assert.equal(reuse.status, 409);

  // send-career-results: 400 without resultId, 404 unknown result.
  assert.equal((await post('/send-career-results', {})).status, 400);
  assert.equal((await post('/send-career-results', { resultId: crypto.randomUUID() })).status, 404);
  // For the valid result the handler proceeds past all gates and only then
  // fails on the missing BREVO_API_KEY (500) — proving payment/identity gates pass.
  const gated = await post('/send-career-results', { resultId });
  assert.equal(gated.status, 500);
});

test('career purchase entitlement unlocks re-view, retake and re-send', async () => {
  // Not entitled before any purchase
  const before = await get('/career-access', { Authorization: `Bearer ${token}` });
  assert.equal(before.status, 200);
  assert.deepEqual(await before.json(), { entitled: false });

  // Simulate a purchase: paid order linked to a career result
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'career_assessment', 2999);
  await db.markOrderPaid(orderId);
  const paid = await post('/save-answers', {
    answers: '4'.repeat(200),
    orderId,
    registration: { name: 'Tester', email: EMAIL },
  });
  assert.equal(paid.status, 200);
  const { id: paidResultId } = await paid.json();

  // Attach the purchase to the tester's account (logged-in purchase flow)
  const link = await post('/link-result', { resultId: paidResultId }, { Authorization: `Bearer ${token}` });
  assert.equal(link.status, 200);

  // Now entitled
  const after = await get('/career-access', { Authorization: `Bearer ${token}` });
  assert.equal(after.status, 200);
  assert.deepEqual(await after.json(), { entitled: true });

  // user-results lists career results with their purchase status
  const list = await (await get('/user-results', { Authorization: `Bearer ${token}` })).json();
  const careerRows = list.results.filter((r) => r.test_id === 'career');
  assert.equal(careerRows.length, 1);
  assert.ok(careerRows[0].order_id, 'paid career result carries its order id');

  // Retake: a fresh result owned by the entitled user (no order attached)
  // passes the payment gate via the retake allowance → proceeds to Brevo (500).
  const retake = await post(
    '/save-answers',
    { answers: '2'.repeat(200), registration: { name: 'Tester', email: EMAIL } },
    { Authorization: `Bearer ${token}` }
  );
  assert.equal(retake.status, 200);
  const { id: retakeId } = await retake.json();
  const reEmail = await post('/send-career-results', { resultId: retakeId }, { Authorization: `Bearer ${token}` });
  assert.equal(reEmail.status, 500);

  // The paywall is enforced at storage: an anonymous, unpaid career result is
  // refused outright, so there is nothing to re-view or email for free.
  const anon = await post('/save-answers', { answers: '2'.repeat(200), registration: { name: 'Anon', email: 'anon@example.com' } });
  assert.equal(anon.status, 402);
});

test('booking emails require payment proof', async () => {
  const noOrder = await post('/send-booking-email', { toName: 'T', customerEmail: EMAIL });
  assert.equal(noOrder.status, 402);
  const freeNoRef = await post('/send-booking-email', { toName: 'T', customerEmail: EMAIL, isFree: true });
  assert.equal(freeNoRef.status, 402);
});

test('a consumed order can never be flipped back to PAID', async () => {
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'session_online', 1600);
  assert.equal(await db.markOrderPaid(orderId), true);
  assert.equal(await db.markOrderUsed(orderId), true);
  // Re-running verify-payment / the webhook after booking must not re-arm it
  assert.equal(await db.markOrderPaid(orderId), false);
  assert.equal((await db.getOrder(orderId)).status, 'USED');
});

test('booking claims the order once and releases it when sending fails', async () => {
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'session_online', 1600);
  await db.markOrderPaid(orderId);
  const body = { toName: 'T', customerEmail: EMAIL, orderId };

  // Stub only Brevo; the test client's own requests still hit the server
  const realFetch = globalThis.fetch;
  let brevoOk = false;
  globalThis.fetch = (url, opts) =>
    String(url).includes('api.brevo.com')
      ? Promise.resolve(new Response('{}', { status: brevoOk ? 201 : 500, headers: { 'Content-Type': 'application/json' } }))
      : realFetch(url, opts);
  process.env.BREVO_API_KEY = 'test';
  try {
    assert.equal((await post('/send-booking-email', body)).status, 500);
    assert.equal((await db.getOrder(orderId)).status, 'PAID', 'failed send releases the order for a retry');

    brevoOk = true;
    const [a, b] = await Promise.all([post('/send-booking-email', body), post('/send-booking-email', body)]);
    assert.deepEqual([a.status, b.status].sort(), [200, 402], 'concurrent requests book exactly once');
    assert.equal((await db.getOrder(orderId)).status, 'USED');
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.BREVO_API_KEY;
  }
});

test('inquiry email validates input; load-answers rejects array ids', async () => {
  assert.equal((await post('/send-inquiry-email', { name: 'A', email: 'nope', message: 'hi' })).status, 400);
  assert.equal((await get('/load-answers?id=a&id=b')).status, 400);
});

test('webhook rejects stale timestamps (replay window)', async () => {
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'session_online', 1500);
  const payload = JSON.stringify({
    type: 'PAYMENT_SUCCESS_WEBHOOK',
    data: { order: { order_id: orderId, order_amount: 1500 }, payment: { payment_status: 'SUCCESS' } },
  });
  const ts = String(Date.now() - 10 * 60 * 1000);
  const sig = crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY).update(ts + payload).digest('base64');
  const res = await fetch(`${base}/api/cashfree-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-timestamp': ts, 'x-webhook-signature': sig },
    body: payload,
  });
  assert.equal(res.status, 401);
  assert.equal((await db.getOrder(orderId)).status, 'CREATED');
});

test('OTP attempts are spent atomically (parallel guesses cannot exceed the budget)', async () => {
  const email = 'otp-race@example.com';
  await post('/register', { name: 'Race', email, password: 'S0me-Str0ng-Pass!' });
  const claims = await Promise.all(Array.from({ length: 12 }, () => db.claimOtpAttempt(email, 5)));
  assert.equal(claims.filter(Boolean).length, 5);
});

test('paid booking records a booking row', async () => {
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'session_inperson', 2000);
  await db.markOrderPaid(orderId);
  const realFetch = globalThis.fetch;
  globalThis.fetch = (url, opts) =>
    String(url).includes('api.brevo.com')
      ? Promise.resolve(new Response('{}', { status: 201, headers: { 'Content-Type': 'application/json' } }))
      : realFetch(url, opts);
  process.env.BREVO_API_KEY = 'test';
  try {
    const res = await post('/send-booking-email', {
      toName: 'Booked Person', customerEmail: EMAIL, orderId,
      sessionMode: 'In-Person', appointmentDate: '2026-12-01', appointmentTime: '10:00 AM',
    });
    assert.equal(res.status, 200);
    const rows = await db.getBookingsByOrder(orderId);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].appointment_date, '2026-12-01');
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.BREVO_API_KEY;
  }
});

test('verify-payment validates order id format', async () => {
  assert.equal((await post('/verify-payment', { orderId: 'nonsense' })).status, 400);
});

test('cashfree webhook rejects bad signatures and accepts valid ones', async () => {
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'session_online', 1500);

  const payload = JSON.stringify({
    type: 'PAYMENT_SUCCESS_WEBHOOK',
    data: { order: { order_id: orderId, order_amount: 1500 }, payment: { payment_status: 'SUCCESS' } },
  });
  const ts = String(Date.now());
  const sig = crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY).update(ts + payload).digest('base64');

  const badSig = await fetch(`${base}/api/cashfree-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-timestamp': ts, 'x-webhook-signature': 'AAAA' },
    body: payload,
  });
  assert.equal(badSig.status, 401);

  const good = await fetch(`${base}/api/cashfree-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-webhook-timestamp': ts, 'x-webhook-signature': sig },
    body: payload,
  });
  assert.equal(good.status, 200);
  assert.equal((await db.getOrder(orderId)).status, 'PAID');
});

test('profile: intake is saved encrypted on the account and reused for results', async () => {
  const auth = { Authorization: `Bearer ${token}` };
  const put = (body) => fetch(`${base}/api/profile`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(body),
  });

  assert.equal((await get('/profile')).status, 401);
  assert.equal((await (await get('/profile', auth)).json()).complete, false);

  assert.equal((await put({ phone: '9000000000', age: 'abc', gender: 'Other', occupation: 'Student' })).status, 400);
  assert.equal((await put({ phone: '9000000000' })).status, 400, 'required fields enforced');

  const saved = await put({ phone: '9000000000', age: 22, gender: 'Other', occupation: 'Student', reason: 'curious' });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).firstTime, true);

  const prof = await (await get('/profile', auth)).json();
  assert.equal(prof.complete, true);
  assert.equal(prof.profile.occupation, 'Student');

  // Stored encrypted, not as plain JSON
  const raw = await db.getAccountById(userId);
  assert.ok(!String(raw.profile).includes('Student'));

  // A signed-in result gets the account's details, ignoring client-sent identity
  const res = await post('/save-answers', { answers: '1'.repeat(9), testId: 'phq9', registration: { name: 'Spoof', email: 'spoof@example.com' } }, auth);
  assert.equal(res.status, 200);
  const { id } = await res.json();
  const row = await db.getResultFull(id);
  const reg = JSON.parse(decrypt(row.registration, row.registration_iv));
  assert.equal(reg.email, EMAIL);
  assert.equal(reg.occupation, 'Student');
  assert.equal(row.user_id, userId);
});

test('google sign-in: creates verified accounts and evicts unverified squatters', async () => {
  // Not configured → 503, never a crash
  assert.equal((await post('/google-login', { credential: 'x' })).status, 503);

  const fresh = await signInWithGoogleIdentity({ email: 'NewGoogle@Example.com', name: 'New Google' });
  assert.equal(fresh.user.email, 'newgoogle@example.com');
  assert.equal((await get('/user-results', { Authorization: `Bearer ${fresh.token}` })).status, 200);

  // Squatter registers the victim's email with a password but never verifies
  const victim = 'victim@example.com';
  await post('/register', { name: 'Squatter', email: victim, password: 'squatter-pass-1' });
  await signInWithGoogleIdentity({ email: victim, name: 'Real Owner' });
  const squatterLogin = await post('/login', { email: victim, password: 'squatter-pass-1' });
  assert.equal(squatterLogin.status, 400, 'squatter password no longer works');
});

test('logout-all revokes outstanding tokens', async () => {
  const res = await post('/logout-all', {}, { Authorization: `Bearer ${token}` });
  assert.equal(res.status, 200);
  assert.equal((await get('/user-results', { Authorization: `Bearer ${token}` })).status, 401);
  // Fresh login works and yields a valid new token
  const relog = await (await post('/login', { email: EMAIL, password: PASSWORD })).json();
  assert.equal((await get('/user-results', { Authorization: `Bearer ${relog.token}` })).status, 200);
});

test('career scoring is sane', () => {
  const all4 = scoreCareerAnswers('4'.repeat(200));
  assert.equal(Object.keys(all4.mi).length, 8);
  Object.values(all4.mi).forEach((v) => assert.equal(v, 20));
  Object.values(all4.interests).forEach((v) => assert.equal(v, 40));
  Object.values(all4.personality).forEach((v) => assert.equal(v, 40));
  assert.equal(all4.summary.topIntelligence.length, 2);

  const all0 = scoreCareerAnswers('0'.repeat(200));
  Object.values(all0.mi).forEach((v) => assert.equal(v, 0));
  assert.throws(() => scoreCareerAnswers('123'));
  assert.throws(() => scoreCareerAnswers('5'.repeat(200)));
});
