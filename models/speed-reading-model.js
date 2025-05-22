import mongoose from "mongoose";

const SpeedReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timer: { type: Number, default: 0 }, // Time in seconds
    title: { type: String, required: true },
    content: { type: String, required: true },
    genre: { type: String },
    classLevel: { type: String, required: true },
    wordsCount: { type: String, required: true },
    questions: [
      {
        question: { type: String },
        options: [{ type: String }],
        correctIndex: { type: Number },
      },
    ],
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    students: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          // required: true,
        },
        name: { type: String },
        time: { type: Number }, // Time in seconds
        words: { type: Number }, // Words read
        questions: [
          {
            question: { type: String },
            options: [{ type: String }],
            correctIndex: { type: Number },
            answer: { type: Number },
          },
        ],
        date: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("SpeedReading", SpeedReadingSchema);
