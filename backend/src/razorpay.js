import crypto from 'crypto';

// Razorpay (Orders API + Standard Checkout).
//
//   RAZORPAY_KEY_ID          public key id, sent to the browser to open Checkout
//   RAZORPAY_KEY_SECRET      API secret: server-to-server calls + checkout signature
//   RAZORPAY_WEBHOOK_SECRET  the secret set on the webhook in the Razorpay dashboard
//
// Amounts: our prices are in rupees; Razorpay works in paise (integer).

const API = 'https://api.razorpay.com/v1';

export const toPaise = (rupees) => Math.round(Number(rupees) * 100);

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID || '';
}

function authHeader() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error('Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64');
}

async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error?.description || `Razorpay ${method} ${path} failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Creates a Razorpay order. `receipt` is our own ORDER_… id.
export function createRazorpayOrder({ amountRupees, receipt, notes }) {
  return call('/orders', {
    method: 'POST',
    body: { amount: toPaise(amountRupees), currency: 'INR', receipt, notes },
  });
}

export const fetchPayment = (paymentId) => call(`/payments/${encodeURIComponent(paymentId)}`);

export const capturePayment = (paymentId, amountPaise) =>
  call(`/payments/${encodeURIComponent(paymentId)}/capture`, {
    method: 'POST',
    body: { amount: amountPaise, currency: 'INR' },
  });

function safeEqualHex(expectedHex, receivedHex) {
  if (typeof receivedHex !== 'string' || !/^[a-f0-9]+$/i.test(receivedHex)) return false;
  const a = Buffer.from(expectedHex, 'hex');
  const b = Buffer.from(receivedHex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Checkout success handler: signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
export function verifyCheckoutSignature(razorpayOrderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !razorpayOrderId || !paymentId) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

// Webhooks: X-Razorpay-Signature = HMAC_SHA256(raw request body, webhook_secret)
export function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !rawBody) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
