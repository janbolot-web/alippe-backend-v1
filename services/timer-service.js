import Timer from "../models/timer-model.js";
import SpeedReading from "../models/speed-reading-model.js";

export const TimerService = {
  // Create a new timer for a session
  async createTimer(sessionId) {
    try {
      const timer = new Timer({
        sessionId,
        startTime: new Date(),
        isRunning: true,
      });
      
      await timer.save();
      return timer;
    } catch (error) {
      console.error("Error creating timer:", error);
      throw error;
    }
  },
  
  // Get timer by sessionId
  async getTimerBySessionId(sessionId) {
    try {
      const timer = await Timer.findOne({ sessionId });
      if (!timer) {
        throw new Error("Timer not found");
      }
      return timer;
    } catch (error) {
      console.error("Error fetching timer:", error);
      throw error;
    }
  },
  
  // Toggle timer (pause/resume)
  async toggleTimer(sessionId) {
    try {
      const timer = await Timer.findOne({ sessionId });
      if (!timer) {
        throw new Error("Timer not found");
      }
      
      const now = new Date();
      
      if (timer.isRunning) {
        // Pause the timer
        timer.pausedAt = now;
        timer.isRunning = false;
      } else {
        // Resume the timer
        if (timer.pausedAt) {
          // Calculate time spent paused
          const pausedTime = now - timer.pausedAt;
          timer.totalPausedTime += pausedTime;
        }
        timer.pausedAt = null;
        timer.isRunning = true;
      }
      
      timer.lastUpdated = now;
      await timer.save();
      
      // Update the session as well
      await SpeedReading.findByIdAndUpdate(sessionId, { 
        isActive: timer.isRunning,
        duration: timer.getFormattedTime()
      });
      
      return timer;
    } catch (error) {
      console.error("Error toggling timer:", error);
      throw error;
    }
  },
  
  // Get current timer status and elapsed time
  async getTimerStatus(sessionId) {
    try {
      const timer = await Timer.findOne({ sessionId });
      if (!timer) {
        throw new Error("Timer not found");
      }
      
      return {
        elapsedSeconds: timer.elapsedTime,
        formattedTime: timer.getFormattedTime(),
        isRunning: timer.isRunning
      };
    } catch (error) {
      console.error("Error getting timer status:", error);
      throw error;
    }
  },
  
  // Reset timer
  async resetTimer(sessionId) {
    try {
      const timer = await Timer.findOne({ sessionId });
      if (!timer) {
        throw new Error("Timer not found");
      }
      
      timer.startTime = new Date();
      timer.pausedAt = null;
      timer.totalPausedTime = 0;
      timer.isRunning = true;
      timer.lastUpdated = new Date();
      
      await timer.save();
      
      return timer;
    } catch (error) {
      console.error("Error resetting timer:", error);
      throw error;
    }
  }
};
