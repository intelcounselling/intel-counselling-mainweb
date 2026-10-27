const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/parent.controller');
const family = require('../controllers/family.controller');

const parent = [verifyToken, requireRole('PARENT')];

router.get('/dashboard', ...parent, ctrl.getDashboard);
router.get('/children', ...parent, ctrl.getChildren);
router.get('/children/:childId/results', ...parent, ctrl.getChildResults);
router.get('/children/:childId/results/:resultId', ...parent, ctrl.getChildResult);
router.post('/appointments', ...parent, ctrl.bookAppointment);
router.get('/appointments', ...parent, ctrl.getAppointments);

// Parent + student family package (paid once per family, Razorpay)
router.get('/family-package', ...parent, family.getStatus);
router.post('/family-package/order', ...parent, family.createOrder);
router.post('/family-package/verify', ...parent, family.verifyPayment);

// Package 2: Parent Perspective & Comparison Report — need the family package
const paid = [...parent, family.requireFamilyPackage];
router.post('/perspective', ...paid, ctrl.submitParentPerspective);
router.get('/children/:childId/perspective-tests', ...paid, ctrl.getPerspectiveTests);
router.get('/children/:childId/comparison', ...paid, ctrl.getComparisonReport);

module.exports = router;
