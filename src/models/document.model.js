const mongoose = require("mongoose");
const { ROLES } = require("../constants/roles");

const collaboratorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
  },
  { _id: false },
);

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "Untitled Document",
      trim: true,
    },

    content: {
      type: String,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    collaborators: [collaboratorSchema],

    version: {
      type: Number,
      default: 1,
    },

    lamportClock: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

documentSchema.index({
  "collaborators.user": 1,
});

documentSchema.methods.getRoleForUser = function (userId) {
  const id = userId.toString();

  if (this.owner.toString() === id) {
    return ROLES.OWNER;
  }

  const collaborator = this.collaborators.find((c) => c.user.toString() === id);

  return collaborator?.role || null;
};

module.exports =
  mongoose.models.Document || mongoose.model("Document", documentSchema);
