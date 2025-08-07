const authService = require('../services/authService');
const deviceService = require('../services/deviceService');
const { validateRegistration, validateLogin, handleValidationErrors } = require('../utils/validators');
const { prisma } = require('../config/database');
const bcrypt = require('bcrypt');

class AuthController {
  async register(req, res, next) {
    try {
      const { username, email, password, deviceHash } = req.body;

      // Validate required fields
      if (!deviceHash) {
        return res.status(400).json({
          error: 'Device authentication required',
          code: 'DEVICE_HASH_REQUIRED'
        });
      }

      const result = await authService.register({
        username,
        email,
        password,
        deviceHash,
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { username, password, deviceHash } = req.body;

      // Validate required fields
      if (!deviceHash) {
        return res.status(400).json({
          error: 'Device authentication required',
          code: 'DEVICE_HASH_REQUIRED'
        });
      }

      const result = await authService.login({
        username,
        password,
        deviceHash,
      });

      res.status(200).json({
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      await authService.logout(token);

      res.status(200).json({
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  }

  async forceLogout(req, res, next) {
    try {
      const userId = req.user.id;

      await authService.forceLogout(userId);

      res.status(200).json({
        message: 'Force logout successful - all devices logged out',
      });
    } catch (error) {
      next(error);
    }
  }

  async logoutFromOtherDevices(req, res, next) {
    try {
      const userId = req.user.id;
      const { deviceHash } = req.body;

      if (!deviceHash) {
        return res.status(400).json({
          error: 'Device hash required',
          code: 'DEVICE_HASH_REQUIRED'
        });
      }

      const result = await authService.logoutFromOtherDevices(userId, deviceHash);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async verify(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(400).json({ error: 'Token required' });
      }

      const result = await authService.verifyToken(token);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getActiveSessions(req, res, next) {
    try {
      const userId = req.user.id;

      const sessions = await authService.getActiveSessions(userId);

      res.status(200).json({
        sessions,
        totalDevices: sessions.length
      });
    } catch (error) {
      next(error);
    }
  }

  async deactivateAccount(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await authService.deactivateAccount(userId);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async reactivateAccount(req, res, next) {
    try {
      const { username, password, deviceHash } = req.body;

      if (!deviceHash) {
        return res.status(400).json({
          error: 'Device authentication required',
          code: 'DEVICE_HASH_REQUIRED'
        });
      }

      // Find deactivated user
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email: username }],
          isActive: false
        }
      });

      if (!user) {
        return res.status(404).json({
          error: 'Account not found or already active'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const result = await authService.reactivateAccount(user.id);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async healthCheck(req, res, next) {
    try {
      // Simple health check for the auth system
      const stats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN isActive = true THEN 1 END) as active_users,
          COUNT(CASE WHEN lastLogin > DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as recent_logins
        FROM User
      `;

      const tokenStats = await prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_tokens,
          COUNT(CASE WHEN isValid = true AND expiresAt > NOW() THEN 1 END) as active_tokens
        FROM Token
      `;

      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: {
          users: stats[0],
          tokens: tokenStats[0]
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
