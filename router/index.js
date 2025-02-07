import Router from "express";
import * as UserController from "../controllers/UserController.js";
import * as CourseController from "../controllers/CourseController.js";
import * as BookController from "../controllers/BookController.js";
import * as ProductController from "../controllers/ProductController.js";
import * as CategoryController from "../controllers/CategoryController.js";
import * as PaymentController from "../controllers/PaymentController.js";
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
router.get("/getProductsByCategory/:id", CategoryController.getProductsByCategory);
// router.put('/:id', CategoryController.updateCategory);
router.delete("/:id", CategoryController.deleteCategory);

router.post("/pay", PaymentController.createPayment);
router.post("/statusPayment", PaymentController.getStatusPayment);

// app.get("/.well-known/apple-app-site-association", (req, res) => {
//   res.setHeader("Content-Type", "application/json");
//   fs.readFile("path/to/apple-app-site-association", "utf8", (err, data) => {
//     if (err) {
//       res.status(500).send("Error loading file");
//       return;
//     }
//     res.send(data);
//   });
// });

export default router;
