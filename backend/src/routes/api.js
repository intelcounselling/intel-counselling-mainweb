import express from 'express';
import saveAnswersHandler from '../api/save-answers.js';
import loadAnswersHandler from '../api/load-answers.js';
import createCashfreeSessionHandler from '../api/create-cashfree-session.js';
import createMeetLinkHandler from '../api/create-meet-link.js';
import sendBookingEmailHandler from '../api/send-booking-email.js';
import sendCareerResultsHandler from '../api/send-career-results.js';
import sendInquiryEmailHandler from '../api/send-inquiry-email.js';
import sendRegistrationEmailHandler from '../api/send-registration-email.js';
import registerHandler from '../api/register.js';
import loginHandler from '../api/login.js';
import linkResultHandler from '../api/link-result.js';
import userResultsHandler from '../api/user-results.js';
import forgotPasswordHandler from '../api/forgot-password.js';
import verifyOtpHandler from '../api/verify-otp.js';

const router = express.Router();

router.get('/health', (req, res) => res.status(200).send('OK'));
router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/verify-otp', verifyOtpHandler);
router.post('/link-result', linkResultHandler);
router.get('/user-results', userResultsHandler);
router.post('/create-cashfree-session', createCashfreeSessionHandler);
router.post('/create-meet-link', createMeetLinkHandler);
router.post('/send-booking-email', sendBookingEmailHandler);
router.post('/send-career-results', sendCareerResultsHandler);
router.post('/send-inquiry-email', sendInquiryEmailHandler);
router.post('/send-registration-email', sendRegistrationEmailHandler);
router.post('/save-answers', saveAnswersHandler);
router.get('/load-answers', loadAnswersHandler);

export default router;
