const User = require('../models/user.model');
const { verifyAccessToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');

const authenticate = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            throw new AppError('Authentication required', 401);
        }

        const token = header.slice(7);
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId);

        if (!user) {
            throw new AppError('User no longer exists', 401);
        }

        req.user = user;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(
                new AppError('Access token expired. Use refresh token to obtain a new one.', 401)
            );
        }
        if (err.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid access token', 401));
        }
        next(err);
    }
};

module.exports = authenticate;
