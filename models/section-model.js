// models/section.js
import mongoose from "mongoose";

// Схема для задачи
const TaskSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    type: { type: String, default: "task" },
    class: { type: String, default: "" },
    title: {
      type: String,
      required: [true, "Укажите название задачи"],
    },
    date: {
      type: Date,
      required: [true, "Укажите дату задачи"],
    },
    time: {
      type: String,
      required: [true, "Укажите время задачи"],
    },
    isUrgent: {
      type: Boolean,
      default: false,
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
  { _id: false }
);

// Схема для раздела
const SectionSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Укажите название раздела"],
      trim: true,
    },
    letter: {
      type: String,
      required: [true, "Укажите букву для иконки раздела"],
      trim: true,
      maxlength: [1, "Буква должна быть одним символом"],
    },
    color: {
      type: String,
      required: [true, "Укажите цвет раздела"],
    },
    tasks: [TaskSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Section", SectionSchema);
