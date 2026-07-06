const syncService = require("../services/sync.service");
const Document = require("../models/document.model");
const AppError = require("../utils/AppError");
const { canWrite } = require("../constants/roles");
const mongoose = require("mongoose");

const pull = async (req, res, next) => {
  try {
    const sinceVersion = parseInt(req.query.sinceVersion || "0", 10);
    const data = await syncService.pullChanges(req.document, sinceVersion);

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

const push = async (req, res, next) => {
  try {
    const { documentId } = req.params;

    // Validate ObjectId early (important after migration)
    if (!mongoose.Types.ObjectId.isValid(documentId)) {
      throw new AppError("Invalid documentId", 400);
    }

    let document = await Document.findById(documentId);
    if (!document) {
      const createOperation = req.body.operations?.find(
        (op) => op.type === "create",
      );

      if (!createOperation) {
        throw new AppError("Document not found", 404);
      }

      document = await Document.create({
        _id: documentId,
        title: createOperation.payload.title || "Untitled Document",
        content: createOperation.payload.content || "",
        owner: req.user._id, // already ObjectId
        version: 1,
        lamportClock: 0,
      });
    } else {
      /**
       * ACCESS CONTROL
       */
      const role = document.getRoleForUser(req.user._id);

      if (!role) {
        throw new AppError("Access denied", 403);
      }

      if (!canWrite(role)) {
        throw new AppError("Viewers cannot modify documents", 403);
      }
    }

    /**
     * PUSH OPERATIONS
     */
    const data = await syncService.pushOperations(
      document,
      req.user._id,
      req.body,
    );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  pull,
  push,
};
