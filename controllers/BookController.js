import { CourseDto } from "../dtos/course.dto.js";
import bookModels from "../models/book-models.js";
import userModel from "../models/user-model.js";

export const getAllBooks = async (req, res) => {
  try {
    const books = await bookModels.find();

    res.json(books);
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Не удалось получить все книги" });
  }
};

export const getBooksForCategory = async (req, res) => {
  const category = req.query.category; // Получаем категории из query параметра

  try {
    if (!category) {
      return res.status(400).json({ message: "Категории не переданы" });
    }

    const books = await bookModels.find({ category: category });
    res.json(books);
  } catch (error) {
    console.error("Ошибка при получении книг:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const searchBooks = async (req, res) => {
  try {
    const { q, category } = req.query; // Получаем поисковый запрос и категорию из параметров URL
    let books;
    if (category) {
      let booksFiltered;
      // Если category не пустая или не null, добавляем условие для категории
      const searchConditions = {
        $or: [
          { title: { $regex: q, $options: "i" } }, // Поиск по названию
          { author: { $regex: q, $options: "i" } }, // Поиск по автору
          { category: { $regex: q, $options: "i" } }, // Поиск по автору
        ],
      };
      books = await bookModels.find(searchConditions);
      booksFiltered = books.filter((book) => book.category === category);
      res.json(booksFiltered);
    } else {
      const searchConditions = {
        $or: [
          { title: { $regex: q, $options: "i" } }, // Поиск по названию
          { author: { $regex: q, $options: "i" } }, // Поиск по автору
          { category: { $regex: q, $options: "i" } }, // Поиск по автору
        ],
      };

      books = await bookModels.find(searchConditions);
      res.json(books);
    }
    // Создаем условие для поиска
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyBooks = async (req, res) => {
  const { userId } = req.query; // Получаем категории из query параметра

  try {
    if (!userId) {
      return res.status(400).json({ message: "ID пользователя не переданы" });
    }

    const user = await userModel.findById({ _id: userId }).populate("books");
    res.json(user.books);
  } catch (error) {
    console.error("Ошибка при получении книг:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

export const setBookToUser = async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    if (!userId || !bookId) {
      return res
        .status(400)
        .json({ message: "ID пользователя или книги не переданы" });
    }

    const book = await bookModels.findById({ _id: bookId });
    if (!book) {
      return res.status(404).json({ message: "Книга не найдена" });
    }

    const user = await userModel.findById({ _id: userId }).populate("books");

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Проверка, есть ли книга в списке пользователя
    const hasBook = user.books.some(
      (userBook) => userBook._id.toString() === bookId
    );

    let updatedBooks;

    if (hasBook) {
      // Удаляем книгу, если она уже есть
      updatedBooks = user.books.filter(
        (userBook) => userBook._id.toString() !== bookId
      );
    } else {
      // Добавляем книгу, если её нет
      updatedBooks = [...user.books, book];
    }

    // Обновляем пользователя с новым списком книг
    const updatedUser = await userModel
      .findByIdAndUpdate(userId, { books: updatedBooks }, { new: true })
      .populate("books");
    // console.log(updatedUser.books);
    res.json(updatedUser.books);
  } catch (error) {
    console.error("Ошибка при обновлении книг пользователя:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

