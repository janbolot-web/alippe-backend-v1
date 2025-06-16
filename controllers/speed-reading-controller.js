import speedReadingModel from "../models/speed-reading-model.js";
import { SpeedReadingService } from "../services/speed-reading-service.js";
import mongoose from "mongoose";
import { AIPromptService } from "../services/ai-prompt-service.js";
import userModel from "../models/user-model.js";

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
      const { userId } = req.query;

      console.log('Получен запрос на генерацию контента с userId:', userId);

      // --- Исправление: не изменяем жанр, так как используем его в оригинальном виде ---
      // Нам не нужно модифицировать жанр, так как в базе есть промпты для обоих языков
      // -----------------------------------------------------------------------

      // Проверяем userId и пытаемся уменьшить попытки
      if (userId) {
        try {
          // Уменьшаем количество попыток
          const updatedUser = await SpeedReadingService.decreaseSpeedReadingPoints(userId);

          if (!updatedUser) {
            return res.status(400).json({
              success: false,
              message: "No speed reading points available",
            });
          }


          // Генерируем контент
          const content = await SpeedReadingService.generateEducationalContent(data);

          // Устанавливаем явно заголовок Content-Type
          res.setHeader('Content-Type', 'application/json; charset=utf-8');

          // Явно сериализуем JSON с помощью JSON.stringify для контроля формата
          return res.status(200).send(JSON.stringify({
            success: true,
            content,
            model: "gpt-4o",
            remainingPoints: updatedUser.subscription.find(sub => sub.title === "ai" && sub.isActive === true)?.speedReadingPoint || 0
          }));
        } catch (error) {
          console.error("Ошибка при уменьшении попыток:", error);
          // Если ошибка не связана с отсутствием попыток, возвращаем общую ошибку
          if (error.message !== "No available speed reading points") {
            return res.status(500).json({
              success: false,
              message: "An error occurred while processing the request",
              error: error.message,
            });
          }
          // Иначе возвращаем специфическую ошибку об отсутствии попыток
          return res.status(400).json({
            success: false,
            message: "No speed reading points available",
          });
        }
      } else {
        // Если userId не предоставлен
        return res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
      }
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

  // Decrease speed reading points
  async decreaseSpeedReadingPoints(req, res) {
    const userId = req.body.userId;
    try {
      const user = await userModel.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const aiSubscription = user.subscription.find(
        (sub) => sub.title === "speedReading" && sub.isActive === true
      );

      if (!aiSubscription || aiSubscription.speedReadingPoint <= 0) {
        return null;
      }

      // Уменьшаем количество попыток
      aiSubscription.speedReadingPoint--;
      await user.save();

      return user;
    } catch (error) {
      console.error("Error decreasing speed reading points:", error);
      throw error;
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

  // Get all available genres
  async getGenres(req, res) {
    try {
      const genres = {
        fairy_tale: {
          kyrg: {
            name: 'Жомок',
            full_name: 'Жомок (Фантазияга негизделген кызыктуу окуялар.)',
            keywords: ['жомок', 'сказка', 'фантазия']
          },
          rus: {
            name: 'Сказка',
            full_name: 'Жомок (Фантазияга негизделген кызыктуу окуялар.)',
            keywords: ['сказка', 'жомок', 'фантазия']
          }
        },
        poem: {
          kyrg: {
            name: 'Ыр',
            full_name: 'Ыр (Рифмалуу жана ритмдүү текст.)',
            keywords: ['ыр', 'стихотворение', 'рифма']
          },
          rus: {
            name: 'Стихотворение',
            full_name: 'Ыр (Рифмалуу жана ритмдүү текст.)',
            keywords: ['стихотворение', 'ыр', 'рифма']
          }
        },
        story: {
          kyrg: {
            name: 'Аңгеме',
            full_name: 'Аңгеме (Кыска, түшүнүктүү окуя.)',
            keywords: ['аңгеме', 'рассказ', 'история']
          },
          rus: {
            name: 'Рассказ',
            full_name: 'Аңгеме (Кыска, түшүнүктүү окуя.)',
            keywords: ['рассказ', 'аңгеме', 'история']
          }
        },
        essay: {
          kyrg: {
            name: 'Эссе',
            full_name: 'Эссе (Жеке ойлор жана сезимдер жазылган текст.)',
            keywords: ['эссе', 'сочинение', 'размышление']
          },
          rus: {
            name: 'Эссе',
            full_name: 'Эссе (Жеке ойлор жана сезимдер жазылган текст.)',
            keywords: ['эссе', 'сочинение', 'размышление']
          }
        },
        descriptive: {
          kyrg: {
            name: 'Сүреттөмө текст',
            full_name: 'Сүреттөмө текст (Бир нерсени сүрөттөп берүүчү жазуу.)',
            keywords: ['сүреттөмө', 'описание', 'сүрөт', 'сүрөттөмө']
          },
          rus: {
            name: 'Описательный текст',
            full_name: 'Сүреттөмө текст (Бир нерсени сүрөттөп берүүчү жазуу.)',
            keywords: ['описательный', 'описание', 'сүреттөмө']
          }
        }
      };

      res.json(genres);
    } catch (error) {
      console.error('Error getting genres:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while getting genres',
        error: error.message
      });
    }
  },

  // Force update prompts
  async forceUpdatePrompts(req, res) {
    try {
      const prompts = await AIPromptService.forceUpdatePrompts();
      return res.status(200).json({
        success: true,
        message: 'Prompts updated successfully',
        count: prompts.length
      });
    } catch (error) {
      console.error('Error updating prompts:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while updating prompts',
        error: error.message
      });
    }
  },
};
