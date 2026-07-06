const Document = require('../models/document.model');
const Version = require('../models/version.model');
const User = require('../models/user.model');
const AppError = require('../utils/AppError');
const { ROLES } = require('../constants/roles');

const listForUser = async (userId) => {
  const docs = await Document.find({
    $or: [{ owner: userId }, { 'collaborators.user': userId }],
  })
    .sort({ updatedAt: -1 })
    .select('title owner version updatedAt collaborators');

  return docs.map((doc) => ({
    id: doc._id,
    title: doc.title,
    version: doc.version,
    updatedAt: doc.updatedAt,
    role: doc.getRoleForUser(userId),
    isOwner: doc.owner.toString() === userId.toString(),
  }));
};

const create = async (userId, { title = 'Untitled Document', content = '' } = {}) => {
  const document = await Document.create({
    title,
    content,
    owner: userId,
    version: 0,
    lamportClock: 0,
  });

  await Version.create({
    document: document._id,
    version: 0,
    title: document.title,
    content: document.content,
    createdBy: userId,
    snapshotReason: 'auto',
    label: 'Initial version',
  });

  return {
    id: document._id,
    title: document.title,
    content: document.content,
    version: document.version,
    role: ROLES.OWNER,
  };
};

const getById = async (document, role) => ({
  id: document._id,
  title: document.title,
  content: document.content,
  version: document.version,
  lamportClock: document.lamportClock,
  role,
  owner: document.owner,
  updatedAt: document.updatedAt,
});

const updateMetadata = async (document, { title }) => {
  if (title !== undefined) document.title = title;
  await document.save();
  return getById(document, document.getRoleForUser(document.owner));
};

const addCollaborator = async (document, { email, role }) => {
  if (role === ROLES.OWNER) {
    throw new AppError('Cannot assign owner role to collaborators', 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError('User not found', 404);
  if (user._id.toString() === document.owner.toString()) {
    throw new AppError('Owner already has full access', 400);
  }

  const existing = document.collaborators.find(
    (c) => c.user.toString() === user._id.toString()
  );
  if (existing) {
    existing.role = role;
  } else {
    document.collaborators.push({ user: user._id, role });
  }

  await document.save();
  return {
    user: { id: user._id, name: user.name, email: user.email },
    role,
  };
};

const listCollaborators = async (document) => {
  await document.populate('owner', 'name email');
  await document.populate('collaborators.user', 'name email');

  const members = [
    {
      user: {
        id: document.owner._id,
        name: document.owner.name,
        email: document.owner.email,
      },
      role: ROLES.OWNER,
    },
    ...document.collaborators.map((c) => ({
      user: {
        id: c.user._id,
        name: c.user.name,
        email: c.user.email,
      },
      role: c.role,
    })),
  ];

  return members;
};

const removeCollaborator = async (document, targetUserId) => {
  if (targetUserId.toString() === document.owner.toString()) {
    throw new AppError('Cannot remove document owner', 400);
  }

  document.collaborators = document.collaborators.filter(
    (c) => c.user.toString() !== targetUserId.toString()
  );
  await document.save();
};

module.exports = {
  listForUser,
  create,
  getById,
  updateMetadata,
  addCollaborator,
  listCollaborators,
  removeCollaborator,
};
