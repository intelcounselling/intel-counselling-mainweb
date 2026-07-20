const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { validateLogin, validateResetPassword, validateChangePassword, validateForgotPassword, validateVerifyOTP } = require('../middleware/validation.middleware');
const authCtrl = require('../controllers/auth.controller');

router.post('/login', authLimiter, validateLogin, authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', authCtrl.logout);
router.post('/reset-password', verifyToken, validateResetPassword, authCtrl.resetPassword);
router.put('/profile', verifyToken, authCtrl.updateProfile);
router.put('/change-password', verifyToken, validateChangePassword, authCtrl.changePassword);
router.post('/forgot-password', authLimiter, validateForgotPassword, authCtrl.forgotPassword);
router.post('/verify-otp', authLimiter, validateVerifyOTP, authCtrl.verifyOTP);
router.get('/me', verifyToken, authCtrl.getMe);

module.exports = router;
