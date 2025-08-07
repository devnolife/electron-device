const { prisma } = require('../config/database');

const validateDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const user = req.user;

    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }

    // Check if user has a registered device
    if (user.deviceId && user.deviceId !== deviceId) {
      return res.status(403).json({ 
        error: 'Device mismatch. This account is registered to a different device.',
        code: 'DEVICE_MISMATCH'
      });
    }

    next();
  } catch (error) {
    console.error('Device validation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const checkDeviceRegistration = async (req, res, next) => {
  try {
    const { deviceId } = req.body;

    // Check if device is already registered to another user
    const existingUser = await prisma.user.findFirst({
      where: { 
        deviceId,
        NOT: { id: req.user ? req.user.id : undefined }
      }
    });

    if (existingUser) {
      return res.status(409).json({ 
        error: 'Device is already registered to another account',
        code: 'DEVICE_ALREADY_REGISTERED'
      });
    }

    next();
  } catch (error) {
    console.error('Device registration check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { validateDevice, checkDeviceRegistration };
