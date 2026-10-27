import { getOrderByGatewayId } from '../db.js';
import { verifyWebhookSignature } from '../razorpay.js';
import { settleRazorpayPayment } from './verify-payment.js';

// POST /api/razorpay-webhook — backup path that marks an order paid even if the
// customer closed the browser before the checkout callback reached us.
// Subscribe to payment.authorized, payment.captured and order.paid in the
// Razorpay dashboard, with RAZORPAY_WEBHOOK_SECRET as the webhook secret.
const EVENTS = ['payment.authorized', 'payment.captured', 'order.paid'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Signature is over the exact raw bytes (server.js keeps them as req.rawBody)
  if (!verifyWebhookSignature(req.rawBody, req.headers['x-razorpay-signature'])) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  try {
    let payload = req.body;
    if (!payload || typeof payload !== 'object') payload = JSON.parse(req.rawBody.toString());

    if (!EVENTS.includes(payload.event)) {
      // Not an event we act on — acknowledge so Razorpay stops retrying.
      return res.status(200).json({ received: true });
    }

    const payment = payload.payload?.payment?.entity;
    if (!payment?.order_id) {
      console.warn('Razorpay webhook without a payment entity:', payload.event);
      return res.status(200).json({ received: true });
    }

    const order = await getOrderByGatewayId(payment.order_id);
    if (!order) {
      console.warn('Razorpay webhook: payment for unknown order', payment.order_id);
      return res.status(200).json({ received: true });
    }

    // Idempotent: settling an already-PAID (or USED) order is a no-op.
    await settleRazorpayPayment(order, payment);
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling Razorpay webhook:', error);
    // 5xx makes Razorpay retry later (e.g. a transient capture or DB failure).
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
}
