const { prisma } = require('../config/database');
const crypto = require('crypto');

class DeviceService {
  /**
   * Generate device hash for server processing
   * @param {string} deviceHash - Device hash from client
   * @returns {string} - Processed device hash
   */
  generateDeviceHash(deviceHash) {
    const serverSalt = process.env.DEVICE_SALT || 'default-device-salt';
    return crypto.createHash('sha256').update(`${deviceHash}-${serverSalt}`).digest('hex');
  }

  /**
   * Validate device hash format
   * @param {string} deviceHash - Device hash to validate
   * @returns {boolean} - True if valid
   */
  isValidDeviceHash(deviceHash) {
    if (!deviceHash || typeof deviceHash !== 'string') {
      return false;
    }

    // Check minimum length and hex format
    return deviceHash.length >= 32 && /^[a-fA-F0-9]+$/.test(deviceHash);
  }

  /**
   * Check if device hash is already in use by another user
   * @param {string} deviceHash - Device hash to check
   * @param {number} excludeUserId - User ID to exclude from check
   * @returns {Promise<boolean>} - True if already in use
   */
  async isDeviceHashInUse(deviceHash, excludeUserId = null) {
    const processedHash = this.generateDeviceHash(deviceHash);

    const existingToken = await prisma.token.findFirst({
      where: {
        deviceHash: processedHash,
        isValid: true,
        expiresAt: {
          gt: new Date()
        },
        ...(excludeUserId && {
          user: {
            id: {
              not: excludeUserId
            }
          }
        })
      },
      include: {
        user: {
          select: {
            id: true,
            isActive: true
          }
        }
      }
    });

    return !!(existingToken && existingToken.user.isActive);
  }

  /**
   * Get device information for a user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Device information
   */
  async getDeviceInfo(userId) {
    const tokens = await prisma.token.findMany({
      where: {
        userId,
        isValid: true,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        deviceHash: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      activeDevices: tokens.length,
      devices: tokens.map(token => ({
        deviceId: token.deviceHash.substring(0, 8) + '...',
        lastActive: token.createdAt,
        expiresAt: token.expiresAt
      }))
    };
  }

  /**
   * Invalidate all tokens for a specific device hash
   * @param {string} deviceHash - Device hash
   * @returns {Promise<number>} - Number of tokens invalidated
   */
  async invalidateDeviceTokens(deviceHash) {
    const processedHash = this.generateDeviceHash(deviceHash);

    const result = await prisma.token.updateMany({
      where: {
        deviceHash: processedHash,
        isValid: true
      },
      data: {
        isValid: false
      }
    });

    return result.count;
  }

  /**
   * Clean up expired tokens
   * @returns {Promise<number>} - Number of tokens cleaned up
   */
  async cleanupExpiredTokens() {
    const result = await prisma.token.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date()
            }
          },
          {
            isValid: false,
            createdAt: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
            }
          }
        ]
      }
    });

    return result.count;
  }

  /**
   * Get device statistics
   * @returns {Promise<Object>} - Device statistics
   */
  async getDeviceStats() {
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT deviceHash) as unique_devices,
        COUNT(*) as total_active_tokens,
        COUNT(DISTINCT userId) as users_with_active_tokens
      FROM Token 
      WHERE isValid = true AND expiresAt > NOW()
    `;

    const userStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN isActive = true THEN 1 END) as active_users
      FROM User
    `;

    return {
      devices: stats[0],
      users: userStats[0],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new DeviceService();
