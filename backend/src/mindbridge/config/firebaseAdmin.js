const { initializeApp, cert, getApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const logger = require('../utils/logger');

let adminAuth = null;
let initialized = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    // Avoid re-initializing if already done (e.g. hot-reload)
    let app;
    try {
      app = getApp();
    } catch {
      app = initializeApp({ credential: cert(serviceAccount) });
    }

    adminAuth = getAuth(app);
    initialized = true;
    logger.info('Firebase Admin initialized with service account.');
  } else {
    logger.warn('FIREBASE_SERVICE_ACCOUNT not found in .env — Firebase Admin NOT initialized. Auth will fall back to local JWT.');
  }
} catch (error) {
  logger.error('Failed to initialize Firebase Admin:', error);
}

// Expose a safe auth() getter so callers don't have to check initialized themselves
const admin = {
  auth: () => {
    if (!adminAuth) throw new Error('Firebase Admin is not initialized.');
    return adminAuth;
  }
};

module.exports = { admin, initialized };
