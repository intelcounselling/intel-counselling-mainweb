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
process.env.RAZORPAY_KEY_ID = 'rzp_test_key';
process.env.RAZORPAY_KEY_SECRET = 'test-razorpay-secret';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test-razorpay-webhook-secret';
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
  // Any query awaits db.js's ready() — i.e. every table/column migration —
  // so tests never race the schema (a fixed sleep flaked under CPU load).
  await db.countUsers();
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

// Stubs only api.razorpay.com; the test client's own requests still hit the server.
function mockRazorpay(routes) {
  const realFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = (url, opts = {}) => {
    const u = String(url);
    if (!u.startsWith('https://api.razorpay.com/')) return realFetch(url, opts);
    const path = u.replace('https://api.razorpay.com/v1', '');
    calls.push({ method: opts.method || 'GET', path, body: opts.body ? JSON.parse(opts.body) : null });
    const hit = routes[`${opts.method || 'GET'} ${path}`];
    return Promise.resolve(new Response(JSON.stringify(hit ? hit() : { error: { description: 'not mocked' } }), {
      status: hit ? 200 : 404, headers: { 'Content-Type': 'application/json' },
    }));
  };
  return { calls, restore: () => { globalThis.fetch = realFetch; } };
}

const checkoutSig = (rzpOrderId, paymentId) =>
  crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${rzpOrderId}|${paymentId}`).digest('hex');

test('razorpay checkout: server-priced order, signature + payment check before PAID', async () => {
  const rzp = mockRazorpay({
    'POST /orders': () => ({ id: 'order_T1', amount: 160000, currency: 'INR', status: 'created' }),
    'GET /payments/pay_wrong_amount': () => ({ id: 'pay_wrong_amount', order_id: 'order_T1', amount: 100, currency: 'INR', status: 'authorized' }),
    'GET /payments/pay_ok': () => ({ id: 'pay_ok', order_id: 'order_T1', amount: 160000, currency: 'INR', status: 'captured' }),
  });
  try {
    const created = await post('/create-payment-order', { serviceId: 'session_online', serviceName: 'Session', customerEmail: EMAIL });
    assert.equal(created.status, 200);
    const order = await created.json();
    assert.match(order.orderId, /^ORDER_[a-f0-9]+$/);
    assert.equal(order.razorpayOrderId, 'order_T1');
    assert.equal(order.keyId, process.env.RAZORPAY_KEY_ID);
    // Amount comes from server pricing (₹1600 → 160000 paise), never from the client
    assert.equal(rzp.calls[0].body.amount, 160000);
    assert.equal(rzp.calls[0].body.receipt, order.orderId);
    assert.equal((await db.getOrder(order.orderId)).gateway_order_id, 'order_T1');

    const verify = (paymentId, signature) => post('/verify-payment', {
      orderId: order.orderId, razorpay_order_id: 'order_T1', razorpay_payment_id: paymentId, razorpay_signature: signature,
    });

    // Forged signature → rejected, nothing fetched
    assert.equal((await verify('pay_ok', 'ab'.repeat(32))).status, 400);
    // Valid signature but the payment is for the wrong amount → not paid, not captured
    const wrong = await (await verify('pay_wrong_amount', checkoutSig('order_T1', 'pay_wrong_amount'))).json();
    assert.equal(wrong.paid, false);
    assert.ok(!rzp.calls.some((c) => c.path.endsWith('/capture')), 'mismatched payment is never captured');
    assert.equal((await db.getOrder(order.orderId)).status, 'CREATED');
    // Valid signature + captured payment for the right amount → PAID
    const ok = await (await verify('pay_ok', checkoutSig('order_T1', 'pay_ok'))).json();
    assert.equal(ok.paid, true);
    assert.equal((await db.getOrder(order.orderId)).status, 'PAID');
    // Status-only poll reports it too
    assert.equal((await (await post('/verify-payment', { orderId: order.orderId })).json()).paid, true);
  } finally {
    rzp.restore();
  }
});

test('razorpay checkout captures an authorised payment', async () => {
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'session_inperson', 2000);
  await db.setOrderGatewayId(orderId, 'order_T2');
  const rzp = mockRazorpay({
    'GET /payments/pay_auth': () => ({ id: 'pay_auth', order_id: 'order_T2', amount: 200000, currency: 'INR', status: 'authorized' }),
    'POST /payments/pay_auth/capture': () => ({ id: 'pay_auth', status: 'captured' }),
  });
  try {
    const res = await (await post('/verify-payment', {
      orderId, razorpay_order_id: 'order_T2', razorpay_payment_id: 'pay_auth', razorpay_signature: checkoutSig('order_T2', 'pay_auth'),
    })).json();
    assert.equal(res.paid, true);
    assert.deepEqual(rzp.calls.find((c) => c.path.endsWith('/capture')).body, { amount: 200000, currency: 'INR' });
    assert.equal((await db.getOrder(orderId)).status, 'PAID');
  } finally {
    rzp.restore();
  }
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

test('razorpay webhook rejects bad signatures and settles a valid payment.captured', async () => {
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'session_online', 1500);
  await db.setOrderGatewayId(orderId, 'order_W1');

  const event = (amount) => JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_w1', order_id: 'order_W1', amount, currency: 'INR', status: 'captured' } } },
  });
  const send = (body, signature) => fetch(`${base}/api/razorpay-webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature },
    body,
  });
  const sign = (body) => crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(body).digest('hex');

  assert.equal((await send(event(150000), 'ab'.repeat(32))).status, 401);
  assert.equal((await db.getOrder(orderId)).status, 'CREATED');

  // Correctly signed but the wrong amount: acknowledged, not paid
  const wrong = event(100);
  assert.equal((await send(wrong, sign(wrong))).status, 200);
  assert.equal((await db.getOrder(orderId)).status, 'CREATED');

  const good = event(150000);
  assert.equal((await send(good, sign(good))).status, 200);
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

  assert.equal((await put({ phone: '9000000000', age: 22, gender: 'Other', occupation: 'Student' })).status, 400, 'consent to the notice is required');
  const saved = await put({ phone: '9000000000', age: 22, gender: 'Other', occupation: 'Student', reason: 'curious', consent: true });
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

