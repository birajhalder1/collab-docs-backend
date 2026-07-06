const mongoose = require("mongoose");

const operationSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    opId: {
      type: String,
      required: true,
      unique: true,
    },

    clientId: {
      type: String,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    baseVersion: {
      type: Number,
      default: 1,
    },

    lamportClock: {
      type: Number,
      default: 0,
    },

    appliedVersion: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

operationSchema.index({ document: 1, appliedVersion: 1 });
operationSchema.index({ document: 1, opId: 1 }, { unique: true });

module.exports =
  mongoose.models.Operation || mongoose.model("Operation", operationSchema);
