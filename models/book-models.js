import mongoose from "mongoose";

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    href: { type: String, required: true },
    pages: { type: Number },
    description: { type: String, required: true },
    previewImg: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Book", BookSchema);
