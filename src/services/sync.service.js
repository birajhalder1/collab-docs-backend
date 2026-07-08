const Document = require("../models/document.model");
const Operation = require("../models/operation.model");
const Version = require("../models/version.model");
const AppError = require("../utils/AppError");
const {
  applyOperation,
  transformAgainst,
  compareOps,
} = require("./conflict.service");

const SNAPSHOT_INTERVAL = 10;

/**
 * Create snapshot version
 */
const createSnapshot = async (
  document,
  userId,
  reason = "auto",
  label = "",
) => {
  return Version.create({
    document: document._id,
    versionNumber: document.version,
    title: document.title,
    content: document.content,
    createdBy: userId,
    snapshotReason: reason,
    label,
  });
};

/**
 * Pull changes since version
 */
const pullChanges = async (document, userId, sinceVersion = 0) => {
  const ops = await Operation.find({
    document: document._id,
    appliedVersion: { $gt: sinceVersion },
  }).sort({ appliedVersion: 1 });

  const role = document.getRoleForUser(userId);
  const isOwner = document.owner.toString() === userId.toString();

  return {
    documentId: document._id,
    title: document.title,
    content: document.content,
    version: document.version,
    lamportClock: document.lamportClock,
    role,
    isOwner,
    ownerId: document.owner,

    operations: ops.map((op) => ({
      opId: op.opId,
      clientId: op.clientId,
      userId: op.user,
      type: op.type,
      payload: op.payload,
      baseVersion: op.baseVersion,
      lamportClock: op.lamportClock,
      appliedVersion: op.appliedVersion,
      createdAt: op.createdAt,
    })),
  };
};

/**
 * PUSH OPERATIONS (NO TRANSACTIONS VERSION)
 */
const pushOperations = async (document, userId, { operations, clientId }) => {
  if (!operations?.length) {
    return pullChanges(document, userId, document.version);
  }

  // 1. Load fresh document
  const fresh = await Document.findById(document._id);
  if (!fresh) throw new AppError("Document not found", 404);

  // 2. Deduplicate operations
  const existingOps = await Operation.find({
    document: fresh._id,
    opId: { $in: operations.map((o) => o.opId) },
  });

  const existingSet = new Set(existingOps.map((o) => o.opId));

  const newOps = operations
    .filter((o) => !existingSet.has(o.opId))
    .map((o) => ({
      ...o,
      clientId: o.clientId || clientId,
      user: userId,
    }));

  if (!newOps.length) {
    return pullChanges(fresh, userId, fresh.version);
  }

  // 3. Lamport clock update
  const maxClock = Math.max(...newOps.map((o) => o.lamportClock || 0));
  fresh.lamportClock = Math.max(fresh.lamportClock, maxClock);

  // 4. Fetch concurrent operations
  const minBaseVersion = Math.min(...newOps.map((o) => o.baseVersion || 0));

  const concurrentOps = await Operation.find({
    document: fresh._id,
    appliedVersion: { $gt: minBaseVersion },
    opId: { $nin: newOps.map((o) => o.opId) },
  }).sort({ appliedVersion: 1 });

  // 5. Sort incoming ops
  const sortedNewOps = [...newOps].sort(compareOps);

  let state = {
    title: fresh.title || "Untitled Document",
    content: fresh.content || "",
  };

  const appliedOps = [];

  // 6. Transform + apply operations
  for (const op of sortedNewOps) {
    const concurrentSinceBase = concurrentOps
      .filter((c) => c.appliedVersion > (op.baseVersion || 0))
      .map((c) => ({
        opId: c.opId,
        clientId: c.clientId,
        type: c.type,
        payload: c.payload,
        lamportClock: c.lamportClock,
        baseVersion: c.baseVersion,
      }));

    const priorInBatch = appliedOps.map((a) => ({
      opId: a.opId,
      clientId: a.clientId,
      type: a.type,
      payload: a.payload,
      lamportClock: a.lamportClock,
    }));

    const transformed = transformAgainst(op, [
      ...concurrentSinceBase,
      ...priorInBatch,
    ]);

    state = applyOperation(state, transformed) || {
      title: state.title || "Untitled Document",
      content: state.content || "",
    };

    // HARD SAFETY (important)
    state.title = state.title || "Untitled Document";
    state.content = state.content || "";

    appliedOps.push({
      ...transformed,
      baseVersion: op.baseVersion,
    });
  }

  // 7. Persist operations
  let nextVersion = fresh.version;
  const savedOps = [];

  for (const op of appliedOps.sort(compareOps)) {
    nextVersion++;

    const record = await Operation.create({
      document: fresh._id,
      opId: op.opId,
      clientId: op.clientId,
      user: userId,
      type: op.type,
      payload: op.payload,
      baseVersion: op.baseVersion ?? fresh.version,
      lamportClock: op.lamportClock,
      appliedVersion: nextVersion,
    });

    savedOps.push(record);
  }

  // 8. Update document
  fresh.title = state.title;
  fresh.content = state.content;
  fresh.version = nextVersion;

  await fresh.save();

  // 9. Snapshot
  if (nextVersion % SNAPSHOT_INTERVAL === 0) {
    await Version.create({
      document: fresh._id,
      versionNumber: nextVersion,
      title: fresh.title || "Untitled Document",
      content: fresh.content || "",
      createdBy: userId,
      snapshotReason: "auto",
    });
  }

  const role = fresh.getRoleForUser(userId);
  const isOwner = fresh.owner.toString() === userId.toString();

  return {
    documentId: fresh._id,
    title: fresh.title,
    content: fresh.content,
    version: fresh.version,
    lamportClock: fresh.lamportClock,
    role,
    isOwner,
    ownerId: fresh.owner,
    appliedOperations: savedOps.map((op) => ({
      opId: op.opId,
      appliedVersion: op.appliedVersion,
    })),
  };
};

module.exports = {
  pullChanges,
  pushOperations,
  createSnapshot,
};
