const deviceService = require('../services/deviceService');
const authService = require('../services/authService');
const { prisma } = require('../config/database');
const bcrypt = require('bcrypt');

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = req.user;

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeviceInfo(req, res, next) {
    try {
      const userId = req.user.id;

      const deviceInfo = await deviceService.getDeviceInfo(userId);

      res.status(200).json({
        deviceInfo,
      });
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

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { email } = req.body;

      // Basic validation
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          error: 'Invalid email format'
        });
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(email && { email })
        },
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
        }
      });

      res.status(200).json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          error: 'Email already exists'
        });
      }
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long'
        });
      }

      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });

      // Invalidate all tokens to force re-login
      await prisma.token.updateMany({
        where: { userId },
        data: { isValid: false }
      });

      res.status(200).json({
        message: 'Password changed successfully. Please login again.'
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

  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          error: 'Password confirmation required'
        });
      }

      // Verify password
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          error: 'Invalid password'
        });
      }

      // Delete user and all related data (cascade will handle tokens)
      await prisma.user.delete({
        where: { id: userId }
      });

      res.status(200).json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
