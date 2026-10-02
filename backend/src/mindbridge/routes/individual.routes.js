const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const ctrl = require('../controllers/individual.controller');
const student = require('../controllers/student.controller');

const individual = [verifyToken, requireRole('INDIVIDUAL')];

// Public — self-registration for clients who don't come through a school
router.post('/register', authLimiter, ctrl.register);

router.get('/dashboard', ...individual, ctrl.getDashboard);

// Payment (server-derived price; status confirmed with Cashfree, never trusted from the client)
router.post('/checkout', ...individual, ctrl.checkout);
router.post('/verify-payment', ...individual, ctrl.verifyPayment);

// Assessments — only the tests in modules the client has paid for.
// Scoring, validity checks and counsellor alerts are the shared student pipeline.
router.get('/tests', ...individual, ctrl.getTests);
router.post('/tests/:testId/submit', ...individual, ctrl.requireAccess, student.submitTest);

router.get('/results', ...individual, student.getResults);
router.get('/results/:id', ...individual, student.getResult);

router.get('/profile', ...individual, ctrl.getProfile);
router.get('/report', ...individual, ctrl.downloadReport);
router.get('/appointments', ...individual, ctrl.getAppointments);
router.post('/appointments', ...individual, ctrl.requestSession);

module.exports = router;
