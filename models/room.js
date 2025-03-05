import mongoose from "mongoose";
import playerSchema from "./player.js";

const roomSchema = new mongoose.Schema({
  occupancy: {
    type: Number,
    default: 2,
  },
  maxRounds: {
    type: Number,
    default: 6,
  },
  currentRound: {
    required: true,
    type: Number,
    default: 1,
  },
  players: [playerSchema],
  isJoin: {
    type: Boolean,
    default: true,
  },
  questions: [],
  playersCount: { 
    type: Number, 
    default: 0 
  },
  time: { 
    type: String 
  },
  turnIndex: {
    type: Number,
    default: 0,
  },
  
  // Новые поля для улучшенной синхронизации и надежности
  version: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  questionStartTimes: [Number],
  questionEndTime: Number,
  gameStartTime: Number,
  isStaleGame: {
    type: Boolean,
    default: false
  }
});

// Индекс для автоматического удаления завершенных комнат через день
roomSchema.index({ completedAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model("Room", roomSchema);