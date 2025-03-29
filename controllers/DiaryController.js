// controllers/DiaryController.js
import Section from "../models/section-model.js";

// Получить все разделы для пользователя
export async function getAllSections(req, res) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    const sections = await Section.find({ userId }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении разделов",
    });
  }
}

// Получить раздел по ID
export async function getSectionById(req, res) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    const section = await Section.findOne({ 
      id: req.params.id,
      userId 
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: "Раздел не найден",
      });
    }

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении раздела",
    });
  }
}

// Создать новый раздел
export async function createSection(req, res) {
  try {
    const { title, letter, color, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    // Создаем ID на стороне сервера
    const id = `section_${Date.now()}`;

    const section = await Section.create({
      id,
      userId,
      title,
      letter,
      color,
      tasks: [],
    });

    res.status(201).json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages,
      });
    }
    
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при создании раздела",
    });
  }
}

// Удалить раздел
export async function deleteSection(req, res) {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    console.log(`Deleting section ${req.params.id} for user ${userId}`);
    
    const section = await Section.findOneAndDelete({ 
      id: req.params.id,
      userId 
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: "Раздел не найден",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при удалении раздела",
    });
  }
}

// Добавить задачу в раздел
export async function addTaskToSection(req, res) {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    // Используем findOne вместо find для получения одного документа
    const section = await Section.findOne({ 
      id: req.params.id,
      userId 
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: "Раздел не найден",
      });
    }

    // Добавляем новую задачу в массив задач
    const taskId = `task_${Date.now()}`;
    const newTask = {
      id: taskId,
      ...req.body,
      completed: false,
      completedAt: null,
      sectionId: section.id,
      sectionTitle: section.title,
      sectionColor: section.color,
    };

    section.tasks.push(newTask);
    await section.save();

    res.status(200).json({
      success: true,
      data: section,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при добавлении задачи",
    });
  }
}

// Обновить статус выполнения задачи
export async function updateTaskCompletionStatus(req, res) {
  try {
    const { sectionId, taskId } = req.params;
    const { completed, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    // Находим раздел по ID и userId
    const section = await Section.findOne({ 
      id: sectionId,
      userId 
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: "Раздел не найден",
      });
    }

    // Находим задачу по ID
    const taskIndex = section.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Задача не найдена",
      });
    }

    // Обновляем статус задачи
    section.tasks[taskIndex].completed = completed;

    // Если задача выполнена, устанавливаем время выполнения
    if (completed) {
      section.tasks[taskIndex].completedAt = new Date();
    } else {
      section.tasks[taskIndex].completedAt = null;
    }

    await section.save();

    res.status(200).json({
      success: true,
      data: section.tasks[taskIndex],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при обновлении статуса задачи",
    });
  }
}

// Удалить задачу из раздела
export async function deleteTaskFromSection(req, res) {
  try {
    const { sectionId, taskId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    // Find section by ID and userId
    const section = await Section.findOne({ 
      id: sectionId,
      userId 
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: "Раздел не найден",
      });
    }

    // Check if task exists in section
    const taskIndex = section.tasks.findIndex((task) => task.id === taskId);

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Задача не найдена",
      });
    }

    // Remove task from tasks array
    section.tasks.splice(taskIndex, 1);

    // Save section
    await section.save();

    res.status(200).json({
      success: true,
      message: "Задача успешно удалена",
      data: {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при удалении задачи",
    });
  }
}

// Обновить задачу в разделе
export async function updateTaskInSection(req, res) {
  try {
    const { sectionId, taskId } = req.params;
    const { title, date, time, isUrgent, userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID пользователя обязателен",
      });
    }
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Название задачи обязательно"
      });
    }
    
    // Find the section by ID and userId
    const section = await Section.findOne({ 
      id: sectionId,
      userId 
    });

    if (!section) {
      return res.status(404).json({
        success: false,
        error: "Раздел не найден"
      });
    }

    // Find the specific task in the section's tasks array
    const taskIndex = section.tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Задача не найдена"
      });
    }

    // Get the existing task
    const existingTask = section.tasks[taskIndex];

    // Create updated task object - EXPLICITLY preserve all required fields
    const updatedTask = {
      // Always keep the original ID
      id: existingTask.id,
      
      // Always keep section reference data
      sectionId: existingTask.sectionId,
      sectionTitle: existingTask.sectionTitle,
      sectionColor: existingTask.sectionColor,
      
      // Update fields from request or keep existing values
      title: title || existingTask.title,
      date: date || existingTask.date,
      time: time || existingTask.time,
      isUrgent: isUrgent !== undefined ? isUrgent : existingTask.isUrgent,
      
      // Preserve completion status
      completed: existingTask.completed || false,
      completedAt: existingTask.completedAt || null,
      
      // Update the modified timestamp
      updatedAt: new Date()
    };

    // Replace the task in the tasks array
    section.tasks[taskIndex] = updatedTask;

    // Save the updated section to the database
    await section.save();

    // Return success response with updated section data
    res.status(200).json({
      success: true,
      message: "Задача успешно обновлена",
      data: section
    });
  } catch (error) {
    console.error(error);
    
    // Check for validation errors from Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    // General server error
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при обновлении задачи"
    });
  }
}