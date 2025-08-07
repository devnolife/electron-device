const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const { verifyToken } = require('../utils/jwt');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify JWT token
    const decoded = verifyToken(token);
    
    // Check if token exists in database and is valid
    const tokenRecord = await prisma.token.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!tokenRecord || !tokenRecord.isValid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check if token is expired
    if (new Date() > tokenRecord.expiresAt) {
      // Mark token as invalid
      await prisma.token.update({
        where: { id: tokenRecord.id },
        data: { isValid: false },
      });
      return res.status(401).json({ error: 'Token expired' });
    }

    req.user = tokenRecord.user;
    req.token = tokenRecord;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateToken };
