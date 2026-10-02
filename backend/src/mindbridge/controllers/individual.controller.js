const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../prisma');
const authService = require('../services/auth.service');
const { buildProfile } = require('../services/individualProfile');
const { generateDetailedStudentReport } = require('../services/pdf.service');
const { MODULES, ALL_CATEGORIES, accessPrice } = require('../utils/individualModules');
const { handleError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

// ── Cashfree ──────────────────────────────────────────────────
// Same account and API version as the main site's checkout. CASHFREE_API_BASE /
// CASHFREE_ENV exist so a sandbox (or a test double) can be pointed at without code changes.
const cashfreeBase = () => process.env.CASHFREE_API_BASE || 'https://api.cashfree.com/pg';
const cashfreeHeaders = () => ({
  'Content-Type': 'application/json',
  'x-api-version': '2023-08-01',
  'x-client-id': process.env.CASHFREE_APP_ID || '',
  'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
});

const fail = (status, message) => Object.assign(new Error(message), { status });

// ── Access ────────────────────────────────────────────────────
// One payment unlocks everything (both modules). Any PAID order counts —
// including orders from before the single price existed.

const hasAccess = async (userId) => (await prisma.individualOrder.count({ where: { userId, status: 'PAID' } })) > 0;

// Ask Cashfree whether an order was paid and, if the amount matches what we
// charged, unlock it. Status is never taken from the client.
async function settleOrder(order) {
  if (order.status === 'PAID') return true;
  const r = await fetch(`${cashfreeBase()}/orders/${order.cashfreeOrderId}`, { headers: cashfreeHeaders() });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw fail(502, 'Could not confirm the payment right now. Please try again in a moment.');
  if (data.order_status !== 'PAID') return false;
  if (Number(data.order_amount) !== Number(order.amount)) {
    logger.warn(`Individual order ${order.cashfreeOrderId}: paid ${data.order_amount}, expected ${order.amount}`);
    return false;
  }
  await prisma.individualOrder.updateMany({ where: { id: order.id, status: 'CREATED' }, data: { status: 'PAID', paidAt: new Date() } });
  return true;
}

// A client who paid and then closed the tab before we confirmed the payment still
// gets access: any recent unconfirmed order is re-checked whenever they open the dashboard.
async function settlePending(userId) {
  const pending = await prisma.individualOrder.findMany({
    where: { userId, status: 'CREATED', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  await Promise.all(pending.map((o) => settleOrder(o).catch((e) => logger.warn(`settle ${o.cashfreeOrderId}: ${e.message}`))));
}

// Gate for taking a test: the client must have paid, and the test must be one of the portal's.
async function requireAccess(req, res, next) {
  try {
    const test = await prisma.test.findUnique({ where: { id: req.params.testId }, select: { category: true } });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    if (!ALL_CATEGORIES.includes(test.category)) return res.status(404).json({ error: 'Test not found' });
    if (!(await hasAccess(req.user.id))) {
      return res.status(403).json({ error: 'Unlock the assessments to take this test.', code: 'PAYMENT_REQUIRED' });
    }
    next();
  } catch (err) {
    handleError(res, err, 'individual requireAccess');
  }
}

// ── Registration ──────────────────────────────────────────────

async function register(req, res) {
  try {
    const { firstName, lastName, email, password, phone, consent } = req.body || {};
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!String(firstName || '').trim() || !String(lastName || '').trim()) throw fail(400, 'First and last name are required');
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) throw fail(400, 'Enter a valid email address');
    if (typeof password !== 'string' || password.length < 8) throw fail(400, 'Password must be at least 8 characters');
    if (consent !== true) throw fail(400, 'Please accept the Terms and Privacy Policy to continue');

    const exists = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (exists) throw fail(409, 'An account with this email already exists. Please sign in.');

    try {
      await prisma.user.create({
        data: {
          email: cleanEmail,
          passwordHash: await bcrypt.hash(password, 12),
          role: 'INDIVIDUAL',
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          phone: String(phone || '').trim() || null,
          mustResetPassword: false, // they chose this password themselves
        },
      });
    } catch (e) {
      if (e.code === 'P2002') throw fail(409, 'An account with this email already exists. Please sign in.');
      throw e;
    }
    res.status(201).json(await authService.login(cleanEmail, password));
  } catch (err) {
    handleError(res, err, 'individual register');
  }
}

// ── Dashboard ─────────────────────────────────────────────────

async function getDashboard(req, res) {
  try {
    const userId = req.user.id;
    await settlePending(userId);

    const [unlocked, tests, results, appointments] = await Promise.all([
      hasAccess(userId),
      prisma.test.findMany({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }),
      prisma.testResult.findMany({
        where: { studentId: userId },
        orderBy: { takenAt: 'desc' },
        include: { test: { select: { name: true, category: true } } },
      }),
      prisma.appointment.findMany({
        where: { patientId: userId, slot: { gte: new Date() }, status: { in: ['PENDING', 'CONFIRMED'] } },
        orderBy: { slot: 'asc' },
        take: 3,
        include: { psychiatrist: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const latest = {};
    for (const r of results) if (!latest[r.test.category]) latest[r.test.category] = r;

    const modules = Object.values(MODULES).map((m) => {
      const items = m.categories.map((c) => {
        const t = tests.find((x) => x.category === c);
        return t && {
          id: t.id, name: t.name, category: c, description: t.description, estimatedMinutes: t.estimatedMinutes,
          done: !!latest[c], lastTakenAt: latest[c]?.takenAt || null, lastSeverity: latest[c]?.severity || null,
        };
      }).filter(Boolean);
      return {
        key: m.key, name: m.name, tagline: m.tagline, description: m.description, deliverables: m.deliverables,
        tests: items, completed: items.filter((i) => i.done).length,
      };
    });

    res.json({
      access: { unlocked, price: accessPrice() },
      modules,
      recentResults: results.slice(0, 5),
      upcomingAppointments: appointments,
    });
  } catch (err) {
    handleError(res, err, 'individual dashboard');
  }
}

// ── Payment (one-time, unlocks both modules) ──────────────────

async function checkout(req, res) {
  try {
    if (await hasAccess(req.user.id)) throw fail(409, 'You already have full access.');
    if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) throw fail(503, 'Payments are not available right now. Please try again later.');

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const amount = accessPrice();
    const orderId = `IND_${crypto.randomBytes(8).toString('hex')}`;
    const phone = String(user.phone || '').replace(/\D/g, '').slice(-10);
    const baseUrl = (process.env.PORTAL_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');

    const r = await fetch(`${cashfreeBase()}/orders`, {
      method: 'POST',
      headers: cashfreeHeaders(),
      body: JSON.stringify({
        order_amount: amount,
        order_currency: 'INR',
        order_id: orderId,
        customer_details: {
          customer_id: user.id,
          customer_name: `${user.firstName} ${user.lastName}`,
          customer_email: user.email,
          customer_phone: phone.length === 10 ? phone : '9999999999',
        },
        order_meta: { return_url: `${baseUrl}/individual?order_id={order_id}` },
        order_note: 'Intell assessments: Module A + Module B',
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.payment_session_id) {
      logger.error(`Cashfree order failed (${r.status}): ${data.message || ''}`);
      throw fail(502, 'Could not start the payment. Please try again.');
    }

    await prisma.individualOrder.create({ data: { userId: user.id, module: 'ALL', amount, cashfreeOrderId: orderId } });
    res.status(201).json({ paymentSessionId: data.payment_session_id, orderId, mode: process.env.CASHFREE_ENV === 'sandbox' ? 'sandbox' : 'production' });
  } catch (err) {
    handleError(res, err, 'individual checkout');
  }
}

async function verifyPayment(req, res) {
  try {
    const order = await prisma.individualOrder.findFirst({
      where: { cashfreeOrderId: String(req.body?.orderId || ''), userId: req.user.id },
    });
    if (!order) throw fail(404, 'Order not found');
    res.json({ paid: await settleOrder(order) });
  } catch (err) {
    handleError(res, err, 'individual verifyPayment');
  }
}

// ── Tests and results ─────────────────────────────────────────

async function getTests(req, res) {
  try {
    if (!(await hasAccess(req.user.id))) return res.json({ tests: [] });
    const tests = await prisma.test.findMany({ where: { isActive: true, category: { in: ALL_CATEGORIES } } });
    res.json({ tests });
  } catch (err) {
    handleError(res, err, 'individual getTests');
  }
}

// ── Profile & report ──────────────────────────────────────────

async function loadResults(userId) {
  return prisma.testResult.findMany({
    where: { studentId: userId },
    orderBy: { takenAt: 'desc' },
    include: { test: { select: { name: true, category: true, questions: true } } },
  });
}

async function getProfile(req, res) {
  try {
    if (!(await hasAccess(req.user.id))) throw fail(403, 'Unlock the assessments to see your profile.');
    res.json({ profile: buildProfile(await loadResults(req.user.id), 'B') });
  } catch (err) {
    handleError(res, err, 'individual getProfile');
  }
}

async function downloadReport(req, res) {
  try {
    if (!(await hasAccess(req.user.id))) throw fail(403, 'Unlock the assessments to download a report.');
    const [student, results] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user.id } }),
      loadResults(req.user.id),
    ]);
    await generateDetailedStudentReport(res, { student, results, profile: buildProfile(results, 'B') });
  } catch (err) {
    handleError(res, err, 'individual downloadReport');
  }
}

// ── Sessions ──────────────────────────────────────────────────

async function getAppointments(req, res) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId: req.user.id },
      orderBy: { slot: 'desc' },
      include: { psychiatrist: { select: { firstName: true, lastName: true } } },
    });
    res.json({ appointments });
  } catch (err) {
    handleError(res, err, 'individual getAppointments');
  }
}

