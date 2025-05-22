import mongoose from "mongoose";

const aiPromptSchema = new mongoose.Schema(
  {
    genre: { type: String, required: true },
    language: { type: String, required: true },
    classLevel: { type: String, required: true },
    promptText: { type: String, required: true },
    baseRequirements: { type: String },
    isActive: { type: Boolean, default: true },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("AIPrompt", aiPromptSchema); 