const { ROLES } = require('../constants/roles');
const { fields } = require('./common.rules');

module.exports = {
  create: [fields.title(), fields.content()],

  getById: [fields.documentId()],

  listCollaborators: [fields.documentId()],

  addCollaborator: [
    fields.documentId(),
    fields.email(),
    fields.collaboratorRole([ROLES.EDITOR, ROLES.VIEWER]),
  ],

  removeCollaborator: [fields.documentId(), fields.userId()],
};
