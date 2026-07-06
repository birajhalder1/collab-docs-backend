const mongoose = require("mongoose");

const versionSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    versionNumber: {
      type: Number,
      required: true,
    },

    title: {
      type: String,
      default: "Untitled Document",
    },

    content: {
      type: String,
      default: "",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    snapshotReason: String,
    label: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("Version", versionSchema);
