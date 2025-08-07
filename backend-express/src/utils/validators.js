const { body, validationResult } = require('express-validator');

const validateRegistration = [
  body('username')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
];

const validateLogin = [
  body('username')
    .isLength({ min: 1 })
    .withMessage('Username is required'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required'),
];

const validateDeviceHash = [
  body('deviceHash')
    .isLength({ min: 32 })
    .withMessage('Valid device authentication required')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Invalid device hash format'),
];

const validateDeviceChange = [
  body('newDeviceHash')
    .isLength({ min: 32 })
    .withMessage('Valid new device authentication required')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Invalid device hash format'),
];

// Alternative device hash validation for logout-other-devices
const validateDeviceHashOptional = [
  body('deviceHash')
    .optional()
    .isLength({ min: 32 })
    .withMessage('Valid device authentication required')
    .matches(/^[a-fA-F0-9]+$/)
    .withMessage('Invalid device hash format'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateDeviceHash,
  validateDeviceHashOptional,
  validateDeviceChange,
  handleValidationErrors,
};
