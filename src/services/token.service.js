const { jwtAccessExpiresIn, jwtRefreshExpiresIn } = require('../config/env');
const { signAccessToken } = require('../utils/jwt');
const RefreshToken = require('../models/refreshToken.model');
const AppError = require('../utils/AppError');

const parseExpiry = (value) => {
  const match = String(value).match(/^(\d+)([smhd])$/i);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const amount = parseInt(match[1], 10);
  const unitMs = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * unitMs[match[2].toLowerCase()];
};

const refreshExpiresMs = parseExpiry(jwtRefreshExpiresIn);

const issueTokenPair = async (userId) => {
  const userIdStr = userId.toString();
  const accessToken = signAccessToken({ userId: userIdStr });
  const refreshToken = await RefreshToken.createForUser(
    userId,
    new Date(Date.now() + refreshExpiresMs)
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: parseExpiry(jwtAccessExpiresIn) / 1000,
    tokenType: 'Bearer',
  };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const record = await RefreshToken.findValid(refreshToken);
  if (!record) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  record.revokedAt = new Date();
  await record.save();

  const tokens = await issueTokenPair(record.user);
  record.replacedBy = RefreshToken.hashToken(tokens.refreshToken);
  await record.save();

  return tokens;
};

const revokeRefreshToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const record = await RefreshToken.findValid(refreshToken);
  if (record) {
    record.revokedAt = new Date();
    await record.save();
  }
};

const revokeAllForUser = async (userId) => {
  await RefreshToken.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );
};

module.exports = {
  issueTokenPair,
  refreshAccessToken,
  revokeRefreshToken,
  revokeAllForUser,
};
