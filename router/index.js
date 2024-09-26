import Router from "express";
import * as UserController from "../controllers/UserController.js";
import * as CourseController from "../controllers/CourseController.js";
import * as BookController from "../controllers/BookController.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import checkAuth from "../middleware/authMiddleware.js";

const router = new Router();

router.post("/auth/start-verification", UserController.startVerification);
router.post("/auth/verify-code", UserController.verifyCode);
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
router.post("/generatePdf", UserController.generatePdf);

router.get("/getAllBooks", BookController.getAllBooks);
router.get("/getBooksForCategory", BookController.getBooksForCategory);
router.get("/searchBooks", BookController.searchBooks);
router.get("/getMyBooks", BookController.getMyBooks);

router.post("/setBookToUser", BookController.setBookToUser);

export default router;
