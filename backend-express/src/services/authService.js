const { prisma } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const tokenService = require('./tokenService');
const deviceService = require('./deviceService');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Registration result
   */
  async register({ username, email, password, deviceHash }) {
    try {
      // Validate device hash
      if (!deviceService.isValidDeviceHash(deviceHash)) {
        throw new Error('Invalid device hash format');
      }

      // Check if device is already in use by another user
      const deviceInUse = await deviceService.isDeviceHashInUse(deviceHash);
      if (deviceInUse) {
        throw new Error('Device is already registered to another user');
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw new Error('Username already exists');
        }
        if (existingUser.email === email) {
          throw new Error('Email already exists');
        }
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: hashedPassword,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Generate token
      const token = await tokenService.generateToken(
        user.id,
        deviceService.generateDeviceHash(deviceHash)
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   * @param {Object} loginData - User login data
   * @returns {Promise<Object>} - Login result
   */
  async login({ username, password, deviceHash }) {
    try {
      // Validate device hash
      if (!deviceService.isValidDeviceHash(deviceHash)) {
        throw new Error('Invalid device hash format');
      }

      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email: username } // Allow login with email
          ],
          isActive: true
        }
      });

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Generate token
      const token = await tokenService.generateToken(
        user.id,
        deviceService.generateDeviceHash(deviceHash)
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   * @param {string} token - JWT token to invalidate
   * @returns {Promise<Object>} - Logout result
   */
  async logout(token) {
    try {
      await tokenService.invalidateToken(token);
      return { message: 'Logout successful' };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Force logout user from all devices
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Force logout result
   */
  async forceLogout(userId) {
    try {
      await tokenService.invalidateAllUserTokens(userId);
      return { message: 'Force logout successful - all devices logged out' };
    } catch (error) {
      console.error('Force logout error:', error);
      throw error;
    }
  }

  /**
   * Logout from other devices
   * @param {number} userId - User ID
   * @param {string} deviceHash - Current device hash to keep active
   * @returns {Promise<Object>} - Logout result
   */
  async logoutFromOtherDevices(userId, deviceHash) {
    try {
      const processedDeviceHash = deviceService.generateDeviceHash(deviceHash);

      await tokenService.invalidateOtherDeviceTokens(userId, processedDeviceHash);

      return {
        message: 'Successfully logged out from other devices',
        currentDeviceActive: true
      };
    } catch (error) {
      console.error('Logout from other devices error:', error);
      throw error;
    }
  }

  /**
   * Verify token
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} - Token verification result
   */
  async verifyToken(token) {
    try {
      const decoded = await tokenService.verifyToken(token);

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          createdAt: true
        }
      });

      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return {
        valid: true,
        user,
        tokenData: decoded
      };
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  /**
   * Get active sessions for user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Active sessions
   */
  async getActiveSessions(userId) {
    try {
      const tokens = await prisma.token.findMany({
        where: {
          userId,
          isValid: true,
          expiresAt: {
            gt: new Date()
          }
        },
        select: {
          id: true,
          deviceHash: true,
          createdAt: true,
          expiresAt: true,
          lastUsed: true
        },
        orderBy: {
          lastUsed: 'desc'
        }
      });

      return tokens.map(token => ({
        id: token.id,
        deviceId: token.deviceHash.substring(0, 8) + '...' + token.deviceHash.substring(token.deviceHash.length - 8),
        createdAt: token.createdAt,
        expiresAt: token.expiresAt,
        lastUsed: token.lastUsed
      }));
    } catch (error) {
      console.error('Get active sessions error:', error);
      throw error;
    }
  }

  /**
   * Deactivate user account
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Deactivation result
   */
  async deactivateAccount(userId) {
    try {
      // Invalidate all tokens
      await tokenService.invalidateAllUserTokens(userId);

      // Deactivate user
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      return { message: 'Account deactivated successfully' };
    } catch (error) {
      console.error('Deactivate account error:', error);
      throw error;
    }
  }

  /**
   * Reactivate user account
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Reactivation result
   */
  async reactivateAccount(userId) {
    try {
      // Reactivate user
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: true,
          updatedAt: new Date()
        },
        select: {
          id: true,
          username: true,
          email: true,
          isActive: true,
          createdAt: true
        }
      });

      return {
        message: 'Account reactivated successfully',
        user
      };
    } catch (error) {
      console.error('Reactivate account error:', error);
      throw error;
    }
  }
}

// Export the AuthService class instance
module.exports = new AuthService();
