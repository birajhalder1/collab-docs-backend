const { Router } = require("express");
const documentController = require("../controllers/document.controller");
const authenticate = require("../middleware/auth.middleware");
const {
  loadDocument,
  requireManageAccess,
} = require("../middleware/permission.middleware");
const { validateRequest } = require("../middleware/validate.middleware");

const router = Router();

router.use(authenticate);

router.get("/", documentController.listDocuments);

router.post(
  "/",
  validateRequest("document.create"),
  documentController.createDocument,
);

router.get(
  "/:documentId",
  validateRequest("document.getById"),
  loadDocument,
  documentController.getDocument,
);

router.get(
  "/:documentId/collaborators",
  validateRequest("document.listCollaborators"),
  loadDocument,
  documentController.listCollaborators,
);

router.post(
  "/:documentId/collaborators",
  validateRequest("document.addCollaborator"),
  loadDocument,
  requireManageAccess,
  documentController.addCollaborator,
);

router.delete(
  "/:documentId/collaborators/:userId",
  validateRequest("document.removeCollaborator"),
  loadDocument,
  requireManageAccess,
  documentController.removeCollaborator,
);

module.exports = router;
