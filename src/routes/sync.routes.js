const { Router } = require('express');
const syncController = require('../controllers/sync.controller');
const authenticate = require('../middleware/auth.middleware');
const {
  loadDocument,
  requireWriteAccess,
} = require('../middleware/permission.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = Router();

router.use(authenticate);

router.get(
  '/:documentId/pull',
  validateRequest('sync.pull'),
  loadDocument,
  syncController.pull
);

router.post(
  '/:documentId/push',
  validateRequest('sync.push'),
  // loadDocument,
  // requireWriteAccess,
  syncController.push
);

module.exports = router;