test('intell assessments: one account-linked payment unlocks all 7 tests, the profile and the report', async () => {
  const login = await (await post('/login', { email: EMAIL, password: PASSWORD })).json();
  const auth = { Authorization: `Bearer ${login.token}` };
  const me = (await db.getUserByEmail(EMAIL)).id;

  const defs = await (await get('/intell/tests')).json();
  assert.equal(defs.tests.length, 7);
  assert.equal(defs.tests.find((t) => t.id === 'intell_lp').questions.length, 12);
  assert.ok(!('reverse' in defs.tests.find((t) => t.id === 'intell_sb').questions[0]), 'scoring keys stay server-side');

  // Not bought: nothing unlocks
  let st = await (await get('/intell/status', auth)).json();
  assert.equal(st.entitled, false);
  assert.equal(st.profile, null);
  assert.equal((await post('/save-answers', { answers: '4'.repeat(12), testId: 'intell_sb' }, auth)).status, 402);
  assert.equal((await get('/intell/report', auth)).status, 402);
  assert.equal((await post('/create-payment-order', { serviceId: 'intell_assessment' })).status, 401, 'buying needs an account');

  // The order belongs to the buyer; only a verified payment unlocks it
  const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderId, 'intell_assessment', 2499, me);
  assert.equal((await (await get('/intell/status', auth)).json()).entitled, false);
  await db.markOrderPaid(orderId);
  assert.equal((await (await get('/intell/status', auth)).json()).entitled, true);
  assert.equal((await post('/create-payment-order', { serviceId: 'intell_assessment' }, auth)).status, 409, 'no second charge');

  // Every question must be answered with an allowed value
  assert.equal((await post('/save-answers', { answers: '4'.repeat(11), testId: 'intell_sb' }, auth)).status, 400);
  assert.equal((await post('/save-answers', { answers: '0'.repeat(12), testId: 'intell_sb' }, auth)).status, 400);

  for (const id of ['intell_lp', 'intell_sb', 'intell_ew', 'intell_iu', 'intell_pd']) {
    assert.equal((await post('/save-answers', { answers: '4'.repeat(12), testId: id }, auth)).status, 200, id);
  }
  assert.equal((await post('/save-answers', { answers: '0'.repeat(9), testId: 'phq9' }, auth)).status, 200);
  assert.equal((await post('/save-answers', { answers: '0'.repeat(7), testId: 'gad7' }, auth)).status, 200);

  // Module A only: the profile covers the five Intel tests (PHQ-9/GAD-7 stay free screenings)
  st = await (await get('/intell/status', auth)).json();
  assert.ok(st.tests.every((t) => t.done));
  assert.equal(st.moduleB, false);
  assert.equal(st.profile.module, 'A');
  assert.equal(st.profile.tests.length, 5);
  assert.equal(st.prices.a, 250);
  assert.equal(st.prices.b, 300);
  assert.equal(st.prices.upgrade, 50, 'owners of Module A pay only the difference for B');

  // Module B: the full battery and integrated profile
  const orderB = 'ORDER_' + crypto.randomBytes(8).toString('hex');
  await db.createOrder(orderB, 'intell_module_b', 50, me);
  await db.markOrderPaid(orderB);
  st = await (await get('/intell/status', auth)).json();
  assert.equal(st.moduleB, true);
  assert.equal(st.prices.upgrade, null);
  assert.equal(st.profile.module, 'B');
  assert.equal(st.profile.complete, true);
  assert.equal(st.profile.tests.length, 7);

  const pdf = await get('/intell/report', auth);
  assert.equal(pdf.status, 200);
  assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0, 4).toString(), '%PDF');
});

