import mongoose from "mongoose";

const ModuleSchema = new mongoose.Schema(
  {
    name: { type: String },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Module", ModuleSchema);
