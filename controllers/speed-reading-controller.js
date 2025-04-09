import speedReadingModel from "../models/speed-reading-model.js";
import { SpeedReadingService } from "../services/speed-reading-service.js";
import mongoose from "mongoose";

export const SpeedReadingController = {
  // Create a new speed reading session
  async createSession(req, res) {
    try {
      // Get user ID from local storage or shared preferences
      // In an actual implementation, this would come from authentication middleware
      const { userId } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const sessionData = {
        title: req.body.title,
        content: req.body.content,
        timer: req.body.timer,
        genre: req.body.genre,
        classLevel: req.body.classLevel,
        wordsCount: req.body.wordsCount,
        questions: req.body.questions,
        imageUrl: req.body.imageUrl,
      };

      const session = await SpeedReadingService.createSession(
        userId,
        sessionData
      );
      return res.status(201).json({
        success: true,
        session: session.session,
        user: session.UserData,
      });
    } catch (error) {
      console.error("Error creating speed reading session:", error);

      if (error.message === "No available speed reading points") {
        return res.status(403).json({
          success: false,
          message: "You have no speed reading points remaining",
        });
      }

      return res.status(500).json({
        success: false,
        message: "An error occurred while creating the speed reading session",
        error: error.message,
      });
    }
  },

  // Add a student result to a session
  async addStudentResult(req, res) {
    try {
      const { sessionId } = req.params;
      const result = req.body;
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      const updatedSession = await SpeedReadingService.addStudentResult(
        sessionId,
        result
      );

      return res.status(200).json({
        success: true,
        session: updatedSession,
      });
    } catch (error) {
      console.error("Error adding student result:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while adding the student result",
        error: error.message,
      });
    }
  },

  // Get all sessions for a user
  async getUserSessions(req, res) {
    try {
      const { userId } = req.query;
      console.log(userId);
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const sessions = await SpeedReadingService.getUserSessions(userId);

      return res.status(200).json({
        success: true,
        sessions,
      });
    } catch (error) {
      console.error("Error fetching user sessions:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching the user sessions",
        error: error.message,
      });
    }
  },

  // Get session by ID
  async getSessionById(req, res) {
    try {
      const { sessionId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      const session = await SpeedReadingService.getSessionById(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Speed reading session not found",
        });
      }

      return res.status(200).json({
        success: true,
        session,
      });
    } catch (error) {
      console.error("Error fetching session:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while fetching the session",
        error: error.message,
      });
    }
  },

  // Update session status
  async updateSessionStatus(req, res) {
    try {
      const { sessionId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      const session = await SpeedReadingService.updateSessionStatus(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          message: "Speed reading session not found",
        });
      }

      return res.status(200).json({
        success: true,
        session,
      });
    } catch (error) {
      console.error("Error updating session status:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the session status",
        error: error.message,
      });
    }
  },

  // Generate educational content
  async generateEducationalContent(req, res) {
    try {
      const data = req.body;

      const content = await SpeedReadingService.generateEducationalContent(
        data
      );

      return res.status(200).json({
        success: true,
        content,
        model: "gpt-4o-mini",
      });
    } catch (error) {
      console.error("Error generating educational content:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while generating educational content",
        error: error.message,
      });
    }
  },
  // Check user's remaining speed reading points
  async getUserRemainingPoints(req, res) {
    try {
      const userId = req.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }

      const points = await SpeedReadingService.getUserRemainingPoints(userId);

      return res.status(200).json({
        success: true,
        points,
      });
    } catch (error) {
      console.error("Error checking remaining points:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while checking the remaining points",
        error: error.message,
      });
    }
  },

  // Запуск секундомера
  async startTimer(req, res) {
    try {
      const { sessionId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      const timerData = await SpeedReadingService.startTimer(sessionId);

      return res.status(200).json({
        success: true,
        timer: timerData,
      });
    } catch (error) {
      console.error("Error starting timer:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while starting the timer",
        error: error.message,
      });
    }
  },

  // Остановка секундомера
  async stopTimer(req, res) {
    try {
      const { sessionId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      const timerData = await SpeedReadingService.stopTimer(sessionId);

      return res.status(200).json({
        success: true,
        timer: timerData,
        elapsedTime: timerData.totalElapsedTime,
      });
    } catch (error) {
      console.error("Error stopping timer:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while stopping the timer",
        error: error.message,
      });
    }
  },

  // Получение текущего времени
  async getCurrentTime(req, res) {
    try {
      const { sessionId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid session ID",
        });
      }

      const elapsedTime = await SpeedReadingService.getCurrentElapsedTime(
        sessionId
      );

      return res.status(200).json({
        success: true,
        elapsedTime: elapsedTime,
      });
    } catch (error) {
      console.error("Error getting current time:", error);

      return res.status(500).json({
        success: false,
        message: "An error occurred while getting the current time",
        error: error.message,
      });
    }
  },
};
