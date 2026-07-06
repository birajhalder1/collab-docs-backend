const ROLES = {
  OWNER: 'owner',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

const ROLE_RANK = {
  [ROLES.VIEWER]: 1,
  [ROLES.EDITOR]: 2,
  [ROLES.OWNER]: 3,
};

const canWrite = (role) => role === ROLES.OWNER || role === ROLES.EDITOR;
const canManageCollaborators = (role) => role === ROLES.OWNER;

module.exports = { ROLES, ROLE_RANK, canWrite, canManageCollaborators };
