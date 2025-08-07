const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const {
  validateRegistration,
  validateLogin,
  validateDeviceHash,
  validateDeviceHashOptional,
  handleValidationErrors
} = require('../utils/validators');

const router = express.Router();

// Public routes
router.post('/register',
  validateRegistration,
  validateDeviceHash,
  handleValidationErrors,
  authController.register
);

router.post('/login',
  validateLogin,
  validateDeviceHash,
  handleValidationErrors,
  authController.login
);

router.get('/verify',
  authController.verify
);

router.get('/health',
  authController.healthCheck
);

// Protected routes
router.post('/logout',
  authenticateToken,
  authController.logout
);

router.post('/force-logout',
  authenticateToken,
  authController.forceLogout
);

router.post('/logout-other-devices',
  authenticateToken,
  validateDeviceHashOptional,
  handleValidationErrors,
  authController.logoutFromOtherDevices
);

router.get('/sessions',
  authenticateToken,
  authController.getActiveSessions
);

router.post('/deactivate',
  authenticateToken,
  authController.deactivateAccount
);

router.post('/reactivate',
  validateLogin,
  validateDeviceHash,
  handleValidationErrors,
  authController.reactivateAccount
);

module.exports = router;
