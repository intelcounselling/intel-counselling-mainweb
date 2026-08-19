import express from 'express';
import rateLimit from 'express-rate-limit';
import saveAnswersHandler from '../api/save-answers.js';
import loadAnswersHandler from '../api/load-answers.js';
import createCashfreeSessionHandler from '../api/create-cashfree-session.js';
import verifyPaymentHandler from '../api/verify-payment.js';
import cashfreeWebhookHandler from '../api/cashfree-webhook.js';
import createMeetLinkHandler from '../api/create-meet-link.js';
import sendBookingEmailHandler from '../api/send-booking-email.js';
import sendCareerResultsHandler from '../api/send-career-results.js';
import sendInquiryEmailHandler from '../api/send-inquiry-email.js';
import sendRegistrationEmailHandler from '../api/send-registration-email.js';
import registerHandler from '../api/register.js';
import loginHandler from '../api/login.js';
import logoutAllHandler from '../api/logout-all.js';
import linkResultHandler from '../api/link-result.js';
import userResultsHandler from '../api/user-results.js';
import forgotPasswordHandler from '../api/forgot-password.js';
import verifyOtpHandler from '../api/verify-otp.js';

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
router.post('/register', authLimiter, registerHandler);
router.post('/login', authLimiter, loginHandler);
router.post('/logout-all', authLimiter, logoutAllHandler);
router.post('/forgot-password', authLimiter, forgotPasswordHandler);
router.post('/verify-otp', authLimiter, verifyOtpHandler);
router.post('/link-result', linkResultHandler);
router.get('/user-results', userResultsHandler);
router.post('/create-cashfree-session', createCashfreeSessionHandler);
router.post('/verify-payment', verifyPaymentHandler);
router.post('/cashfree-webhook', cashfreeWebhookHandler);
router.post('/create-meet-link', createMeetLinkHandler);
router.post('/send-booking-email', emailLimiter, sendBookingEmailHandler);
router.post('/send-career-results', emailLimiter, sendCareerResultsHandler);
router.post('/send-inquiry-email', emailLimiter, sendInquiryEmailHandler);
router.post('/send-registration-email', emailLimiter, sendRegistrationEmailHandler);
router.post('/save-answers', saveAnswersHandler);
router.get('/load-answers', loadAnswersHandler);

export default router;
