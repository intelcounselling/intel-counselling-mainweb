const { body, param, validationResult } = require('express-validator');

// Helper to handle validation errors
const validateResult = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('password')
    .isString()
    .notEmpty()
    .withMessage('Password is required'),
  validateResult,
];

const validateResetPassword = [
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  validateResult,
];

const validateChangePassword = [
  body('currentPassword')
    .isString()
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
  validateResult,
];

const validateCreateSchool = [
  body('name')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('School name is required')
    .escape(),
  body('adminFirstName')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('Admin first name is required')
    .escape(),
  body('adminLastName')
    .trim()
    .isString()
    .notEmpty()
    .withMessage('Admin last name is required')
    .escape(),
  body('adminEmail')
    .trim()
    .isEmail()
    .withMessage('Must be a valid admin email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('adminPhone')
    .optional()
    .trim()
    .isString()
    .escape(),
  body('address')
    .optional()
    .trim()
    .isString()
    .escape(),
  validateResult,
];

const validateUUID = (fieldName) => [
  param(fieldName)
    .isUUID()
    .withMessage(`Invalid identifier format for ${fieldName}`),
  validateResult,
];

const validateForgotPassword = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  validateResult,
];

const validateVerifyOTP = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail({ gmail_remove_dots: false }),
  body('otp')
    .trim()
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be exactly 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  body('newPassword')
    .isString()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
  validateResult,
];

module.exports = {
  validateLogin,
  validateResetPassword,
  validateChangePassword,
  validateCreateSchool,
  validateUUID,
  validateForgotPassword,
  validateVerifyOTP,
};
