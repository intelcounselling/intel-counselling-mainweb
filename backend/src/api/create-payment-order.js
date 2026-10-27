import crypto from 'crypto';
import { createOrder, setOrderGatewayId } from '../db.js';
import { getPrices } from '../pricing.js';
import { authenticateRequest } from '../token.js';
import { INTELL_SERVICE_ID, INTELL_MODULE_B_ID, intellAccess, intellPriceFor } from '../intell.js';
import { createRazorpayOrder, razorpayKeyId } from '../razorpay.js';
import { needsGuardianConsent } from './consent.js';

// POST /api/create-payment-order — starts a Razorpay checkout for one service.
// The client only names the service; the amount always comes from pricing.js.
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
    const { serviceId, serviceName, customerName, customerEmail, customerPhone } = req.body || {};

    // Prices live server-side only. DEMO_MODE=true makes every service ₹1 (see src/pricing.js).
    let orderAmount = getPrices()[serviceId];
    // The family package is bought inside the school portal (Mindbridge), never here.
    if (serviceId === 'family_package' || !Number.isFinite(orderAmount) || orderAmount <= 0) {
      return res.status(400).json({ error: 'Unknown service' });
    }

    // The Intel assessments are bought by an account (access is tied to it, not to
    // one result), so that order records the signed-in buyer.
    let buyerId = null;
    if (serviceId === INTELL_SERVICE_ID || serviceId === INTELL_MODULE_B_ID) {
      buyerId = await authenticateRequest(req);
      if (!buyerId) return res.status(401).json({ error: 'Please sign in to buy the assessments' });
      if (await needsGuardianConsent(buyerId)) {
        return res.status(403).json({ error: 'A parent or guardian needs to confirm consent first.', code: 'GUARDIAN_CONSENT_REQUIRED' });
      }
      const access = await intellAccess(buyerId);
      if (serviceId === INTELL_SERVICE_ID ? access.a : access.b) {
        return res.status(409).json({ error: 'You already have access to this module' });
      }
      // Module B already includes A; owners of A pay only the difference
      orderAmount = intellPriceFor(serviceId, access, getPrices());
    }

    const keyId = razorpayKeyId();
    if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay keys are not configured');
      return res.status(503).json({ error: 'Online payments are temporarily unavailable. Please try again later.' });
    }

    const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
    const description = String(serviceName || 'Consultation').slice(0, 200);

    const rzpOrder = await createRazorpayOrder({
      amountRupees: orderAmount,
      receipt: orderId,
      notes: { order_id: orderId, service_id: serviceId },
    });

    // Persist the order server-side so payment status is never trusted from the client
    await createOrder(orderId, serviceId, orderAmount, buyerId);
    await setOrderGatewayId(orderId, rzpOrder.id);

    res.status(200).json({
      orderId,
      razorpayOrderId: rzpOrder.id,
      keyId,
      amount: rzpOrder.amount, // paise
      currency: rzpOrder.currency,
      name: 'Intel Counselling',
      description,
      prefill: {
        name: customerName ? String(customerName).slice(0, 100) : undefined,
        email: customerEmail ? String(customerEmail).slice(0, 200) : undefined,
        contact: customerPhone ? String(customerPhone).replace(/[^\d+]/g, '').slice(0, 15) : undefined,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(502).json({ error: 'Could not start the payment. Please try again.' });
  }
}
