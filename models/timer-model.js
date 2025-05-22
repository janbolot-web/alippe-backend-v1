import mongoose from "mongoose";

const TimerSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SpeedReading",
      required: true,
    },
    startTime: { type: Date, default: Date.now },
    pausedAt: { type: Date, default: null },
    totalPausedTime: { type: Number, default: 0 }, // in milliseconds
    isRunning: { type: Boolean, default: true },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Virtual property to calculate elapsed time
TimerSchema.virtual('elapsedTime').get(function() {
  const now = new Date();
  let elapsed;
  
  if (this.isRunning) {
    elapsed = now - this.startTime - this.totalPausedTime;
  } else if (this.pausedAt) {
    elapsed = this.pausedAt - this.startTime - this.totalPausedTime;
  } else {
    elapsed = 0;
  }
  
  return Math.max(0, Math.floor(elapsed / 1000)); // Return seconds
});

// Add method to format time as HH:MM:SS
TimerSchema.methods.getFormattedTime = function() {
  const seconds = this.elapsedTime;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    remainingSeconds.toString().padStart(2, '0')
  ].join(':');
};

export default mongoose.model("Timer", TimerSchema);