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

module.exports = { login, refresh, logout, resetPassword, changePassword, updateProfile, forgotPassword, verifyOTP, getMe };
