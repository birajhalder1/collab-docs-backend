/**
 * Deterministic conflict resolution for concurrent text operations.
 * Operations are ordered by (lamportClock, clientId, opId) lexicographically.
 * Same-position inserts shift deterministically; deletes use intent preservation.
 */

const compareOps = (a, b) => {
  if (a.lamportClock !== b.lamportClock) {
    return a.lamportClock - b.lamportClock;
  }
  if (a.clientId !== b.clientId) {
    return a.clientId.localeCompare(b.clientId);
  }
  return a.opId.localeCompare(b.opId);
};

const applyOperation = (state, op) => {
  const { type, payload } = op;
  let { title, content } = state;

  switch (type) {
    case "create":
    case "update":
    case "replace":
      title = payload.title ?? title;
      content = payload.content ?? content;
      break;

    case "set_title":
      title = payload.title ?? title;
      break;

    case "insert": {
      const pos = Math.max(0, Math.min(payload.index ?? 0, content.length));
      const text = payload.text ?? "";
      content = content.slice(0, pos) + text + content.slice(pos);
      break;
    }

    case "delete": {
      // If delete means delete whole document
      if (payload.id) {
        title = "";
        content = "";
        break;
      }

      const start = Math.max(0, Math.min(payload.index ?? 0, content.length));
      const len = Math.max(0, payload.length ?? 0);
      content = content.slice(0, start) + content.slice(start + len);
      break;
    }

    default:
      break;
  }

  return { title, content };
};

const transformAgainst = (op, priorOps) => {
  if (!priorOps.length) return op;

  let { type, payload } = op;
  const next = { ...op, payload: { ...payload } };

  for (const prior of priorOps) {
    if (prior.type === "insert" && (type === "insert" || type === "delete")) {
      const priorIndex = prior.payload.index ?? 0;
      const priorLen = (prior.payload.text ?? "").length;
      const index = next.payload.index ?? 0;

      if (priorIndex <= index) {
        next.payload.index = index + priorLen;
      }
    }

    if (prior.type === "delete" && (type === "insert" || type === "delete")) {
      const priorStart = prior.payload.index ?? 0;
      const priorLen = prior.payload.length ?? 0;
      const priorEnd = priorStart + priorLen;
      let index = next.payload.index ?? 0;

      if (index >= priorEnd) {
        next.payload.index = index - priorLen;
      } else if (index > priorStart) {
        next.payload.index = priorStart;
      }

      if (type === "delete") {
        let length = next.payload.length ?? 0;
        const end = index + length;

        if (end <= priorStart) {
          // unchanged
        } else if (index >= priorEnd) {
          next.payload.length = length;
        } else if (index <= priorStart && end >= priorEnd) {
          next.payload.length = length - priorLen;
        } else if (index <= priorStart) {
          next.payload.length = priorStart - index;
        } else {
          next.payload.length = Math.max(0, end - priorEnd);
          next.payload.index = priorStart;
        }
      }
    }
  }

  return next;
};

const mergeOperations = (baseState, incomingOps, existingOps = []) => {
  const sortedIncoming = [...incomingOps].sort(compareOps);
  const sortedExisting = [...existingOps].sort(compareOps);
  const allOps = [...sortedExisting, ...sortedIncoming].sort(compareOps);

  const seen = new Set();
  const uniqueOps = [];
  for (const op of allOps) {
    if (seen.has(op.opId)) continue;
    seen.add(op.opId);
    uniqueOps.push(op);
  }

  let state = { ...baseState };
  const applied = [];

  for (const op of uniqueOps) {
    const priorInBatch = applied.filter((a) => compareOps(a, op) < 0);
    const transformed = transformAgainst(op, priorInBatch);
    state = applyOperation(state, transformed);
    applied.push({
      ...transformed,
      resultingTitle: state.title,
      resultingContent: state.content,
    });
  }

  return { state, appliedOps: applied };
};

module.exports = {
  compareOps,
  applyOperation,
  transformAgainst,
  mergeOperations,
};
