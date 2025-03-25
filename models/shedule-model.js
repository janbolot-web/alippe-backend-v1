// models/Schedule.js

import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Название предмета обязательно'],
    trim: true
  },
  classInfo: {
    type: String,
    required: [true, 'Информация о классе обязательна'],
    trim: true
  },
  timeRange: {
    type: String,
    required: [true, 'Необходимо указать время'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Необходимо указать дату']
  },
  type: {
    type: String,
    enum: ['lesson', 'task'],
    default: 'lesson'
  },
  sectionId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Индекс для быстрого поиска по дате
ScheduleSchema.index({ date: 1 });

export default mongoose.model("Schedule", ScheduleSchema);