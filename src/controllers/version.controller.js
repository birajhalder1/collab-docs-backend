const versionService = require('../services/version.service');

const listVersions = async (req, res, next) => {
  try {
    const data = await versionService.listVersions(req.document._id, req.query);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getVersion = async (req, res, next) => {
  try {
    const data = await versionService.getVersion(
      req.document._id,
      parseInt(req.params.versionNumber, 10)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const createSnapshot = async (req, res, next) => {
  try {
    const data = await versionService.createManualSnapshot(
      req.document,
      req.user._id,
      req.body.label
    );
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const restoreVersion = async (req, res, next) => {
  try {
    const data = await versionService.restoreVersion(
      req.document,
      req.user._id,
      parseInt(req.params.versionNumber, 10)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const diffVersions = async (req, res, next) => {
  try {
    const data = await versionService.diffVersions(
      req.document._id,
      parseInt(req.query.from, 10),
      parseInt(req.query.to, 10)
    );
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listVersions,
  getVersion,
  createSnapshot,
  restoreVersion,
  diffVersions,
};
