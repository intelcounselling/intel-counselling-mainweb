const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const logger = require('../utils/logger');

/**
 * Verify JWT access token and attach user to req.user
 */
async function verifyToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.slice(7);
    let payload;
    let emailFromFirebase = null;

    const { admin, initialized } = require('../config/firebaseAdmin');

    try {
      if (initialized) {
        // Try Firebase first
        const decodedToken = await admin.auth().verifyIdToken(token);
        emailFromFirebase = decodedToken.email;
      } else {
        throw new Error('Firebase Admin not initialized');
      }
    } catch (firebaseErr) {
      // Fallback to JWT if Firebase fails or isn't initialized
      try {
        payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      } catch (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
        }
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // Find user by email (Firebase) or by ID (JWT)
    const user = await prisma.user.findFirst({
      where: emailFromFirebase ? { email: emailFromFirebase } : { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        schoolId: true,
        familyStudentId: true,
        familyParentId: true,
        isActive: true,
        mustResetPassword: true,
        avatarUrl: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // If they authenticated via Firebase (e.g., Google) and still have mustResetPassword flagged,
    // clear it because they are using an external provider.
    if (emailFromFirebase && user.mustResetPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mustResetPassword: false }
      });
      user.mustResetPassword = false;
    }

    // Enforce forced password reset: only allow the password-reset flow
    // (and fetching own profile / logging out) until the password is changed.
    if (user.mustResetPassword) {
      const fullPath = (req.baseUrl || '') + (req.path || '');
      const allowedPaths = ['/auth/reset-password', '/auth/change-password', '/auth/logout', '/auth/me'];
      if (!allowedPaths.some((p) => fullPath.endsWith(p))) {
        return res.status(403).json({ error: 'Password reset required', code: 'MUST_RESET_PASSWORD' });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error('verifyToken error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Role-based access control middleware
 * @param {...string} roles - Allowed roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
