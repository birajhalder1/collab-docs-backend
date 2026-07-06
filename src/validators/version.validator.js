const { fields } = require('./common.rules');

module.exports = {
  list: [fields.documentId()],

  getByVersion: [fields.documentId(), fields.versionNumber()],

  createSnapshot: [fields.documentId(), fields.snapshotLabel()],

  restore: [fields.documentId(), fields.versionNumber()],

  diff: [fields.documentId(), fields.diffFrom(), fields.diffTo()],
};
