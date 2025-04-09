import Router from "express";
import * as UserController from "../controllers/UserController.js";
import * as CourseController from "../controllers/CourseController.js";
import * as BookController from "../controllers/BookController.js";
import * as ProductController from "../controllers/ProductController.js";
import * as CategoryController from "../controllers/CategoryController.js";
import * as PaymentController from "../controllers/PaymentController.js";
import * as DiaryController from "../controllers/DiaryController.js";
import * as ScheduleController from "../controllers/scheduleController.js";

import { SpeedReadingController } from "../controllers/speed-reading-controller.js";
// import { TimerController } from "../controllers/TimeController.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = new Router();

router.post("/auth/start-verification", UserController.startVerification);
router.post("/auth/verify-code", UserController.verifyCode);
router.post("/auth/set-avatar", UserController.setAvatar);
router.patch("/auth/update-data", UserController.setUserData);
router.post("/auth/register", UserController.register);
router.post("/auth/login", UserController.login);
router.get("/auth/me", UserController.getMe);
router.get("/auth/getMe", UserController.getMeMobile);
router.get("/getUsers", UserController.getUsers);
// router.patch("/getUsersTest", UserController.getUsersTest);
router.get("/getUserById/:id", UserController.getUserById);
router.get("/users/search/:key", UserController.searchUser);
router.delete("/removeUser/:id", UserController.deleteUser);
router.get("/", (req, res) => {
  console.log("API работает!");
  res.send("API работает! !)");
});

router.post(
  "/createCourse",
  roleMiddleware(["ADMIN"]),
  CourseController.createCourse
);
router.get("/getAllCourses", CourseController.getAllCourses);
router.post("/searchCourse", CourseController.searchCourse);
router.get("/getAllStories", CourseController.getAllStories);
router.get("/getCourse/:id", CourseController.getCourse);
router.get("/getLessons/:id", CourseController.getLessons);
router.get("/getLesson/:id", CourseController.getLesson);
router.get("/getModules/:id", CourseController.getModules);
router.get("/getModule/:id", CourseController.getModule);
router.delete(
  "/deleteCourse/:id",
  roleMiddleware(["ADMIN"]),
  CourseController.deleteCourse
);
router.delete(
  "/deleteModule/:id",
  roleMiddleware(["ADMIN"]),
  CourseController.deleteModule
);
router.delete("/removeUserModule/:id", CourseController.removeUserModule);
router.patch(
  "/createModule/:id",
  roleMiddleware(["ADMIN"]),
  CourseController.createModule
);
router.patch("/addCourseToUser", CourseController.addCourseToUser);
router.get("/getVersion", CourseController.getVersion);

router.post("/fetchChatgpt", UserController.fetchChatgpt);
router.post("/pdf", UserController.downloadPdf);
router.post("/word", UserController.downloadWord);
router.post("/gptRequest", UserController.addGptRequestToUser);
router.post("/sendMessageToChatGPT", UserController.sendMessageToChatGPT);
router.post("/saveAiResponse", UserController.saveAiResponse);
router.post("/saveAiQuiz", UserController.saveAiQuiz);
router.post("/checkSubscription", UserController.checkSubscription);
// router.post("/generatePdf", UserController.generatePdf);

router.get("/getAllBooks", BookController.getAllBooks);
router.get("/getBooksForCategory", BookController.getBooksForCategory);
router.get("/searchBooks", BookController.searchBooks);
router.get("/getMyBooks", BookController.getMyBooks);

router.post("/setBookToUser", BookController.setBookToUser);

//  PRODUCTS ===================================================================

router.get("/getAllProducts", ProductController.getAllProducts);
router.post("/createProduct/:storeId", ProductController.createProduct);
router.get("/getAllShops", ProductController.getAllShops);
router.post("/createShop", ProductController.createShop);
router.post("/shop/:storeId/products", ProductController.addProductToShop);
router.post("/image-upload", ProductController.uploadFile);
router.delete("/stores/:id", ProductController.deleteStore);
router.get("/getStoreById/:id", ProductController.getStoreById);

//  CATEGORY ===================================================================

router.post("/createCategory", CategoryController.createCategory);
router.get("/getAllCategories", CategoryController.getAllCategories);
router.get("/getCategoryById/:id", CategoryController.getCategoryById);
router.get(
  "/getProductsByCategory/:id",
  CategoryController.getProductsByCategory
);
// router.put('/:id', CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

router.post("/pay", PaymentController.createPayment);
router.post("/statusPayment", PaymentController.getStatusPayment);

// Добавьте эти маршруты в раздел роутинга для админа
router.get("/admin/users", UserController.getAdminUsersList);

router.post("/admin/grant-ai-access", UserController.grantAiAccess);
// Добавьте этот маршрут к существующим маршрутам администратора
router.get(
  "/admin/users-with-subscription",
  UserController.getUsersWithAiSubscription
);

// Статистика для админов
router.get("/admin/ai-statistics", UserController.getAiUsageStatistics);

router.get(
  "/admin/user-ai-statistics/:userId",
  UserController.getUserAiStatistics
);

// Дневник
router.get("/diary", DiaryController.getAllSections);

router.get("/diary/:id", DiaryController.getSectionById);

router.post("/diary/createSection", DiaryController.createSection);
router.patch(
  "/diary/:sectionId/tasks/:taskId/complete",
  DiaryController.updateTaskCompletionStatus
);
// Маршрут для добавления задачи в раздел
router.post("/diary/:id/tasks", DiaryController.addTaskToSection);
router.delete("/diary/:id", DiaryController.deleteSection);
router.delete(
  "/diary/:sectionId/tasks/:taskId",
  DiaryController.deleteTaskFromSection
);
router.put(
  "/sections/:sectionId/tasks/:taskId",
  DiaryController.updateTaskInSection
);
//Sheculde
router.get("/schedules", ScheduleController.getSchedules);
router.get("/schedules/date/:date", ScheduleController.getSchedulesByDate);
router.get("/schedules/:id", ScheduleController.getScheduleById);
router.post("/schedules", ScheduleController.createSchedule);
router.put("/schedules/:id", ScheduleController.updateSchedule);
router.delete("/schedules/:id", ScheduleController.deleteSchedule);
router.get("/schedules/stats", ScheduleController.getScheduleStats);

router.post("/sessions", SpeedReadingController.createSession);
router.post(
  "/sessions/:sessionId/students",
  SpeedReadingController.addStudentResult
);
router.get("/sessions", SpeedReadingController.getUserSessions);
router.get("/sessions/:sessionId", SpeedReadingController.getSessionById);
router.patch(
  "/sessions/:sessionId/status",
  SpeedReadingController.updateSessionStatus
);
router.get("/points", SpeedReadingController.getUserRemainingPoints);

router.post(
  "/generate-educational-content",
  SpeedReadingController.generateEducationalContent
);

// router.get("/sessions/:sessionId/timer", TimerController.getTimerStatus);
// router.post("/sessions/:sessionId/timer/toggle", TimerController.toggleTimer);
// router.post("/sessions/:sessionId/timer/reset", TimerController.resetTimer);

// app.get("/.well-known/apple-app-site-association", (req, res) => {
//   res.setHeader("Content-Type", "application/json");addStudentResult
//   fs.readFile("path/to/apple-app-site-association", "utf8", (err, data) => {
//     if (err) {
//       res.status(500).send("Error loading file");
//       return;
//     }
//     res.send(data);
//   });
// });

export default router;
