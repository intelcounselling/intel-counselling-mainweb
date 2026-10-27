import { getOrder, markOrderPaid } from '../db.js';
import { verifyCheckoutSignature, fetchPayment, capturePayment, toPaise } from '../razorpay.js';

const PAID_STATES = ['PAID', 'USED'];

// Settles one Razorpay payment against our stored order. Shared by the checkout
// callback (below) and the webhook. Everything is checked against Razorpay's own
// record of the payment, never against what the browser sent:
//   - it belongs to this order's Razorpay order
//   - it is in INR for exactly the stored amount
//   - authorised-but-not-captured payments are captured here
// Returns true once the order is PAID (or already was).
export async function settleRazorpayPayment(order, payment) {
  if (!order || !payment) return false;
  if (PAID_STATES.includes(order.status)) return true;

  if (payment.order_id !== order.gateway_order_id) {
    console.warn('Razorpay payment', payment.id, 'is for', payment.order_id, 'not', order.gateway_order_id);
    return false;
  }
  const expected = toPaise(order.amount);
  if (payment.currency !== 'INR' || Number(payment.amount) !== expected) {
    console.warn('Razorpay amount mismatch for', order.order_id, '— expected', expected, 'got', payment.amount, payment.currency);
    return false;
  }

  let status = payment.status;
  if (status === 'authorized') {
    const captured = await capturePayment(payment.id, expected);
    status = captured.status;
  }
  if (status !== 'captured') return false;

  await markOrderPaid(order.order_id);
  return true;
}

// POST /api/verify-payment
//   { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Called by the browser right after Razorpay Checkout succeeds. With only
// { orderId } it reports the stored status (e.g. after the webhook settled it).
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
    const { orderId, razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};

    if (!orderId || typeof orderId !== 'string' || !/^ORDER_[a-f0-9]+$/.test(orderId)) {
      return res.status(400).json({ error: 'Invalid orderId' });
    }

    const order = await getOrder(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (PAID_STATES.includes(order.status)) {
      return res.status(200).json({ paid: true, orderStatus: order.status });
    }

    if (!paymentId) {
      return res.status(200).json({ paid: false, orderStatus: order.status });
    }

    // The checkout signature proves Razorpay issued this payment for this order.
    if (rzpOrderId !== order.gateway_order_id || !verifyCheckoutSignature(rzpOrderId, paymentId, signature)) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const payment = await fetchPayment(paymentId);
    const paid = await settleRazorpayPayment(order, payment);

    res.status(200).json({ paid, orderStatus: paid ? 'PAID' : String(payment.status || 'PENDING').toUpperCase() });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
