import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    phone: { type: Number, unique: true },
    email: { type: String },
    name: { type: String },
    password: { type: String },
    phoneNumber: {
      type: String,
      unique: true,
    },
    courses: [
      {
        name: { type: String },
        courseId: { type: String, default: "" },
        price: { type: String },
        isAccess: { type: Boolean, default: false },
        lessons: [
          {
            name: { type: String },
            videoUrl: { type: String },
            youtubeUrl: { type: String },
            description: { type: String },
          },
        ],
      },
    ],
    books: [
      {
        type: mongoose.Schema.Types.ObjectId, // Ссылка на модель Book
        ref: "Book", // Указываем на модель Book
      },
    ],
    roles: [{ type: String, ref: "Role" }],
    avatarUrl: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", UserSchema);

// courses: [
//   {
//     courseId: { type: String },
//     modules: [
//       {
//         name: { type: String },
//         isAccess: { type: Boolean, default: false },
//         lessons: [
//           {
//             name: { type: String },
//             videoUrl: { type: String },
//             description: { type: String },
//           },
//         ],
//       },
//     ],
//   },
// ],
