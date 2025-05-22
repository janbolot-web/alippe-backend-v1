import mongoose from "mongoose";

const UserCoursesSchema = new mongoose.Schema(
  {
    name: { type: String },
    // price:{type:String},
    lessons: [
      {
        name: { type: String },
        videoUrl: { type: String },
        description: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("UserCourses", UserCoursesSchema);
