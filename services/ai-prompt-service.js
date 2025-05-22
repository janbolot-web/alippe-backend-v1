import AIPromptModel from "../models/ai-prompt-model.js";

export const AIPromptService = {
  // Get all AI prompts
  async getAllPrompts() {
    try {
      return await AIPromptModel.find().sort({ createdAt: -1 });
    } catch (error) {
      throw error;
    }
  },

  // Get prompt by ID
  async getPromptById(promptId) {
    try {
      return await AIPromptModel.findById(promptId);
    } catch (error) {
      throw error;
    }
  },

  // Get prompts by genre and language
  async getPromptsByGenreAndLanguage(genre, language) {
    try {
      console.log('Поиск промптов для жанра:', genre, 'языка:', language);
      
      // Ищем промпты по точному совпадению
      let prompts = await AIPromptModel.find({ 
        genre: genre, 
        language: language,
        isActive: true 
      });
      console.log('Найдено промптов по точному совпадению:', prompts.length);
      
      // Если не нашли, пробуем более мягкий поиск
      if (!prompts || prompts.length === 0) {
        console.log('Точное совпадение не найдено, ищем частичное совпадение...');
        
        // Создаем безопасный паттерн для регулярного выражения
        const safeGenrePattern = genre
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // экранируем спецсимволы
          .split(/\s+/)  // разбиваем на слова
          .filter(word => word.length > 2)  // берем только значимые слова
          .join('|');  // объединяем с ИЛИ
        
        if (safeGenrePattern) {
          console.log('Поиск по паттерну:', safeGenrePattern);
          prompts = await AIPromptModel.find({
            genre: { $regex: new RegExp(safeGenrePattern, 'i') },
            language: language,
            isActive: true
          });
          console.log('Найдено промптов по частичному совпадению:', prompts.length);
        }
      }
      
      return prompts;
    } catch (error) {
      console.error('Error in getPromptsByGenreAndLanguage:', error);
      throw error;
    }
  },

  // Create a new AI prompt
  async createPrompt(promptData) {
    try {
      const prompt = new AIPromptModel(promptData);
      await prompt.save();
      return prompt;
    } catch (error) {
      throw error;
    }
  },

  // Update an existing AI prompt
  async updatePrompt(promptId, promptData) {
    try {
      return await AIPromptModel.findByIdAndUpdate(
        promptId,
        promptData,
        { new: true }
      );
    } catch (error) {
      throw error;
    }
  },

  // Delete an AI prompt
  async deletePrompt(promptId) {
    try {
      return await AIPromptModel.findByIdAndDelete(promptId);
    } catch (error) {
      throw error;
    }
  },

  // Initialize default prompts if none exist
  async initializeDefaultPrompts() {
    try {
      // Удаляем все существующие промпты
      await AIPromptModel.deleteMany({});
      
      // Define base requirements
      const baseRequirements = `
        Текст должен быть увлекательным, воспитательным и передавать полезный урок.
        Длина текста — около WORD_COUNT слов.
        После текста добавь QUESTIONS_COUNT вопроса с 4 вариантами ответов.
        Вопросы должны быть связаны с содержанием текста и помогать понять его смысл.
        Укажи правильный ответ для каждого вопроса.
        Текст должен быть понятным и интересным для детей CLASS_LEVEL-го класса.
        
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

      // Create default prompts
      const defaultPrompts = [
        // Жомок / Сказка - Кыргыз
        {
          genre: "Жомок (Фантазияга негизделген кызыктуу окуялар.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска жомок түз.
            Жомок фантазияга негизделип, кызыkтуу жана тарбиялыk мааниге ээ болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Жомок / Сказка - Русский
        {
          genre: "Жомок (Фантазияга негизделген кызыkтуу окуялар.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Создай короткую сказку на русском языке для учеников CLASS_LEVEL-го класса.
            Сказка должна быть фантастической, увлекательной и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Сказка - Русский (дублирующий вариант с русским названием)
        {
          genre: "Сказка (Фантазияга негизделген кызыkтуу окуялар.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Создай короткую сказку на русском языке для учеников CLASS_LEVEL-го класса.
            Сказка должна быть фантастической, увлекательной и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Ыр / Стихотворение - Кыргыз
        {
          genre: "Ыр (Рифмалуу жана ритмдүү текст.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска ыр түз.
            Ыр рифмалуу, ритмдүү жана тарбиялыk мааниге ээ болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Ыр / Стихотворение - Русский
        {
          genre: "Ыр (Рифмалуу жана ритмдүү текст.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткое стихотворение на русском языке для учеников CLASS_LEVEL-го класса.
            Стихотворение должно быть рифмованным, ритмичным и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Стихотворение - Русский (дублирующий вариант с русским названием)
        {
          genre: "Стихотворение (Рифмалуу жана ритмдүү текст.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткое стихотворение на русском языке для учеников CLASS_LEVEL-го класса.
            Стихотворение должно быть рифмованным, ритмичным и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Аңгеме / Рассказ - Кыргыз
        {
          genre: "Аңгеме (Кыска, түшүнүктүү окуя.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска аңгеме түз.
            Аңгеме түшүнүктүү, кызыkтуу жана тарбиялыk мааниге ээ болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Аңгеме / Рассказ - Русский
        {
          genre: "Аңгеме (Кыска, түшүнүктүү окуя.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткий рассказ на русском языке для учеников CLASS_LEVEL-го класса.
            Рассказ должен быть понятным, интересным и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Эссе / Эссе - Кыргыз
        {
          genre: "Эссе (Жеке ойлор жана сезимдер жазылган текст.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска эссе түз.
            Эссе жеке ойлорду жана сезимдерди чагылдырып, тарбиялыk мааниге ээ болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Эссе / Эссе - Русский
        {
          genre: "Эссе (Жеке ойлор жана сезимдер жазылган текст.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткое эссе на русском языке для учеников CLASS_LEVEL-го класса.
            Эссе должно отражать личные мысли и чувства, нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Сүреттөмө текст / Описательный текст - Кыргыз
        {
          genre: "Сүреттөмө текст (Бир нерсени сүрөттөп берүүчү жазуу.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска сүреттөмө текст түз.
            Текст бир нерсени же окуяны сүрөттөп берүүчү болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Сүреттөмө текст / Описательный текст - Русский
        {
          genre: "Сүреттөмө текст (Бир нерсени сүрөттөп берүүчү жазуу.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткий описательный текст на русском языке для учеников CLASS_LEVEL-го класса.
            Текст должен описывать какой-либо предмет или событие.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Дублируем промпты с альтернативным написанием
        {
          genre: "Сүрөттөмө текст (Бир нерсени сүрөттөп берүүчү жазуу.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска сүрөттөмө текст түз.
            Текст бир нерсени же окуяны сүрөттөп берүүчү болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        {
          genre: "Сүрөттөмө текст (Бир нерсени сүрөттөп берүүчү жазуу.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткий описательный текст на русском языке для учеников CLASS_LEVEL-го класса.
            Текст должен описывать какой-либо предмет или событие.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Күнүмдүк жашоо баяны / Жизненная история - Кыргыз
        {
          genre: "Күнүмдүк жашоо баяны (Жашоодон алынган кыска окуялар.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска күнүмдүк жашоо баянын түз.
            Баян жашоодон алынган окуяны чагылдырып, тарбиялыk мааниге ээ болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Күнүмдүк жашоо баяны / Жизненная история - Русский
        {
          genre: "Күнүмдүк жашоо баяны (Жашоодон алынган кыска окуялар.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткую жизненную историю на русском языке для учеников CLASS_LEVEL-го класса.
            История должна быть основана на реальной жизни и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Кат / Письмо - Кыргыз
        {
          genre: "Кат (Досторго же үй-бүлөгө арналган кыска билдирүүлөр.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска кат түз.
            Кат досторго же үй-бүлөгө арналып, тарбиялыk мааниге ээ болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Кат / Письмо - Русский
        {
          genre: "Кат (Досторго же үй-бүлөгө арналган кыска билдирүүлөр.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткое письмо на русском языке для учеников CLASS_LEVEL-го класса.
            Письмо должно быть адресовано друзьям или семье и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Илимий текстер / Научный текст - Кыргыз
        {
          genre: "Илимий текстер (Илим-билимге байланыштуу маалыматтык текстер.)",
          language: "Кыргыз",
          classLevel: "all",
          promptText: `
            CLASS_LEVEL-класс окуучулары үчүн кыска илимий текст түз.
            Текст илим-билимге байланыштуу маалымат берип, тарбиялыk мааниге ээ болсун.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Илимий текстер / Научный текст - Русский
        {
          genre: "Илимий текстер (Илим-билимге байланыштуу маалыматтык текстер.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткий научный текст на русском языке для учеников CLASS_LEVEL-го класса.
            Текст должен содержать информацию о науке и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        // Дополнительные промпты для поддержки русских названий жанров
        {
          genre: "Рассказ (Кыска, түшүнүктүү окуя.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткий рассказ на русском языке для учеников CLASS_LEVEL-го класса.
            Рассказ должен быть понятным, интересным и нести воспитательный смысл.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        },
        {
          genre: "Описательный текст (Бир нерсени сүрөттөп берүүчү жазуу.)",
          language: "Русский",
          classLevel: "all",
          promptText: `
            Напиши короткий описательный текст на русском языке для учеников CLASS_LEVEL-го класса.
            Текст должен описывать какой-либо предмет или событие.
          `,
          baseRequirements: baseRequirements,
          isActive: true
        }
      ];

      console.log('Создаем новые промпты...');
      // Сохраняем все промпты
      const savedPrompts = await AIPromptModel.insertMany(defaultPrompts);
      console.log(`Создано ${savedPrompts.length} промптов`);
      
      // Проверяем, что все промпты созданы
      const allPrompts = await AIPromptModel.find({});
      console.log(`Всего промптов в базе: ${allPrompts.length}`);
      
      return savedPrompts;
    } catch (error) {
      console.error("Error initializing default prompts:", error);
      throw error;
    }
  },

  // Принудительное обновление всех промптов
  async forceUpdatePrompts() {
    try {
      // Сначала удаляем все существующие промпты
      await AIPromptModel.deleteMany({});
      console.log("Все промпты удалены");
      
      // Затем инициализируем заново дефолтные промпты
      const prompts = await this.initializeDefaultPrompts();
      console.log(`Создано ${prompts.length} новых промптов`);
      
      return prompts;
    } catch (error) {
      console.error("Ошибка при обновлении промптов:", error);
      throw error;
    }
  }
}; 