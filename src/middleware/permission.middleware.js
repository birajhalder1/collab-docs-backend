const Document = require("../models/document.model");
const AppError = require("../utils/AppError");
const {
  canWrite,
  canManageCollaborators,
  ROLES,
} = require("../constants/roles");

const loadDocument = async (req, res, next) => {
  try {
    const document = await Document.findById(req.params.documentId);
    const role = document.getRoleForUser(req.user._id);

    if (!document) {
      return next(new AppError("Document not found", 404));
    }

    if (!role) {
      return next(new AppError("Access denied", 403));
    }

    req.document = document;
    req.documentRole = role;

    next();
  } catch (err) {
    next(err);
  }
};

// const loadDocument = async (req, res, next) => {
//   const document = await Document.findById(req.params.documentId);

//   if (!document) {
//     return next(new AppError('Document not found', 404));
//   }

//   const role = document.getRoleForUser(req.user._id);
//   if (!role) {
//     return next(new AppError('Access denied', 403));
//   }

//   req.document = document;
//   req.documentRole = role;
//   next();
// };

const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!allowedRoles.includes(req.documentRole)) {
      return next(new AppError("Insufficient permissions", 403));
    }
    next();
  };

const requireWriteAccess = (req, res, next) => {
  if (!canWrite(req.documentRole)) {
    return next(new AppError("Viewers cannot modify documents", 403));
  }
  next();
};

const requireManageAccess = (req, res, next) => {
  if (!canManageCollaborators(req.documentRole)) {
    return next(new AppError("Only owners can manage collaborators", 403));
  }
  next();
};

module.exports = {
  loadDocument,
  requireRole,
  requireWriteAccess,
  requireManageAccess,
  ROLES,
};
