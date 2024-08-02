import mongoose from "mongoose";

const LessonSchema = new mongoose.Schema(
  {
    name: { type: String },
    videoUrl: { type: String },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Lesson", LessonSchema);
