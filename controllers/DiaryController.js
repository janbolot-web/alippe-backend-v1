// controllers/sectionController.js
import Section from "../models/section-model.js";

// Получить все разделы
export async function getAllSections(req, res) {
  try {
    const sections = await Section.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении разделов",
    });
  }
}

// Получить раздел по ID
export async function getSectionById(req, res) {
  try {
    const section = await Section.findById(req.params.id);

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
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении раздела",
    });
  }
}

export const createSection = async (req, res) => {
  console.log("ss");
  try {
    const { title, letter, color } = req.body;
    // Создаем ID на стороне сервера
    const id = `section_${Date.now()}`;

    const section = await Section.create({
      id,
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
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages,
      });
    }
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при создании раздела",
    });
  }
};

// Обновить раздел
export async function updateSection(req, res) {
  try {
    const section = await Section.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
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
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        error: messages,
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка сервера при обновлении раздела",
    });
  }
}

// Удалить раздел
export async function deleteSection(req, res) {
  try {
    const section = await Section.findByIdAndDelete(req.params.id);

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
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при удалении раздела",
    });
  }
}

// Добавить задачу в раздел
// Добавить задачу в раздел
export async function addTaskToSection(req, res) {
  try {
    // Используем findOne вместо find для получения одного документа
    const section = await Section.findOne({ id: req.params.id });

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
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при добавлении задачи",
    });
  }
}

export async function addLessonToSection(req, res) {
  try {
    // Используем findOne вместо find для получения одного документа
    const section = await Section.findOne({ id: req.params.id });

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
    console.log(error);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при добавлении задачи",
    });
  }
}

