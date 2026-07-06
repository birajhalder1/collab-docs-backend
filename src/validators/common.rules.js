const { body, param, query } = require('express-validator');

const fields = {
  name: () => body('name').trim().notEmpty().withMessage('Name is required'),

  email: () => body('email').isEmail().withMessage('Valid email is required'),

  passwordRegister: () =>
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),

  passwordLogin: () =>
    body('password').notEmpty().withMessage('Password is required'),

  refreshToken: () =>
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),

  title: () =>
    body('title')
      .optional()
      .trim()
      .isLength({ max: 200 })
      .withMessage('Title must be at most 200 characters'),

  content: () =>
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string'),

  clientId: () =>
    body('clientId').notEmpty().withMessage('clientId is required'),

  operations: () =>
    body('operations').isArray().withMessage('operations must be an array'),

  snapshotLabel: () =>
    body('label')
      .optional()
      .trim()
      .isLength({ max: 120 })
      .withMessage('Label must be at most 120 characters'),

  collaboratorRole: (allowedRoles) =>
    body('role')
      .isIn(allowedRoles)
      .withMessage(`Role must be one of: ${allowedRoles.join(', ')}`),

  documentId: () =>
    param('documentId').isMongoId().withMessage('Invalid document id'),

  userId: () =>
    param('userId').isMongoId().withMessage('Invalid user id'),

  versionNumber: () =>
    param('versionNumber')
      .isInt({ min: 0 })
      .withMessage('Version must be a non-negative integer'),

  sinceVersion: () =>
    query('sinceVersion')
      .optional()
      .isInt({ min: 0 })
      .withMessage('sinceVersion must be a non-negative integer'),

  diffFrom: () =>
    query('from')
      .isInt({ min: 0 })
      .withMessage('from version must be a non-negative integer'),

  diffTo: () =>
    query('to')
      .isInt({ min: 0 })
      .withMessage('to version must be a non-negative integer'),
};

module.exports = { fields };
