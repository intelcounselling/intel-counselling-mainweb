const logger = require('../utils/logger');

let twilioClient = null;

function getClient() {
  if (twilioClient) return twilioClient;

  const { TWILIO_SID, TWILIO_TOKEN } = process.env;
  if (!TWILIO_SID || !TWILIO_TOKEN) {
    logger.warn('SMS: Twilio not configured. SMS will be logged only.');
    return null;
  }

  const twilio = require('twilio');
  twilioClient = twilio(TWILIO_SID, TWILIO_TOKEN);
  return twilioClient;
}

/**
 * Send an SMS message. Fails silently in dev if Twilio not configured.
 */
async function sendSMS({ to, message }) {
  const client = getClient();
  if (!client) {
    logger.info(`[DEV SMS] To: ${to}\n${message}`);
    return { sid: 'dev-mode' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_FROM,
      to,
    });
    logger.info(`SMS sent to ${to}: ${result.sid}`);
    return result;
  } catch (err) {
    logger.error(`SMS failed to ${to}:`, err);
    // Fail silently — don't break the alert flow
    return null;
  }
}

async function sendAlertSMS({ to, childName, testName }) {
  return sendSMS({
    to,
    message: `Intel Counselling: ${childName}'s latest ${testName} score indicates they may need support. Log in to view details and book an appointment: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`,
  });
}

module.exports = { sendSMS, sendAlertSMS };
