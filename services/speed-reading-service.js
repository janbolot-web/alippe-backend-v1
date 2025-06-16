import UserDto from "../dtos/user.dto.js";
import SpeedReadingModel from "../models/speed-reading-model.js";
import UserModel from "../models/user-model.js";
import { AIPromptService } from "./ai-prompt-service.js";
import mongoose from "mongoose";
import AIPromptModel from "../models/ai-prompt-model.js";

export const SpeedReadingService = {
  // Create a new speed reading session
  async createSession(userId, sessionData) {
    try {
      // Check if user has available points
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      // Find the active subscription

      const activeSubscription = user.subscription[0];

      if (!activeSubscription || activeSubscription.speedReadingPoint <= 0) {
        throw new Error("No available speed reading points");
      }

      // Create a new speed reading session
      const session = new SpeedReadingModel({
        userId,
        title: sessionData.title,
        timer: sessionData.timer,
        content: sessionData.content,
        genre: sessionData.genre || "",
        classLevel: sessionData.classLevel,
        wordsCount: sessionData.wordsCount,
        questions: sessionData.questions,
        imageUrl: sessionData.imageUrl || "",
        isActive: true,
        students: [],
      });
      await session.save();

      // Decrement user's speed reading points
      user.speedReadingSessions.push(session);
      activeSubscription.speedReadingPoint =
        (activeSubscription.speedReadingPoint || 0) - 1;
      await user.save();
      const UserData = new UserDto(user);

      return { session, UserData };
    } catch (error) {
      throw error;
    }
  },

  // Add a student result to a session
  async addStudentResult(sessionId, studentData) {
    try {
      const session = await SpeedReadingModel.findById(sessionId);

      if (!session) {
        throw new Error("Speed reading session not found");
      }
      console.log(studentData);
      session.students.push(studentData);

      await session.save();
      return session;
    } catch (error) {
      throw error;
    }
  },

  // Get all sessions for a user
  async getUserSessions(userId) {
    try {
      return await SpeedReadingModel.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  },

  // Get session by ID
  async getSessionById(sessionId) {
    try {
      return await SpeedReadingModel.findById(sessionId);
    } catch (error) {
      throw error;
    }
  },

  // Update session status
  async updateSessionStatus(sessionId) {
    try {
      // First, find the current document to get its isActive status
      const session = await SpeedReadingModel.findById(sessionId);

      // Toggle the isActive value
      return await SpeedReadingModel.findByIdAndUpdate(
        sessionId,
        { isActive: !session.isActive },
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  },

  // Generate educational content
  async generateEducationalContent(data) {
    try {
      const { genre, classLevel, questionsCount, language, wordCount } = data;
      console.log('Получены параметры:', { genre, classLevel, questionsCount, language, wordCount });

      // Не нормализуем жанр, используем как есть
      console.log('Использую оригинальный жанр:', genre);

      // Fetch the prompt from database or initialize with default prompts if needed
      let prompts = await AIPromptService.getPromptsByGenreAndLanguage(genre, language);
      console.log('Найдено промптов по точному совпадению:', prompts?.length || 0);

      // Если не нашли по точному совпадению, возможно у нас проблема с форматом
      if (!prompts || prompts.length === 0) {
        console.log('Промпты не найдены, инициализируем дефолтные промпты...');
        await AIPromptService.initializeDefaultPrompts();
        prompts = await AIPromptService.getPromptsByGenreAndLanguage(genre, language);
        console.log('Найдено промптов после инициализации:', prompts?.length || 0);
      }

      // If still no prompts, return an error
      if (!prompts || prompts.length === 0) {
        console.error('Не найдено промптов для жанра:', genre, 'и языка:', language);
        throw new Error(`No prompts found for genre "${genre}" and language "${language}"`);
      }

      // Find matching class level or use "all" as fallback
      let prompt = prompts.find(p => p.classLevel === classLevel.toString());
      if (!prompt) {
        console.log('Ищем промпт с classLevel "all"...');
        prompt = prompts.find(p => p.classLevel === "all");
      }

      // If still no prompt found, use the first one
      if (!prompt && prompts.length > 0) {
        console.log('Используем первый доступный промпт...');
        prompt = prompts[0];
      }

      if (!prompt) {
        console.error('Не удалось найти подходящий промпт');
        throw new Error('No suitable prompt found');
      }

      console.log('Выбран промпт:', {
        genre: prompt.genre,
        language: prompt.language,
        classLevel: prompt.classLevel
      });

      // Build the final prompt with all required parameters
      let baseRequirements = prompt.baseRequirements || '';
      baseRequirements = baseRequirements
        .replace(/WORD_COUNT/g, wordCount)
        .replace(/QUESTIONS_COUNT/g, questionsCount)
        .replace(/CLASS_LEVEL/g, classLevel);

      let promptText = prompt.promptText || '';
      promptText = promptText.replace(/CLASS_LEVEL/g, classLevel);

      // Combine prompt text and base requirements
      const finalPrompt = `${promptText}\n\n${baseRequirements}`;

      return finalPrompt;
    } catch (error) {
      console.error("Error generating educational content:", error);
      throw error;
    }
  },

  // Check user's remaining speed reading points
  async getUserRemainingPoints(userId) {
    try {
      const user = await UserModel.findById(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const activeSubscription = user.subscription.find((sub) => sub.isActive);

      if (!activeSubscription) {
        return 0;
      }

      return activeSubscription.speedReadingPoint || 0;
    } catch (error) {
      throw error;
    }
  },

  

  // async changePointCount(userId, changePoint) {
  //   try {
  //     // Check if user has available points
  //     const user = await UserModel.findById(userId);

  //     if (!user) {
  //       throw new Error("User not found");
  //     }

  //     // Find the active subscription

  //     const activeSubscription = user.subscription[0];

  //     if (!activeSubscription || activeSubscription.speedReadingPoint <= 0) {
  //       throw new Error("No available speed reading points");
  //     }

  //     activeSubscription.speedReadingPoint =
  //       (activeSubscription.speedReadingPoint || 0) - 1;
  //     await user.save();
  //     const UserData = new UserDto(user);

  //     return { UserData };
  //   } catch (error) {
  //     throw error;
  //   }
  // },
};
