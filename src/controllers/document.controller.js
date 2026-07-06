const Document = require("../models/document.model");
const documentService = require("../services/document.service");

const listDocuments = async (req, res, next) => {
  try {
    const docs = await documentService.listForUser(req.user._id);

    res.json({
      success: true,
      data: docs,
    });
  } catch (err) {
    next(err);
  }
};

const createDocument = async (req, res, next) => {
  try {
    const { title, content } = req.body;

    const document = await Document.create({
      title: title || "Untitled Document",
      content: content || "",
      owner: req.user._id,
      version: 1,
      lamportClock: 0,
    });

    res.status(201).json({
      success: true,
      data: {
        id: document._id.toString(),
        title: document.title,
        content: document.content,
        owner: document.owner,
        collaborators: document.collaborators,
        version: document.version,
        lamportClock: document.lamportClock,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getDocument = async (req, res, next) => {
  try {
    const doc = await documentService.getById(req.document, req.documentRole);

    res.json({
      success: true,
      data: doc,
    });
  } catch (err) {
    next(err);
  }
};

const listCollaborators = async (req, res, next) => {
  try {
    const members = await documentService.listCollaborators(req.document);

    res.json({
      success: true,
      data: members,
    });
  } catch (err) {
    next(err);
  }
};

const addCollaborator = async (req, res, next) => {
  try {
    const member = await documentService.addCollaborator(
      req.document,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (err) {
    next(err);
  }
};

const removeCollaborator = async (req, res, next) => {
  try {
    await documentService.removeCollaborator(req.document, req.params.userId);

    res.json({
      success: true,
      message: "Collaborator removed",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listDocuments,
  createDocument,
  getDocument,
  listCollaborators,
  addCollaborator,
  removeCollaborator,
};
