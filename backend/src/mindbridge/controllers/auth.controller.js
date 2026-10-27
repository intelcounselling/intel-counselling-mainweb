const authService = require('../services/auth.service');
const logger = require('../utils/logger');
const { handleError } = require('../utils/errorHandler');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await authService.login(email.trim().toLowerCase(), password);
    res.json(result);
  } catch (err) {
    handleError(res, err, 'login');
  }
}

// POST /auth/login/verify { mfaToken, otp } — second step for the super admin
async function verifyLogin(req, res) {
  try {
    res.json(await authService.verifyMfa(req.body?.mfaToken, req.body?.otp));
  } catch (err) {
    handleError(res, err, 'verifyLogin');
  }
}

async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) {
    handleError(res, err, 'refresh');
  }
}

async function logout(req, res) {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    res.json({ message: 'Logged out' });
  } catch (err) {
    handleError(res, err, 'logout');
  }
}

async function resetPassword(req, res) {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    await authService.resetPassword(req.user.id, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    handleError(res, err, 'resetPassword');
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    handleError(res, err, 'changePassword');
  }
}

async function updateProfile(req, res) {
  try {
    const { firstName, lastName, phone } = req.body;
    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }
    const user = await authService.updateProfile(req.user.id, { firstName, lastName, phone });
    res.json({ message: 'Profile updated successfully', user });
  } catch (err) {
    handleError(res, err, 'updateProfile');
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    await authService.requestOTP(email.trim().toLowerCase());
    res.json({ message: 'OTP sent successfully to email' });
  } catch (err) {
    handleError(res, err, 'forgotPassword');
  }
}

async function verifyOTP(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.verifyOTPAndResetPassword(email.trim().toLowerCase(), otp, newPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    handleError(res, err, 'verifyOTP');
  }
}

async function getMe(req, res) {
  try {
    // The verifyToken middleware already sets req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    res.json({ user: req.user });
  } catch (err) {
    handleError(res, err, 'getMe');
  }
}

// ── Data-subject rights (DPDP Act) ─────────────────────────────

// GET /auth/my-data — the signed-in user's own data as a JSON download
async function getMyData(req, res) {
  try {
    const prisma = require('../prisma');
    const id = req.user.id;
    const [user, results, concerns, appointments] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { email: true, firstName: true, lastName: true, phone: true, role: true, grade: true, dateOfBirth: true, createdAt: true, school: { select: { name: true } } },
      }),
      prisma.testResult.findMany({
        where: { OR: [{ studentId: id }, { parentId: id }] },
        orderBy: { takenAt: 'asc' },
        select: { takenAt: true, score: true, maxScore: true, severity: true, subScores: true, answers: true, sharedWithTherapist: true, isParentPerspective: true, test: { select: { name: true } } },
      }),
      prisma.concern.findMany({ where: { studentId: id }, select: { message: true, status: true, createdAt: true } }),
      prisma.appointment.findMany({ where: { patientId: id }, select: { slot: true, status: true, createdAt: true } }),
    ]);
    res.setHeader('Content-Disposition', 'attachment; filename="intel-counselling-my-data.json"');
    res.json({ exportedAt: new Date().toISOString(), account: user, results, concerns, appointments });
  } catch (err) {
    handleError(res, err, 'getMyData');
  }
}

// POST /auth/deletion-request — school accounts are deleted by the clinic, so the
// request is sent to the clinic inbox (to be actioned within the legal deadline).
async function requestDeletion(req, res) {
  try {
    const { sendDeletionRequestEmail } = require('../services/email.service');
    const u = req.user;
    await sendDeletionRequestEmail({
      to: process.env.ADMIN_EMAIL || 'intelcounselling@gmail.com',
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      userId: u.id,
    });
    logger.info(`Deletion requested by user ${u.id}`);
    res.json({ requested: true });
  } catch (err) {
    handleError(res, err, 'requestDeletion');
  }
}

module.exports = { verifyLogin, getMyData, requestDeletion, login, refresh, logout, resetPassword, changePassword, updateProfile, forgotPassword, verifyOTP, getMe };
