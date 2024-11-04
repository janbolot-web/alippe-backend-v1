// models/room.js

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
  playersCount: { type: Number, default: 0 },
  time: { type: String },
  turnIndex: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("Room", roomSchema);
