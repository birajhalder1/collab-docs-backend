const { fields } = require('./common.rules');

module.exports = {
  pull: [fields.documentId(), fields.sinceVersion()],

  push: [
    fields.documentId(),
    fields.clientId(),
    fields.operations(),
  ],
};
