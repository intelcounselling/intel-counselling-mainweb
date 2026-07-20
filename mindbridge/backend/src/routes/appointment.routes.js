const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const apptCtrl = require('../controllers/appointment.controller');

// PDF report — accessible by psychiatrist, parent, or super admin
router.get('/:id/report', verifyToken, apptCtrl.getReport);

module.exports = router;
