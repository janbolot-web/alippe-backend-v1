// controllers/scheduleController.js
import Schedule from "../models/shedule-model.js";
import mongoose from "mongoose";

// @desc    Получить все элементы расписания
// @route   GET /api/schedules
// @access  Public
export const getSchedules = async (req, res) => {
  try {
    // Поддержка пагинации
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const skip = (page - 1) * limit;

    // Поиск всех элементов расписания с сортировкой по дате и времени
    const schedules = await Schedule.find()
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Schedule.countDocuments();

    res.status(200).json({
      success: true,
      count: schedules.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      data: schedules,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении расписания",
    });
  }
};

// @desc    Получить элементы расписания по дате
// @route   GET /api/schedules/date/:date
// @access  Public
export const getSchedulesByDate = async (req, res) => {
  try {
    const dateString = req.params.date; // формат YYYY-MM-DD

    // Создаем начало и конец даты для поиска по всему дню
    const startDate = new Date(dateString);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(dateString);
    endDate.setHours(23, 59, 59, 999);

    // Поиск элементов расписания на указанную дату
    const schedules = await Schedule.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ timeRange: 1 }); // Сортировка по времени

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении расписания по дате",
    });
  }
};

// @desc    Получить элемент расписания по ID
// @route   GET /api/schedules/:id
// @access  Public
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Элемент расписания не найден",
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (err) {
    console.error(err);

    // Проверяем, является ли ошибка некорректным ObjectID
    if (err.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        error: "Элемент расписания не найден",
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении элемента расписания",
    });
  }
};

// @desc    Создать новый элемент расписания
// @route   POST /api/schedules
// @access  Public
export const createSchedule = async (req, res) => {
  try {
    // Создаем новый элемент расписания
    const schedule = await Schedule.create(req.body);

    res.status(201).json({
      success: true,
      data: schedule,
    });
  } catch (err) {
    console.error(err);

    // Проверяем, является ли ошибка ошибкой валидации
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка сервера при создании элемента расписания",
    });
  }
};

// @desc    Обновить элемент расписания
// @route   PUT /api/schedules/:id
// @access  Public
export const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Элемент расписания не найден",
      });
    }

    res.status(200).json({
      success: true,
      data: schedule,
    });
  } catch (err) {
    console.error(err);

    // Проверяем, является ли ошибка ошибкой валидации
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);

      return res.status(400).json({
        success: false,
        error: messages,
      });
    }

    res.status(500).json({
      success: false,
      error: "Ошибка сервера при обновлении элемента расписания",
    });
  }
};

// @desc    Удалить элемент расписания
// @route   DELETE /api/schedules/:id
// @access  Public
export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByIdAndDelete(req.params.id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: "Элемент расписания не найден",
      });
    }

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при удалении элемента расписания",
    });
  }
};

// @desc    Получить статистику по расписанию
// @route   GET /api/schedules/stats
// @access  Public
export const getScheduleStats = async (req, res) => {
  try {
    const stats = await Schedule.aggregate([
      // Группировка по типу и подсчет элементов
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      // Добавление поля type вместо _id для более понятного вывода
      {
        $project: {
          _id: 0,
          type: "$_id",
          count: 1,
        },
      },
      // Сортировка по количеству (по убыванию)
      {
        $sort: { count: -1 },
      },
    ]);

    // Получаем статистику по классам
    const classesStat = await Schedule.aggregate([
      // Группировка по классу и подсчет элементов
      {
        $group: {
          _id: "$classInfo",
          count: { $sum: 1 },
        },
      },
      // Переименование полей
      {
        $project: {
          _id: 0,
          class: "$_id",
          count: 1,
        },
      },
      // Сортировка по классу
      {
        $sort: { class: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        typeStats: stats,
        classStats: classesStat,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: "Ошибка сервера при получении статистики",
    });
  }
};
