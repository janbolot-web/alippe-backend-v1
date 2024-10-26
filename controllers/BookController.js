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

// export const createCourse = async (req, res) => {
//   try {
//     const {
//       title,
//       duration,
//       description,
//       price,
//       previewImgUrl,
//       previewVideoUrl,
//       authorName,
//       authorProfession,
//       authors,
//       modules,
//     } = req.body;
//     const authorsData = await authorModel.create(authors);
//     // const lessonsData = await moduleModel.create();
//     const doc = new courseModel({
//       title,
//       duration,
//       description,
//       price,
//       previewImgUrl,
//       previewVideoUrl,
//       authorName,
//       authorProfession,
//       authors: authorsData,
//       modules: modules,
//     });
//     await doc.save();
//     // course = course._doc;
//     // console.log(modules);
//     res.json({ message: "Новый курс успешно создан" });
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось создать новый курс" });
//   }
// };

// export const searchCourse = async (req, res) => {
//   console.log(req.body);
//   const { key } = req.body;
//   if (!key) {
//     return res.status(400).json({ error: "Search key is required" });
//   }

//   try {
//     const courses = await courseModel.find({
//       $or: [{ title: { $regex: key, $options: "i" } }],
//     });

//     if (courses.length === 0) {
//       return res.status(404).json({ message: "No users found" });
//     }
//     console.log(courses);
//     res.json(courses);
//   } catch (error) {
//     console.error("Error while searching for users:", error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// export const getAllStories = async (req, res) => {
//   try {
//     const stories = await storyModel.find();
//     let storiesData = StoryDto(stories);
//     storiesData = storiesData.reverse();
//     res.json(storiesData);
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось получить все сторисы" });
//   }
// };

// export const getCourse = async (req, res) => {
//   try {
//     const courseId = req.params.id;
//     const course = await courseModel
//       .findById(courseId)
//       .populate("authors")
//       .populate("modules");
//     // .populate({ path: "modules.lessons" });
//     // const { ...courseData } = course._doc;
//     res.json(course);
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось получить курс" });
//   }
// };

// export const getLessons = async (req, res) => {
//   try {
//     const courseId = req.params.id;
//     const userId = req.query.userId;
//     // const course = await courseModel.findById(courseId).populate("modules");
//     // const { lessons, title } = course._doc;
//     // res.json({ title, lessons });
//     console.log(userId);
//     const user = await userModel.findById(userId);
//     const course = await courseModel.findById(courseId);
//     course.modules.forEach((item) => {
//       return user.courses.forEach((el) => {
//         if (String(item._id) === String(el._id)) {
//           item.isAccess = true;
//         }
//         console.log("NO" + item._id);
//       });
//     });

//     await course.save();

//     res.json(course);
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось получить видео" });
//   }
// };

// export const getLesson = async (req, res) => {
//   try {
//     const courseId = req.params.id;
//     const lessonId = req.query.idLesson;
//     // console.log(lessonId);
//     const course = await courseModel.findById(courseId);
//     // const lessonData = course[0].modules;
//     // let isLesson = [];
//     course.modules.forEach(function (item, i, arr) {
//       item.lessons.forEach(function (item, i, arr) {
//         // isLesson.push(String(item._id));
//         if (String(item._id) === lessonId) {
//           return res.json(item);
//         }
//       });
//     });
//     // res.json();
//     // isLesson = isLesson.filter(function (number) {
//     //   return number === lessonId;
//     // });
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось получить видео" });
//   }
// };

// export const getModules = async (req, res) => {
//   try {
//     const courseId = req.params.id;
//     const { modules } = await courseModel.findById(courseId);
//     res.json(modules);
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось получить модуль" });
//   }
// };

// export const getModule = async (req, res) => {
//   try {
//     const courseId = req.params.id;
//     const moduleId = req.query.moduleId;
//     const { modules } = await courseModel.findById(courseId);
//     const module = modules.filter((module) => String(module._id) === moduleId);
//     res.json(module[0]);
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось получить модуль" });
//   }
// };

// export const deleteCourse = async (req, res) => {
//   try {
//     const id = req.params.id;
//     await courseModel.findByIdAndDelete({ _id: id });
//     res.json({ message: "Курс успешно удален" });
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось удалить курс" });
//   }
// };

// export const createModule = async (req, res) => {
//   try {
//     // const lessonsData = await lessonModel.create(module.lessons);
//     // const modulesData = await moduleModel.create({
//     //   name: module.name,
//     //   lessons: lessonsData,
//     // });
//     // const modulesDoc = await moduleModel.findById()
//     const params = req.body;
//     const courseId = req.params.id;
//     const modulesDoc = await courseModel.findById(courseId);
//     const course = await courseModel.findByIdAndUpdate(courseId, {
//       modules: [...modulesDoc.modules, params.module],
//     });
//     res.json(course);
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось создать модуль" });
//   }
// };

// export const addCourseToUser = async (req, res) => {
//   try {
//     const { moduleId, userId, courseId } = req.body.params;

//     let userData = await userModel.findById(userId);
//     let courseData = await courseModel.findById(courseId);
//     let module = courseData.modules.filter(
//       (item) => String(item._id) === moduleId
//     );
//     module[0].courseId = courseId;
//     if (module.length > 0) {
//       const candidate = userData.courses.filter(
//         (item) => String(item._id) === moduleId
//       );
//       if (candidate.length > 0) {
//         return res
//           .status(400)
//           .json({ message: "У пользователя уже имеется данный курс!" });
//       }
//       const a = await userModel.findByIdAndUpdate(userId, {
//         courses: [...userData.courses, module[0]],
//       });
//       console.log("module !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! " + module);
//       return res.json({ module, message: "Вы открыли доступ к модулю" });
//     }
//     // res.json(courseData);
//     res.json({ message: "Что то пошло не так" });
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось создать модуль" });
//   }
// };

// export const removeUserModule = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { userId } = req.query;
//     const user = await userModel.findById(userId);
//     const deletedModule = user.courses.filter(
//       (course) => String(course._id) !== id
//     );
//     await userModel.findByIdAndUpdate(userId, { courses: deletedModule });
//     res.json({ message: "Вы успешно закрыли доступ!", deletedModule });
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось закрыть доступ" });
//   }
// };

// export const deleteModule = async (req, res) => {
//   try {
//     const courseId = req.params.id;
//     const moduleId = req.query.moduleId;
//     const course = await courseModel.findById({ _id: courseId });
//     course.modules = course.modules.filter(
//       (item) => String(item._id) !== moduleId
//     );

//     await course.save();
//     res.json({ message: "Модуль успешно удален" });
//   } catch (error) {
//     console.log(error);
//     res.status(404).json({ message: "Не удалось удалить модуль" });
//   }
// };

// export const getAuthors = async (req, res) => {
//     try {
//       const courseId = req.query.id;
//       const course = await courseModel.findById(courseId);
//       const { lessons, title } = course;
//       console.log(lessons,title);
//     } catch (error) {
//       console.log(error);
//       res.status(404).json({ message: "Не удалось получить видео" });
//     }
//   };