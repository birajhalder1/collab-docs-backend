const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = Router();

router.post('/register', validateRequest('auth.register'), authController.register);
router.post('/login', validateRequest('auth.login'), authController.login);
router.post('/refresh', validateRequest('auth.refresh'), authController.refresh);
router.post('/logout', validateRequest('auth.logout'), authController.logout);
router.get('/me', authenticate, authController.me);

module.exports = router;
