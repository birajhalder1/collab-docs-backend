const crypto = require("crypto");
const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
  },
  { timestamps: true },
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.statics.hashToken = function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

refreshTokenSchema.statics.createForUser = async function createForUser(
  userId,
  expiresAt,
) {
  const token = crypto.randomBytes(48).toString("hex");
  const tokenHash = this.hashToken(token);

  await this.create({
    user: userId,
    tokenHash,
    expiresAt,
  });

  return token;
};

refreshTokenSchema.statics.findValid = async function findValid(token) {
  const tokenHash = this.hashToken(token);
  const record = await this.findOne({ tokenHash, revokedAt: null });

  if (!record || record.expiresAt <= new Date()) {
    return null;
  }

  return record;
};

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
