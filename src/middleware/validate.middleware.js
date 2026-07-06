const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');
const { get } = require('../validators');

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400));
  }
  next();
};

const validateRequest = (schemaKey) => [...get(schemaKey), runValidation];

module.exports = validateRequest;
module.exports.runValidation = runValidation;
module.exports.validateRequest = validateRequest;
