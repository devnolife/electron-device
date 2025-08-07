const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Import handleValidationErrors from validators
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

// All user routes require authentication
router.use(authenticateToken);

// Profile routes
router.get('/profile', userController.getProfile);

router.put('/profile',
  body('email').optional().isEmail().withMessage('Invalid email format'),
  handleValidationErrors,
  userController.updateProfile
);

// Password change
router.put('/password',
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  handleValidationErrors,
  userController.changePassword
);

// Device and session info
router.get('/device/info', userController.getDeviceInfo);
router.get('/sessions', userController.getActiveSessions);

// Account management
router.post('/deactivate', userController.deactivateAccount);

router.delete('/account',
  body('password').notEmpty().withMessage('Password confirmation required'),
  handleValidationErrors,
  userController.deleteAccount
);

module.exports = router;
