const { prisma } = require('../config/database');
const { generateToken, verifyToken } = require('../utils/jwt');

class TokenService {
  /**
   * Generate and store a new token
   * @param {number} userId - User ID
   * @param {string} deviceHash - Device hash
   * @returns {Promise<string>} - Generated token
   */
  async generateToken(userId, deviceHash) {
    const token = generateToken({
      userId,
      deviceHash,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.token.create({
      data: {
        token,
        userId,
        deviceHash,
        expiresAt,
        isValid: true,
        createdAt: new Date(),
        lastUsed: new Date()
      }
    });

    return token;
  }

  /**
   * Verify a token
   * @param {string} token - JWT token to verify
   * @returns {Promise<Object>} - Decoded token data
   */
  async verifyToken(token) {
    // First verify JWT signature and expiration
    const decoded = verifyToken(token);

    // Then check if token exists in database and is valid
    const tokenRecord = await prisma.token.findFirst({
      where: {
        token,
        isValid: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!tokenRecord) {
      throw new Error('Token not found or expired');
    }

    // Update last used timestamp
    await prisma.token.update({
      where: { id: tokenRecord.id },
      data: { lastUsed: new Date() }
    });

    return decoded;
  }

  async createToken(userId, deviceId) {
    const token = generateToken({
      userId,
      deviceId,
    });

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.token.create({
      data: {
        token,
        userId,
        deviceId,
        expiresAt,
      }
    });

    return token;
  }

  async invalidateToken(token) {
    await prisma.token.updateMany({
      where: { token },
      data: { isValid: false }
    });
  }

  async invalidateAllUserTokens(userId) {
    await prisma.token.updateMany({
      where: { userId },
      data: { isValid: false }
    });
  }

  async cleanupExpiredTokens() {
    const result = await prisma.token.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    return result.count;
  }

  /**
   * Invalidate tokens from other devices
   * @param {number} userId - User ID
   * @param {string} currentDeviceHash - Current device hash to keep active
   * @returns {Promise<void>}
   */
  async invalidateOtherDeviceTokens(userId, currentDeviceHash) {
    await prisma.token.updateMany({
      where: {
        userId,
        deviceHash: {
          not: currentDeviceHash
        },
        isValid: true
      },
      data: { isValid: false }
    });
  }

  async getActiveTokens(userId) {
    return await prisma.token.findMany({
      where: {
        userId,
        isValid: true,
        expiresAt: {
          gt: new Date()
        }
      },
      select: {
        id: true,
        deviceId: true,
        createdAt: true,
        expiresAt: true,
      }
    });
  }
}

module.exports = new TokenService();