test('intell report buffer (booking attachment) is a real PDF', async () => {
  const { reportBuffer, scoreResult } = await import('../src/intell.js');
  const r = scoreResult('phq9', '000000000', new Date(), 'x');
  const buf = await reportBuffer({ name: 'Test Client', email: 'c@example.com' }, [{ testId: 'phq9', ...r }]);
  assert.equal(buf.subarray(0, 4).toString(), '%PDF');
  assert.ok(buf.length > 10000);
});

test('intel pricing: Module A 250, Module B 300 (or 50 for A owners), family package 500', async () => {
  const { getPrices } = await import('../src/pricing.js');
  const { intellPriceFor, INTELL_SERVICE_ID, INTELL_MODULE_B_ID } = await import('../src/intell.js');
  const p = getPrices();
  assert.equal(p.intell_assessment, 250);
  assert.equal(p.intell_module_b, 300);
  assert.equal(p.family_package, 500);
  assert.equal(intellPriceFor(INTELL_MODULE_B_ID, { a: false, b: false }, p), 300);
  assert.equal(intellPriceFor(INTELL_MODULE_B_ID, { a: true, b: false }, p), 50);
  assert.equal(intellPriceFor(INTELL_SERVICE_ID, { a: false, b: false }, p), 250);
  // the family package is sold only inside the school portal
  assert.equal((await post('/create-payment-order', { serviceId: 'family_package' })).status, 400);
});

test('under-18 accounts: nothing is saved until a parent confirms consent by email code', async () => {
  const email = 'teen@example.com';
  await post('/register', { name: 'Teen User', email, password: PASSWORD });
  await db.updateUserOTP(email, hashOtp('111222'), new Date(Date.now() + 600000).toISOString(), OTP_PURPOSE.VERIFY_EMAIL);
  const { token: t } = await (await post('/verify-email', { email, otp: '111222' })).json();
  const auth = { Authorization: `Bearer ${t}` };
  const me = (await db.getUserByEmail(email)).id;
  const put = (body) => fetch(`${base}/api/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(body) });

  const saved = await (await put({ phone: '9000000001', age: 15, gender: 'Female', occupation: 'Student', consent: true })).json();
  assert.equal(saved.guardianRequired, true);
  assert.equal((await post('/save-answers', { answers: '000000000', testId: 'phq9' }, auth)).status, 403, 'minor blocked before parent consent');

  assert.equal((await post('/guardian-consent/start', { guardianName: 'Parent', guardianEmail: email }, auth)).status, 400, "parent's own email required");
  assert.equal((await post('/guardian-consent/start', { guardianName: 'Parent', guardianEmail: 'parent@example.com' }, auth)).status, 200);
  assert.equal((await post('/guardian-consent/verify', { otp: '000000' }, auth)).status, 400, 'wrong code rejected');

  // Read the real code's hash out of the encrypted profile and confirm with a matching code
  const { readProfile } = await import('../src/profile.js');
  const prof = readProfile(await db.getAccountById(me));
  assert.ok(prof.guardianPending.otpHash && !('otp' in prof.guardianPending), 'only the hash is stored');
  const { setUserProfile } = db;
  const { encryptProfile } = await import('../src/profile.js');
  prof.guardianPending.otpHash = hashOtp('424242');
  const enc = encryptProfile(prof);
  await setUserProfile(me, 'Teen User', '9000000001', enc.encrypted, enc.iv);
  assert.equal((await post('/guardian-consent/verify', { otp: '424242' }, auth)).status, 200);

  const after = await (await get('/profile', auth)).json();
  assert.equal(after.guardianRequired, false);
  assert.equal(after.profile.guardian.email, 'parent@example.com');
  assert.ok(!('guardianPending' in after.profile));
  assert.equal((await post('/save-answers', { answers: '000000000', testId: 'phq9' }, auth)).status, 200, 'saved after consent');

  const kinds = (await db.getConsents(me)).map((c) => c.kind);
  assert.deepEqual(kinds, ['assessment_processing', 'guardian_consent']);
});

test('data rights: a person can download everything and delete their account', async () => {
  const email = 'erase.me@example.com';
  await post('/register', { name: 'Erase Me', email, password: PASSWORD });
  await db.updateUserOTP(email, hashOtp('333444'), new Date(Date.now() + 600000).toISOString(), OTP_PURPOSE.VERIFY_EMAIL);
  const { token: t } = await (await post('/verify-email', { email, otp: '333444' })).json();
  const auth = { Authorization: `Bearer ${t}` };
  await post('/save-answers', { answers: '000000000', testId: 'phq9' }, auth);

  assert.equal((await get('/my-data')).status, 401);
  const dump = await (await get('/my-data', auth)).json();
  assert.equal(dump.account.email, email);
  assert.equal(dump.results.length, 1);
  assert.equal(dump.results[0].answers, '000000000', 'answers are decrypted for the owner');

  const del = (body) => fetch(`${base}/api/account`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify(body) });
  assert.equal((await del({})).status, 400, 'confirmation phrase required');
  assert.equal((await del({ confirm: 'DELETE MY ACCOUNT' })).status, 200);
  assert.equal(await db.getUserByEmail(email), null);
  assert.equal((await get('/my-data', auth)).status, 401, 'old session no longer works');
});
