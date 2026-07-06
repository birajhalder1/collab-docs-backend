const mongoose = require('mongoose');
const Document = require('../models/document.model');
const Operation = require('../models/operation.model');
const Version = require('../models/version.model');
const AppError = require('../utils/AppError');
const { createSnapshot } = require('./sync.service');

const listVersions = async (documentId, { limit = 50, offset = 0 } = {}) => {
  const versions = await Version.find({ document: documentId })
    .sort({ version: -1 })
    .skip(offset)
    .limit(limit)
    .populate('createdBy', 'name email');

  return versions.map((v) => ({
    id: v._id,
    version: v.version,
    title: v.title,
    label: v.label,
    snapshotReason: v.snapshotReason,
    createdAt: v.createdAt,
    createdBy: v.createdBy
      ? { id: v.createdBy._id, name: v.createdBy.name, email: v.createdBy.email }
      : null,
  }));
};

const getVersion = async (documentId, versionNumber) => {
  const version = await Version.findOne({
    document: documentId,
    version: versionNumber,
  }).populate('createdBy', 'name email');

  if (!version) throw new AppError('Version not found', 404);

  return {
    id: version._id,
    version: version.version,
    title: version.title,
    content: version.content,
    label: version.label,
    snapshotReason: version.snapshotReason,
    createdAt: version.createdAt,
    createdBy: version.createdBy
      ? {
          id: version.createdBy._id,
          name: version.createdBy.name,
          email: version.createdBy.email,
        }
      : null,
  };
};

const createManualSnapshot = async (document, userId, label = '') => {
  await createSnapshot(document, userId, 'manual', label);
  return getVersion(document._id, document.version);
};

const restoreVersion = async (document, userId, versionNumber) => {
  const snapshot = await Version.findOne({
    document: document._id,
    version: versionNumber,
  });
  if (!snapshot) throw new AppError('Version not found', 404);

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fresh = await Document.findById(document._id).session(session);
    const nextVersion = fresh.version + 1;

    await Operation.create(
      [
        {
          document: fresh._id,
          opId: `restore-${versionNumber}-${Date.now()}`,
          clientId: 'server',
          user: userId,
          type: 'replace',
          payload: { title: snapshot.title, content: snapshot.content },
          baseVersion: fresh.version,
          lamportClock: fresh.lamportClock + 1,
          appliedVersion: nextVersion,
        },
      ],
      { session }
    );

    fresh.title = snapshot.title;
    fresh.content = snapshot.content;
    fresh.version = nextVersion;
    fresh.lamportClock += 1;
    await fresh.save({ session });

    await Version.create(
      [
        {
          document: fresh._id,
          version: nextVersion,
          title: fresh.title,
          content: fresh.content,
          createdBy: userId,
          snapshotReason: 'restore',
          label: `Restored from v${versionNumber}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    return {
      documentId: fresh._id,
      version: fresh.version,
      title: fresh.title,
      content: fresh.content,
      restoredFrom: versionNumber,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const diffVersions = async (documentId, fromVersion, toVersion) => {
  const [from, to] = await Promise.all([
    Version.findOne({ document: documentId, version: fromVersion }),
    Version.findOne({ document: documentId, version: toVersion }),
  ]);

  if (!from || !to) throw new AppError('One or both versions not found', 404);

  return {
    from: { version: from.version, title: from.title, content: from.content },
    to: { version: to.version, title: to.title, content: to.content },
  };
};

module.exports = {
  listVersions,
  getVersion,
  createManualSnapshot,
  restoreVersion,
  diffVersions,
};
