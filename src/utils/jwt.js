const jwt = require('jsonwebtoken');
const { jwtSecret, jwtAccessExpiresIn } = require('../config/env');

const ACCESS_TYPE = 'access';

const signAccessToken = (payload) =>
  jwt.sign({ ...payload, type: ACCESS_TYPE }, jwtSecret, {
    expiresIn: jwtAccessExpiresIn,
  });

const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, jwtSecret);
  if (decoded.type !== ACCESS_TYPE) {
    throw new jwt.JsonWebTokenError('Invalid access token');
  }
  return decoded;
};

module.exports = {
  signAccessToken,
  verifyAccessToken,
};
