import mongoose from "mongoose";

const preferencesSchema = new mongoose.Schema(
  {
    emailOnInterviewProcessed: { type: Boolean, default: false },
    showWorkflowHints: { type: Boolean, default: true },
    compactView: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "superadmin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "inactive"],
      default: "approved",
    },
    tokenVersion: { type: Number, default: 0 },
    avatarGridfsFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    avatarContentType: { type: String, default: null },
    preferences: {
      type: preferencesSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ status: 1, role: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);

export default User;