// A client asks for a session: it lands in the counsellor's appointment list as PENDING,
// with the client's latest results already attached so they're at hand in the session.
// The counsellor confirms it (and adds the meeting link) from the existing appointment tools.
async function requestSession(req, res) {
  try {
    if (!(await hasAccess(req.user.id))) throw fail(403, 'Unlock the assessments before requesting a session.');

    const slot = new Date(req.body?.slot);
    if (Number.isNaN(slot.getTime()) || slot.getTime() < Date.now() + 60 * 60 * 1000) {
      throw fail(400, 'Choose a date and time at least an hour from now.');
    }
    const open = await prisma.appointment.count({ where: { patientId: req.user.id, status: 'PENDING', slot: { gte: new Date() } } });
    if (open) throw fail(409, 'You already have a session request waiting for confirmation.');

    const counsellor = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true }, orderBy: { createdAt: 'asc' } });
    if (!counsellor) throw fail(503, 'No counsellor is available right now. Please try again later.');

    const latest = {};
    for (const r of await prisma.testResult.findMany({ where: { studentId: req.user.id }, orderBy: { takenAt: 'desc' }, include: { test: { select: { category: true } } } })) {
      if (!latest[r.test.category]) latest[r.test.category] = r.id;
    }
    const message = String(req.body?.message || '').trim().slice(0, 1000);

    const appointment = await prisma.appointment.create({
      data: {
        patientId: req.user.id,
        psychiatristId: counsellor.id,
        slot,
        notes: message ? `Requested by client: ${message}` : 'Requested by client',
        results: { connect: Object.values(latest).map((id) => ({ id })) },
      },
    });
    res.status(201).json({ appointment });
  } catch (err) {
    handleError(res, err, 'individual requestSession');
  }
}

module.exports = { register, getDashboard, checkout, verifyPayment, getTests, getProfile, downloadReport, getAppointments, requestSession, requireAccess };
