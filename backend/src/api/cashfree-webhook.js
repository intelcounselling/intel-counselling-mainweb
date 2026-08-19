import crypto from 'crypto';
import { getOrder, markOrderPaid } from '../db.js';

// Verifies the Cashfree webhook signature (PG webhooks, x-api-version 2023-08-01):
// x-webhook-signature = base64(HMAC-SHA256(x-webhook-timestamp + rawBody, CASHFREE_SECRET_KEY))
function verifySignature(req) {
  const secret = process.env.CASHFREE_SECRET_KEY;
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];

  if (!secret || !signature || !timestamp || !req.rawBody) {
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(timestamp + req.rawBody.toString())
      .digest();
    const received = Buffer.from(String(signature), 'base64');
    if (received.length !== expected.length) return false;
    return crypto.timingSafeEqual(received, expected);
  } catch (err) {
    console.error('Cashfree webhook signature check failed:', err);
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!verifySignature(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    // req.body is already parsed by express.json; fall back to the raw bytes
    // in case a proxy delivered a content-type express.json didn't handle.
    let payload = req.body;
    if (!payload || typeof payload !== 'object') {
      payload = JSON.parse(req.rawBody.toString());
    }

    if (payload.type !== 'PAYMENT_SUCCESS_WEBHOOK') {
      // Not an event we act on — acknowledge so Cashfree stops retrying.
      return res.status(200).json({ received: true });
    }

    const orderId = payload.data?.order?.order_id;
    const orderAmount = payload.data?.order?.order_amount;
    const paymentStatus = payload.data?.payment?.payment_status;

    if (typeof orderId !== 'string' || paymentStatus !== 'SUCCESS') {
      console.warn('Cashfree webhook: PAYMENT_SUCCESS_WEBHOOK with unusable payload', { orderId, paymentStatus });
      return res.status(200).json({ received: true });
    }

    const order = await getOrder(orderId);
    if (!order) {
      console.warn('Cashfree webhook: payment for unknown order', orderId);
      return res.status(200).json({ received: true });
    }

    if (Number(order.amount) !== Number(orderAmount)) {
      console.warn(
        'Cashfree webhook: amount mismatch for order', orderId,
        '— expected', order.amount, 'got', orderAmount, '; not marking paid'
      );
      return res.status(200).json({ received: true });
    }

    // Idempotent — marking an already-PAID (or USED) order paid again is harmless.
    if (order.status === 'CREATED') {
      await markOrderPaid(orderId);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling Cashfree webhook:', error);
    // The event was received but unusable; ack so Cashfree does not retry forever.
    return res.status(200).json({ received: true });
  }
}
