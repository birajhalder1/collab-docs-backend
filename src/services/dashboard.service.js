const Document = require("../models/document.model");
const Version = require("../models/version.model");

const getDashboard = async (userId) => {
  const documents = await Document.countDocuments({
    owner: userId,
  });

  const versions = await Version.countDocuments({
    createdBy: userId,
  });

  const collaboratorResult = await Document.aggregate([
    {
      $match: {
        owner: userId,
      },
    },
    {
      $project: {
        collaborators: {
          $size: "$collaborators",
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$collaborators",
        },
      },
    },
  ]);

  return {
    documents,
    versions,
    collaborators: collaboratorResult[0]?.total || 0,
    status: "Online",
  };
};

module.exports = {
  getDashboard,
};