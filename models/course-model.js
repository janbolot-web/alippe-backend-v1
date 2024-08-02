import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    previewImgUrl: { type: String, required: true },
    previewVideoUrl: { type: String, required: true },
    authorName: { type: String, required: true },
    authorProfession: { type: String, required: true },
    bgImage: { type: String },
    authors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Author" }],
    modules: [
      {
        name: { type: String },
        price: { type: String },
        courseId: { type: String, default: "" },
        lessons: [
          {
            name: { type: String },
            videoUrl: { type: String },
            description: { type: String },
            youtubeUrl: { type: String },
            rumbleUrl: { type: String },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Course", CourseSchema);
