// Parent + student family package: the parent pays once (Razorpay) in the portal,
// which unlocks Parent Perspective and the parent–child Comparison Report for the
// whole family. Orders live in the main site's `orders` table (service
// 'family_package', user_id = the family id), so the main site's Razorpay webhook
// settles them too if the parent closes the tab mid-payment.
const crypto = require('crypto');
const { handleError } = require('../utils/errorHandler');

const SERVICE = 'family_package';

// The main site's payment code is ESM; load it once on first use.
let mods;
const main = () => (mods ||= Promise.all([
  import('../../db.js'),
  import('../../pricing.js'),
  import('../../razorpay.js'),
  import('../../api/verify-payment.js'),
]).then(([db, pricing, razorpay, verify]) => ({ db, pricing, razorpay, verify })));

async function familyHasPackage(familyId) {
  if (!familyId) return false;
  const { db } = await main();
  return (await db.countPaidOrders(familyId, SERVICE)) > 0;
}

// Route guard for the family features
async function requireFamilyPackage(req, res, next) {
  try {
    if (!req.user.familyParentId) return res.status(403).json({ error: 'Your account is not linked to a family' });
    if (!(await familyHasPackage(req.user.familyParentId))) {
      return res.status(402).json({ error: 'Unlock the family package to use this feature', code: 'FAMILY_PACKAGE_REQUIRED' });
    }
    next();
  } catch (err) {
    handleError(res, err, 'requireFamilyPackage');
  }
}

// GET /parent/family-package
async function getStatus(req, res) {
  try {
    const { pricing } = await main();
    res.json({ unlocked: await familyHasPackage(req.user.familyParentId), price: pricing.getPrices()[SERVICE] });
  } catch (err) {
    handleError(res, err, 'family package status');
  }
}

// POST /parent/family-package/order — starts Razorpay Checkout; the amount comes from pricing.js
async function createOrder(req, res) {
  try {
    const familyId = req.user.familyParentId;
    if (!familyId) return res.status(403).json({ error: 'Your account is not linked to a family' });
    if (await familyHasPackage(familyId)) return res.status(409).json({ error: 'The family package is already unlocked' });

    const { db, pricing, razorpay } = await main();
    const keyId = razorpay.razorpayKeyId();
    if (!keyId || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({ error: 'Online payments are temporarily unavailable. Please try again later.' });
    }

    const amount = pricing.getPrices()[SERVICE];
    const orderId = 'ORDER_' + crypto.randomBytes(8).toString('hex');
    const rzpOrder = await razorpay.createRazorpayOrder({
      amountRupees: amount,
      receipt: orderId,
      notes: { order_id: orderId, service_id: SERVICE, family_id: familyId },
    });
    await db.createOrder(orderId, SERVICE, amount, familyId);
    await db.setOrderGatewayId(orderId, rzpOrder.id);

    res.status(201).json({
      orderId,
      razorpayOrderId: rzpOrder.id,
      keyId,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      name: 'Intel Counselling',
      description: 'Parent + Student family package',
      prefill: { name: `${req.user.firstName} ${req.user.lastName}`, email: req.user.email },
    });
  } catch (err) {
    handleError(res, err, 'family package order');
  }
}

// POST /parent/family-package/verify — { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
async function verifyPayment(req, res) {
  try {
    const { orderId, razorpay_order_id: rzpOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
    const { db, razorpay, verify } = await main();
    const order = typeof orderId === 'string' ? await db.getOrder(orderId) : null;
    // Only this family's own family-package orders
    if (!order || order.service_id !== SERVICE || order.user_id !== req.user.familyParentId) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (['PAID', 'USED'].includes(order.status)) return res.json({ paid: true });
    if (!paymentId) return res.json({ paid: false });

    if (rzpOrderId !== order.gateway_order_id || !razorpay.verifyCheckoutSignature(rzpOrderId, paymentId, signature)) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }
    const paid = await verify.settleRazorpayPayment(order, await razorpay.fetchPayment(paymentId));
    res.json({ paid });
  } catch (err) {
    handleError(res, err, 'family package verify');
  }
}

module.exports = { requireFamilyPackage, getStatus, createOrder, verifyPayment, familyHasPackage };
