const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const { issueTokenPair, refreshAccessToken, revokeRefreshToken } = require('./token.service');

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const user = await User.create({ name, email, password });
  const tokens = await issueTokenPair(user._id);

  return {
    user: formatUser(user),
    ...tokens,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const tokens = await issueTokenPair(user._id);

  return {
    user: formatUser(user),
    ...tokens,
  };
};

const refresh = async ({ refreshToken }) => {
  const tokens = await refreshAccessToken(refreshToken);
  return tokens;
};

const logout = async ({ refreshToken }) => {
  await revokeRefreshToken(refreshToken);
  return { message: 'Logged out successfully' };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return formatUser(user);
};

module.exports = { register, login, refresh, logout, getProfile };
