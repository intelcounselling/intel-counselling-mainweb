const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/parent.controller');

const parent = [verifyToken, requireRole('PARENT')];

router.get('/dashboard', ...parent, ctrl.getDashboard);
router.get('/children', ...parent, ctrl.getChildren);
router.get('/children/:childId/results', ...parent, ctrl.getChildResults);
router.get('/children/:childId/results/:resultId', ...parent, ctrl.getChildResult);
router.post('/appointments', ...parent, ctrl.bookAppointment);
router.get('/appointments', ...parent, ctrl.getAppointments);

// Package 2: Parent Perspective & Comparison Report
router.post('/perspective', ...parent, ctrl.submitParentPerspective);
router.get('/children/:childId/comparison', ...parent, ctrl.getComparisonReport);

module.exports = router;
