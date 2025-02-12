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
    aiResponses: [{ type: mongoose.Schema.Types.ObjectId, ref: "AiResponses" }],
    roles: [{ type: String, ref: "Role" }],
    avatarUrl: { type: String, required: false },
    subscription: [
      {
        title: String,
        isActive: Boolean,
        expiresAt: Date,
        planPoint: Number,
        quizPoint: Number,
      },
    ],
    purchaseHistory: [
      {
        type: mongoose.Schema.Types.ObjectId, // Ссылка на модель Book
        ref: "PurchaseHistory", // Указываем на модель Book
      },
    ],
    points: { type: Number, default: 0 },
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
