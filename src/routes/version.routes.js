const { Router } = require('express');
const versionController = require('../controllers/version.controller');
const authenticate = require('../middleware/auth.middleware');
const {
  loadDocument,
  requireWriteAccess,
} = require('../middleware/permission.middleware');
const { validateRequest } = require('../middleware/validate.middleware');

const router = Router();

router.use(authenticate);

router.get(
  '/:documentId/versions',
  validateRequest('version.list'),
  loadDocument,
  versionController.listVersions
);

router.get(
  '/:documentId/versions/diff/range',
  validateRequest('version.diff'),
  loadDocument,
  versionController.diffVersions
);

router.get(
  '/:documentId/versions/:versionNumber',
  validateRequest('version.getByVersion'),
  loadDocument,
  versionController.getVersion
);

router.post(
  '/:documentId/versions/snapshot',
  validateRequest('version.createSnapshot'),
  loadDocument,
  requireWriteAccess,
  versionController.createSnapshot
);

router.post(
  '/:documentId/versions/:versionNumber/restore',
  validateRequest('version.restore'),
  loadDocument,
  requireWriteAccess,
  versionController.restoreVersion
);

module.exports = router;
