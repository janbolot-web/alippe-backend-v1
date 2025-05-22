import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  nickname: {
    type: String,
    trim: true,
  },
  socketID: {
    type: String,
  },
  points: {
    type: Number,
    default: 0,
  },
  hasAnswered: {
    type: Boolean,
    default: false,
  },
  playerType: {
    required: true,
    type: String,
  },
  correctAnswer: {
    default: 0,
    type: Number, // Изменен тип с String на Number для согласованности
  },
  result: [],

  // Новые поля для улучшения надежности
  isConnected: {
    type: Boolean,
    default: true,
  },
  lastDisconnectTime: {
    type: Date,
  },
  lastActivityTime: {
    type: Date,
    default: Date.now,
  },
  answeredQuestions: {
    type: [Number],
    default: [],
  },
  processedRequests: {
    type: [String],
    default: [],
  },
  platform: {
    type: String,
  },
  deviceInfo: {
    type: mongoose.Schema.Types.Mixed,
  },
});

export default playerSchema;
