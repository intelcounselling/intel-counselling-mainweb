const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const studentRoutes = require('./student.routes');
const parentRoutes = require('./parent.routes');
const psychiatristRoutes = require('./psychiatrist.routes');
const appointmentRoutes = require('./appointment.routes');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/parent', parentRoutes);
router.use('/psychiatrist', psychiatristRoutes);
router.use('/appointments', appointmentRoutes);

// Health check
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;
