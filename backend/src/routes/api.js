import express from 'express';
import rateLimit from 'express-rate-limit';
import saveAnswersHandler from '../api/save-answers.js';
import loadAnswersHandler from '../api/load-answers.js';
import createCashfreeSessionHandler from '../api/create-cashfree-session.js';
import verifyPaymentHandler from '../api/verify-payment.js';
import cashfreeWebhookHandler from '../api/cashfree-webhook.js';
import sendBookingEmailHandler from '../api/send-booking-email.js';
import sendCareerResultsHandler from '../api/send-career-results.js';
import sendInquiryEmailHandler from '../api/send-inquiry-email.js';
import sendRegistrationEmailHandler from '../api/send-registration-email.js';
import registerHandler from '../api/register.js';
import loginHandler from '../api/login.js';
import verifyEmailHandler from '../api/verify-email.js';
import resendVerificationHandler from '../api/resend-verification.js';
import logoutAllHandler from '../api/logout-all.js';
import linkResultHandler from '../api/link-result.js';
import userResultsHandler from '../api/user-results.js';
import careerAccessHandler from '../api/career-access.js';
import forgotPasswordHandler from '../api/forgot-password.js';
import googleLoginHandler from '../api/google-login.js';
import profileHandler from '../api/profile.js';
import verifyOtpHandler from '../api/verify-otp.js';
import { countUsers } from '../db.js';
import { isDemoMode, getPrices } from '../pricing.js';

const router = express.Router();

// Credential endpoints: tight per-IP budget against brute force / enumeration
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

// Outbound-email endpoints: prevent abuse as a spam relay / quota burner
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Everything else: generous ceiling against scripted abuse
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

router.use(generalLimiter);

router.get('/health', (req, res) => res.status(200).send('OK'));

// Public pricing/session config. The client displays these prices but never
// charges from them — create-cashfree-session re-derives the amount here.
router.get('/config', (req, res) => {
  res.json({
    demoMode: isDemoMode(),
    prices: getPrices(),
  });
});

// Public deploy/DB health check (see run.md). Deliberately exposes no file
// paths, raw DB errors or stack traces — those go to the server log only.
router.get('/db-status', async (req, res) => {
  let userCount = null;
  try {
    userCount = await countUsers();
  } catch (err) {
    console.error('db-status query failed:', err);
  }
  res.status(userCount === null ? 503 : 200).json({
    db: userCount === null ? 'failed' : 'ok',
    userCount,
    encryptionKeySet: !!process.env.ENCRYPTION_KEY,
    authSecretSet: !!process.env.AUTH_TOKEN_SECRET,
  });
});
router.post('/register', authLimiter, registerHandler);
router.post('/login', authLimiter, loginHandler);
router.post('/google-login', authLimiter, googleLoginHandler);
router.get('/profile', profileHandler);
router.put('/profile', profileHandler);
router.post('/verify-email', authLimiter, verifyEmailHandler);
router.post('/resend-verification', authLimiter, resendVerificationHandler);
router.post('/logout-all', authLimiter, logoutAllHandler);
router.post('/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/verify-otp', authLimiter, verifyOtpHandler);
router.post('/link-result', linkResultHandler);
router.get('/user-results', userResultsHandler);
router.get('/career-access', careerAccessHandler);
router.post('/create-cashfree-session', createCashfreeSessionHandler);
router.post('/verify-payment', verifyPaymentHandler);
router.post('/cashfree-webhook', cashfreeWebhookHandler);
router.post('/send-booking-email', emailLimiter, sendBookingEmailHandler);
router.post('/send-career-results', emailLimiter, sendCareerResultsHandler);
router.post('/send-inquiry-email', emailLimiter, sendInquiryEmailHandler);
router.post('/send-registration-email', emailLimiter, sendRegistrationEmailHandler);
router.post('/save-answers', saveAnswersHandler);
router.get('/load-answers', loadAnswersHandler);

export default router;
