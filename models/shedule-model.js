// models/schedule-model.js
import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: [true, "ID пользователя обязателен"],
    },
    subject: {
      type: String,
      required: [true, "Название предмета обязательно"],
      trim: true,
    },
    classInfo: {
      type: String,
      default: "",
    },
    timeRange: {
      type: String,
      required: [true, "Время проведения обязательно"],
    },
    date: {
      type: Date,
      required: [true, "Дата проведения обязательна"],
    },
    type: {
      type: String,
      enum: ["lesson", "task"],
      default: "lesson",
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    sectionId: {
      type: String,
      default: null,
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Создание составного индекса для эффективного поиска по userId и date
scheduleSchema.index({ userId: 1, date: 1 });

export default mongoose.model("Schedule", scheduleSchema);