const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/student.controller');

const student = [verifyToken, requireRole('STUDENT')];

router.get('/dashboard', ...student, ctrl.getDashboard);
router.put('/onboard', ...student, ctrl.completeOnboarding);
router.get('/tests', ...student, ctrl.getTests);
router.post('/tests/:testId/submit', ...student, ctrl.submitTest);
router.get('/results', ...student, ctrl.getResults);
router.get('/results/:id', ...student, ctrl.getResult);
router.post('/concerns', ...student, ctrl.submitConcern);
router.get('/concerns', ...student, ctrl.getConcerns);

module.exports = router;
