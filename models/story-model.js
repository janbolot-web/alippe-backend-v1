import mongoose from "mongoose";

const StorySchema = new mongoose.Schema(
  {
    items: [
      {
        title: { type: String, required: true },
        imageUrl: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Story", StorySchema);
