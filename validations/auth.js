import { body } from "express-validator";

export const registerValidation = [
  body("email", "Неверный формат почты").isEmail(),
  body("password", "Пароль должен быть минимум 6 символов").isLength({
    min: 6,
    max: 32,
  }),
  body("name", "Имя должен быть минимум 3 символов").isLength({ min: 3 }),
];
