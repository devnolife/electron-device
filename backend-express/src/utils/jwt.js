const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth');

const generateToken = (payload) => {
  return jwt.sign(payload, authConfig.jwt.secret, {
    expiresIn: authConfig.jwt.expiresIn,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, authConfig.jwt.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
