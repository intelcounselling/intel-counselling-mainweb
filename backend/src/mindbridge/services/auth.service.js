const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../prisma');
const logger = require('../utils/logger');

const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(userId, role) {
  return jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

function generateRefreshToken(userId) {
  return jwt.sign({ userId, jti: uuidv4() }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid credentials'), { status: 401 });
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    },
  });

  const { passwordHash, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashedRefreshToken } });
  
  if (!stored || stored.expiresAt < new Date()) {
    throw Object.assign(new Error('Refresh token expired or revoked'), { status: 401 });
  }
  
  // Timing safe equal check for extra security (even though finding it by exact hash implies equality)
  const storedBuf = Buffer.from(stored.token, 'hex');
  const providedBuf = Buffer.from(hashedRefreshToken, 'hex');
  
  if (storedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(storedBuf, providedBuf)) {
      throw Object.assign(new Error('Invalid refresh token'), { status: 401 });
  }

  // Rotate tokens
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) {
    throw Object.assign(new Error('User not found'), { status: 401 });
  }

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);
  const newHashedRefreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: newHashedRefreshToken,
      expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
    },
  });

  const { passwordHash, ...safeUser } = user;
  return { accessToken: newAccessToken, refreshToken: newRefreshToken, user: safeUser };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await prisma.refreshToken.deleteMany({ where: { token: hashedRefreshToken } });
}

async function resetPassword(userId, newPassword) {
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash, mustResetPassword: false },
  });
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Incorrect current password'), { status: 400 });
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash },
  });
}

async function updateProfile(userId, { firstName, lastName, phone }) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      firstName,
      lastName,
      phone,
    },
  });
  const { passwordHash, ...safeUser } = updated;
  return safeUser;
}

async function requestOTP(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    // Return true to avoid email enumeration attacks
    logger.info(`OTP request for non-existent/inactive email: ${email}`);
    return true;
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      otpCode: hashedOtp,
      otpExpiresAt: expiresAt,
    },
  });

  const { sendOTPEmail } = require('./email.service');
  await sendOTPEmail({
    to: user.email,
    recipientName: `${user.firstName} ${user.lastName}`,
    otp,
  });

  return true;
}

async function verifyOTPAndResetPassword(email, otp, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive || !user.otpCode || !user.otpExpiresAt) {
    throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
  }

  if (new Date() > user.otpExpiresAt) {
    throw Object.assign(new Error('OTP has expired'), { status: 400 });
  }

  const hashedProvidedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const storedBuf = Buffer.from(user.otpCode, 'hex');
  const providedBuf = Buffer.from(hashedProvidedOtp, 'hex');

  if (storedBuf.length !== providedBuf.length || !crypto.timingSafeEqual(storedBuf, providedBuf)) {
    throw Object.assign(new Error('Invalid or expired OTP'), { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hash,
      otpCode: null,
      otpExpiresAt: null,
      mustResetPassword: false,
    },
  });

  return true;
}

module.exports = { login, refresh, logout, resetPassword, changePassword, updateProfile, requestOTP, verifyOTPAndResetPassword };
