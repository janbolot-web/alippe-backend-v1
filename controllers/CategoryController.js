import categoryModel from "../models/category-model.js";

// Создать новую категорию
export const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory, imageUrl } = req.body;

    const category = new categoryModel({
      name,
      description,
      parentCategory,
      imageUrl,
    });

    await category.save();
    res.status(201).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Получить все категории
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find().populate("parentCategory");
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Получить категорию по ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await categoryModel
      .findById(id)
      .populate("parentCategory");

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Категория не найдена" });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Обновить категорию
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, parentCategory, imageUrl } = req.body;

    const category = await categoryModel.findByIdAndUpdate(
      id,
      { name, description, parentCategory, imageUrl },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Категория не найдена" });
    }

    res.status(200).json({ success: true, category });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Удалить категорию
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryModel.findByIdAndDelete(id);

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Категория не найдена" });
    }

    res.status(200).json({ success: true, message: "Категория удалена" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
