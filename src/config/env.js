require('dotenv').config();

module.exports = {
  /** Please add the values here in the production environment */
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  clientOrigin: process.env.CLIENT_ORIGIN,
  frontendUrl: process.env.FRONTEND_URL

  // mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/local-first-architecture',
  // jwtSecret: process.env.JWT_SECRET || 'local-first-architecture-in-production',
  // jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  // jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  // clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
};
