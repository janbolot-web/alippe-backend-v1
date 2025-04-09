import UserDto from "../dtos/user.dto.js";
import SpeedReadingModel from "../models/speed-reading-model.js";
import UserModel from "../models/user-model.js";
import mongoose from "mongoose";

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

  // Get all speed reading sessions
  async generateEducationalContent(data) {
    try {
      var genre = data.genre;
      var classLevel = data.classLevel;
      var questionsCount = data.questionsCount;
      var language = data.language;
      var wordCount = data.wordCount;

      // Общие требования для всех жанров
      var baseRequirements = `
        Текст должен быть увлекательным, воспитательным и передавать полезный урок.
        Длина текста — около ${wordCount} слов.
        После текста добавь ${questionsCount} вопроса с 4 вариантами ответов.
        Вопросы должны быть связаны с содержанием текста и помогать понять его смысл.
        Укажи правильный ответ для каждого вопроса.
        Текст должен быть понятным и интересным для детей ${classLevel}-го класса.
        
        Формат ответа:
        ЗАГОЛОВОК ТЕКСТА
        -------------
        Текст
        
        Вопросы:
        1. Вопрос 1
           A) Вариант A
           B) Вариант B
           C) Вариант C
           D) Вариант D
           Правильный ответ: A/B/C/D
      `;

      // Жанр: Жомок / Сказка
      if (genre == "Жомок (Фантазияга негизделген кызыктуу окуялар.)") {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска жомок түз.
          Жомок фантазияга негизделип, кызыктуу жана тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Жомок")}
          `;
        } else {
          var prompt = `
          Создай короткую сказку на русском языке для учеников ${classLevel}-го класса.
          Сказка должна быть фантастической, увлекательной и нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Сказка")}
          `;
        }
        return prompt.toString();
      }

      // Жанр: Ыр / Стихотворение
      else if (genre == "Ыр (Рифмалуу жана ритмдүү текст.)") {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска ыр түз.
          Ыр рифмалуу, ритмдүү жана тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Ыр")}
          `;
        } else {
          var prompt = `
          Напиши короткое стихотворение на русском языке для учеников ${classLevel}-го класса.
          Стихотворение должно быть рифмованным, ритмичным и нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Стихотворение")}
          `;
        }
        return prompt.toString();
      }

      // Жанр: Аңгеме / Рассказ
      else if (genre == "Аңгеме (Кыска, түшүнүктүү окуя.)") {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска аңгеме түз.
          Аңгеме түшүнүктүү, кызыктуу жана тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Аңгеме")}
          `;
        } else {
          var prompt = `
          Напиши короткий рассказ на русском языке для учеников ${classLevel}-го класса.
          Рассказ должен быть понятным, интересным и нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Рассказ")}
          `;
        }
        return prompt.toString();
      }

      // Жанр: Эссе / Эссе
      else if (genre == "Эссе (Жеке ойлор жана сезимдер жазылган текст.)") {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска эссе түз.
          Эссе жеке ойлорду жана сезимдерди чагылдырып, тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Эссе")}
          `;
        } else {
          var prompt = `
          Напиши короткое эссе на русском языке для учеников ${classLevel}-го класса.
          Эссе должно отражать личные мысли и чувства, нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Эссе")}
          `;
        }
        return prompt.toString();
      }

      // Жанр: Сүреттөмө текст / Описательный текст
      else if (
        genre == "Сүреттөмө текст (Бир нерсени сүрөттөп берүүчү жазуу.)"
      ) {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска сүреттөмө текст түз.
          Текст бир нерсени (мисалы, жаратылыш, буюм) сүрөттөп, тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Сүреттөмө текст")}
          `;
        } else {
          var prompt = `
          Напиши короткий описательный текст на русском языке для учеников ${classLevel}-го класса.
          Текст должен описывать что-то (например, природу, предмет) и нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Описательный текст")}
          `;
        }
        return prompt.toString();
      }

      // Жанр: Күнүмдүк жашоо баяны / Жизненная история
      else if (
        genre == "Күнүмдүк жашоо баяны (Жашоодон алынган кыска окуялар.)"
      ) {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска күнүмдүк жашоо баянын түз.
          Баян жашоодон алынган окуяны чагылдырып, тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Күнүмдүк жашоо баяны")}
          `;
        } else {
          var prompt = `
          Напиши короткую жизненную историю на русском языке для учеников ${classLevel}-го класса.
          История должна быть основана на реальной жизни и нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Жизненная история")}
          `;
        }
        return prompt.toString();
      }

      // Жанр: Кат / Письмо
      else if (
        genre == "Кат (Досторго же үй-бүлөгө арналган кыска билдирүүлөр.)"
      ) {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска кат түз.
          Кат досторго же үй-бүлөгө арналып, тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Кат")}
          `;
        } else {
          var prompt = `
          Напиши короткое письмо на русском языке для учеников ${classLevel}-го класса.
          Письмо должно быть адресовано друзьям или семье и нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Письмо")}
          `;
        }
        return prompt.toString();
      }

      // Жанр: Илимий текстер / Научный текст
      else if (
        genre ==
        "Илимий текстер (Илим-билимге байланыштуу маалыматтык текстер.)"
      ) {
        if (language == "Кыргыз") {
          var prompt = `
          ${classLevel}-класс окуучулары үчүн кыска илимий текст түз.
          Текст илим-билимге байланыштуу маалымат берип, тарбиялык мааниге ээ болсун.
          ${baseRequirements.replace("Текст", "Илимий текст")}
          `;
        } else {
          var prompt = `
          Напиши короткий научный текст на русском языке для учеников ${classLevel}-го класса.
          Текст должен содержать информацию о науке и нести воспитательный смысл.
          ${baseRequirements.replace("Текст", "Научный текст")}
          `;
        }
        return prompt.toString();
      }

      return "Educational content generated successfully";
    } catch (error) {
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
};
