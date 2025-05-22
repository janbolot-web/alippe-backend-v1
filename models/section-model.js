// models/section-model.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Название задачи обязательно"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Дата задачи обязательна"],
    },
    time: {
      type: String,
      default: "00:00",
    },
    isUrgent: {
      type: Boolean,
      default: false,
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
      required: true,
    },
    sectionTitle: {
      type: String,
      required: true,
    },
    sectionColor: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const sectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: [true, "ID пользователя обязателен"],
    },
    title: {
      type: String,
      required: [true, "Название раздела обязательно"],
      trim: true,
    },
    letter: {
      type: String,
      required: [true, "Буква раздела обязательна"],
      trim: true,
      maxlength: 1,
    },
    color: {
      type: String,
      required: [true, "Цвет раздела обязателен"],
      trim: true,
    },
    tasks: [taskSchema],
  },
  {
    timestamps: true,
  }
);

// Создание индекса для эффективного поиска по userId
sectionSchema.index({ userId: 1 });

export default mongoose.model("Section", sectionSchema);