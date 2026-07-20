const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Generate a username: firstname.lastname@schoolcode (lowercase, no spaces)
 */
function generateUsername(firstName, lastName, schoolCode) {
  const clean = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${clean(firstName)}.${clean(lastName)}@${clean(schoolCode)}.com`;
}

/**
 * Generate a random 10-character alphanumeric password
 */
function generatePassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomBytes[i] % chars.length);
  }
  return password;
}

/**
 * Generate credentials for a new user.
 * Also registers the user in Firebase Auth if Firebase Admin is initialized.
 * @returns {{ email, plainPassword, passwordHash }}
 */
async function generateCredentials(firstName, lastName, schoolCode) {
  const email = generateUsername(firstName, lastName, schoolCode);
  const plainPassword = generatePassword(10);
  const passwordHash = await bcrypt.hash(plainPassword, 12);
  return { email, plainPassword, passwordHash };
}

/**
 * Create a user in Firebase Auth (call after Postgres user is created).
 * Silently skips if Firebase Admin is not initialized.
 */
async function syncUserToFirebase(email, password, displayName) {
  try {
    const { admin, initialized } = require('../config/firebaseAdmin');
    if (!initialized) return;

    // Check if user already exists in Firebase
    try {
      await admin.auth().getUserByEmail(email);
      // User already exists — update their password to keep in sync
      const existing = await admin.auth().getUserByEmail(email);
      await admin.auth().updateUser(existing.uid, { password, displayName });
    } catch (notFoundErr) {
      if (notFoundErr.code === 'auth/user-not-found') {
        // Create fresh
        await admin.auth().createUser({ email, password, displayName });
      } else {
        throw notFoundErr;
      }
    }
  } catch (err) {
    // Never crash the main flow because of Firebase errors
    const logger = require('../utils/logger');
    logger.error(`Firebase sync failed for ${email}:`, err.message);
  }
}

/**
 * Update a user's password in Firebase Auth.
 * Silently skips if Firebase Admin is not initialized.
 */
async function updateFirebasePassword(email, newPassword) {
  try {
    const { admin, initialized } = require('../config/firebaseAdmin');
    if (!initialized) return;
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().updateUser(user.uid, { password: newPassword });
  } catch (err) {
    const logger = require('../utils/logger');
    logger.error(`Firebase password update failed for ${email}:`, err.message);
  }
}

/**
 * Delete a user from Firebase Auth by email.
 * Silently skips if Firebase Admin is not initialized or user doesn't exist.
 */
async function deleteFirebaseUser(email) {
  try {
    const { admin, initialized } = require('../config/firebaseAdmin');
    if (!initialized) return;
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().deleteUser(user.uid);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') {
      const logger = require('../utils/logger');
      logger.error(`Firebase delete failed for ${email}:`, err.message);
    }
  }
}

/**
 * Generate a new random password and hash it
 */
async function regeneratePassword() {
  const plainPassword = generatePassword(10);
  const passwordHash = await bcrypt.hash(plainPassword, 12);
  return { plainPassword, passwordHash };
}

module.exports = {
  generateCredentials,
  regeneratePassword,
  generateUsername,
  generatePassword,
  syncUserToFirebase,
  updateFirebasePassword,
  deleteFirebaseUser,
};

