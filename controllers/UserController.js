import expressValidate, { body, header } from "express-validator";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import userModel from "../models/user-model.js";
import UserDto from "../dtos/user.dto.js";
import roleModel from "../models/role-model.js";
import axios from "axios";
import dotenv from "dotenv";
import pdfkit from "pdfkit";
import fs from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";

let verificationCodes = {};
dotenv.config();

export const startVerification = async (req, res) => {
  try {
    // Извлекаем номер телефона из запроса
    const { phoneNumber } = req.body;
    // Инициализация Twilio клиента с использованием учетных данных из переменных окружения
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioClient = twilio(accountSid, authToken);

    // Генерация и сохранение случайного кода верификации для номера телефона
    const generateVerificationCode = () => {
      return Math.floor(100000 + Math.random() * 900000);
    };
    const verificationCode = generateVerificationCode();
    verificationCodes.phoneNumber = verificationCode;

    // Отправка SMS с сгенерированным кодом верификации
    await twilioClient.messages.create({
      body: `Ваш проверочный код: ${verificationCode}`,
      from: "whatsapp:" + process.env.TWILIO_WHATSAPP_NUMBER,
      to: "whatsapp:" + phoneNumber,
    });
    // Ответ об успешной отправке кодаt
    res.json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    // Обработка ошибок при отправке SMS
    console.error("Error sending SMS:", error);
    res.status(500).json({ success: false, message: "Error sending SMS" });
  }
};

// Метод для проверки введенного пользователем кода верификации
export const verifyCode = async (req, res) => {
  try {
    // Извлекаем номер телефона и введенный код из запроса
    const phoneNumber = req.body.phoneNumber;
    // Проверка, существует ли уже пользователь с этим номером телефона
    const existingUser = await userModel.findOne({ phoneNumber: phoneNumber });

    // console.log("!!!!!!", verificationCodes.phoneNumber,phoneNumber,userEnteredCode);
    // Проверка соответствия введенного кода сохраненному коду верификации

    if (existingUser) {
      // Пользователь уже зарегистрирован, отправьте сообщение об этом
      const UserData = new UserDto(existingUser);
      console.log("DTo", UserData);
      return res.json({
        success: true,
        data: UserData,
        message: "Номер подтвержден!",
      });
    }

    const userRole = await roleModel.findOne({ value: "USER" });

    const newUser = new userModel({
      name: "",
      phoneNumber: phoneNumber,
      isDataUser: false,
      avatarUrl: "",
      email: new Date(),
      roles: [userRole.value],
      // Другие поля пользователя
    });

    const user = await newUser.save();
    // Создание экземпляра пользователя

    const token = jwt.sign(
      {
        _id: user._id,
        roles: user.roles,
      },
      "secret1234",
      { expiresIn: "30d" }
    );
    // Ответ об успешной верификации
    const userData = new UserDto(user);
    res.json({
      success: true,
      data: userData,
      message: "Номер успешно подтвержден!",
    });
  } catch (error) {
    // Обработка ошибок при проверке кода верификации
    console.error("Error verifying code:", error);
    res.status(500).json({ success: false, message: "Error verifying code" });
  }
};

export const setAvatar = async (req, res) => {
  try {
    const { userId, avatarUrl } = req.body;

    const updateData = {
      $set: {
        avatarUrl: avatarUrl,
      },
    };
    const user = await userModel.findByIdAndUpdate(userId, updateData, {
      new: true,
    });
    const token = jwt.sign(
      {
        _id: user._id,
        roles: user.roles,
      },
      "secret1234",
      { expiresIn: "30d" }
    );
    const userData = new UserDto(user);
    console.log("DTO", userData);
    console.log("Документ успешно обновлен:", user);

    res.json({
      data: userData,
      message: "Вы обновили фото профилья!",
    });
  } catch (error) {
    console.log(error);
  }
};
export const setUserData = async (req, res) => {
  try {
    const name = req.body.name;
    // console.log(req.body);
    console.log(req.query.userId);

    const updateData = {
      $set: {
        name: name,
      },
    };
    const user = await userModel.findByIdAndUpdate(
      req.query.userId,
      updateData,
      { new: true }
    );
    const token = jwt.sign(
      {
        _id: user._id,
        roles: user.roles,
      },
      "secret1234",
      { expiresIn: "30d" }
    );
    const userData = new UserDto(user);
    console.log("DTO", userData);
    console.log("Документ успешно обновлен:", user);
    res.json({
      data: {
        userData,
        token,
      },
      message: "Вы успешно авторизовались!",
    });
  } catch (error) {
    console.log(error);
  }
};

export const register = async (req, res) => {
  try {
    const errors = expressValidate.validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    const { phone, password, name, avatarUrl } = req.body;
    const candidate = await userModel.findOne({ phone });
    if (candidate) {
      return res
        .status(400)
        .json({ message: `Пользователь ${phone} уже существует` });
    }
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    const userRole = await roleModel.findOne({ value: "USER" });
    console.log();
    const doc = new userModel({
      phone,
      password: hashPassword,
      name,
      avatarUrl: "",
      email: Date.now().toString(),
      roles: [userRole.value],
    });

    const user = await doc.save();
    console.log("!!!!!!!!!!!!", user);

    const token = jwt.sign(
      {
        _id: user._id,
        roles: user.roles,
      },
      "secret1234",
      { expiresIn: "30d" }
    );

    const UserData = new UserDto(user);

    res.json({
      ...UserData,
      token,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Не удалось зарегистрироваться",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password, name } = req.body;

    const user = await userModel.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const isValidPass = await bcrypt.compare(password, user._doc.password);

    if (!isValidPass) {
      return res.status(400).json({ message: "Неверный логин или пароль" });
    }

    const token = jwt.sign(
      {
        _id: user._id,
        roles: user.roles,
      },
      "secret1234",
      { expiresIn: "30d" }
    );

    const UserData = new UserDto(user);

    res.json({
      data: { ...UserData, token },
      message: "Вы успешно авторизовались",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Не удалось авторизваться",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) {
      return res.status(400).json({ error: "Token is required" });
    }
    const decoded = jwt.verify(token, "secret1234");
    const userId = decoded._id; // Предполагаем, что номер телефона хранится в поле "phone"
    if (!userId) {
      return res.status(400).json({ error: "Phone number not found in token" });
    }
    const user = await userModel.findById(userId).populate("courses");
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    const UserData = new UserDto(user);
    console.log(UserData);
    res.json(UserData);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Нет доступа",
    });
  }
};

export const getMeMobile = async (req, res) => {
  try {
    const user = await userModel.findById(req.query.userId).populate("courses");

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    const UserData = new UserDto(user);
    console.log("UserData", UserData);

    res.json(UserData);
  } catch (e) {
    console.log(e);
    res.status(500).json({
      message: "Нет доступа",
    });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await userModel.find().sort({ _id: -1 }).limit(30);

    console.log("users", users);
    res.json(users);
  } catch (e) {
    console.log(e);
  }
};

// export const getUsersTest = async (req, res) => {
//   try {
//     const users = await userModel.find();
//     let userId = [];
//     users.map((user) =>
//       user.courses.map((course) => {
//         if (course == null) return;
//         course.lessons.map((lesson) => {
//           if (lesson.name == "Киришүү сабагы") {
//             userId.push(user.id);
//           }
//           return;
//         });
//       })
//     );
//     userId.map(async (user) => {
//       const userData = await userModel.findById(user);
//       let newData = [];
//       userData.courses.map((course, index) => {
//         let lessonsData = [];
//         course.lessons.map((lesson) => {
//           lessonsData.push({
//             name: lesson.name,
//             videoUrl: lesson.videoUrl,
//             description: lesson.description,
//             youtubeUrl:
//               lesson.name === "Киришүү сабагы"
//                 ? "https://youtu.be/qJ3cUsHClQA"
//                 : lesson.name === "Алгачкы окуучуларды окутуу боюнча..."
//                 ? "https://youtu.be/cayiHYUM32g"
//                 : lesson.name == "\"Самореализация \""
//                 ? "https://youtu.be/XQc_tTRcZaU"
//                 : lesson.name ===
//                   "Шар окуунун алгачкы сабагы жана алгачкы методикалары."
//                 ? "https://youtu.be/WyEpVLqOvss"
//                 : lesson.name === "Шар окуу китебинин мазмуну."
//                 ? "https://youtu.be/jS67AbOxgOo"
//                 : lesson.name ===
//                   " Шар окуу китебиндеги көнүгүүлөрдүн инструкциясы..."
//                 ? "https://youtu.be/kucjktQHeZY"
//                 : lesson.name === "Шар окуу методикалары."
//                 ? "https://youtu.be/erbAP7q4QSo"
//                 : lesson.name ===
//                   "Баланын окуудагы көйгөйлөрүн жоюуга арналган методикалар."
//                 ? "https://youtu.be/uvi8dlnPRQI"
//                 : lesson.name ===
//                   " Баланын окуу ылдамдыгын арттыруучу методикалар."
//                 ? "https://youtu.be/tzNhjOftLU8"
//                 : lesson.name === "Баланын түшүнүгүн арттырууга иштөө." ??
//                   "https://youtu.be/0Vft7qmPdzU",
//           });
//         });
//         newData.push({
//           name: course.name,
//           courseId: course.courseId,
//           price: course.price,
//           isAccess: course.isAccess,
//           lessons: lessonsData,
//         });
//       });
//       const updatedData = await userModel.findByIdAndUpdate(user, {
//         courses: newData,
//       });
//       res.json(updatedData);
//     });

//     res.json({ message: "ok" });
//   } catch (e) {
//     console.log(e);
//   }
// };

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.findById(id).populate("courses");

    res.json(user);
  } catch (e) {
    console.log(e);
  }
};

export const searchUser = async (req, res) => {
  try {
    const user = await userModel
      .find({
        $or: [
          { name: { $regex: req.params.key } },
          { phoneNumber: { $regex: req.params.key } },
        ],
      })
      .populate("courses");

    res.json(user);
  } catch (e) {
    console.log(e);
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await userModel.findByIdAndDelete({ _id: id });
    res.json({ message: "Пользователь успешно удален" });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Не удалось удалить пользователья" });
  }
};

export const fetchChatgpt = async (req, res) => {
  console.log("ok");
  try {
    const data = req.body.response;
    // console.log("!!!!!!!!!data",data);

    const prompt = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: data,
        },
      ],
    };

    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPEN_AI}`,
      },
    };
    const response = await axios
      .post(
        "https://models.inference.ai.azure.com/chat/completions",
        prompt,
        config
      )
      .then((response) => {
        return response;
      })
      .catch((error) => {
        console.error("Произошла ошибка:", error); // обработка ошибки
      });

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun("Кыргыз тилинде текст."),
                new TextRun({
                  text: " Бул классикалык сабак планынын мисалы.",
                  bold: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    Packer.toBuffer(doc).then((buffer) => {
      fs.writeFileSync("LessonPlan.docx", buffer);
      console.log("Word файл түзүлдү!");
    });

    res.json({
      response: response.data.choices[0].message.content,
      statusCode: response.status,
    });
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Не удалось удалить пользователья" });
  }
};
export const generatePdf = async (req, res) => {
  try {
    const doc = new pdfkit();

    // Устанавливаем заголовок ответа для указания типа содержимого как PDF
    res.setHeader("Content-Type", "application/pdf");
    // Устанавливаем заголовок ответа для указания имени файла
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="user_data.pdf"'
    );

    // Перенаправляем вывод PDF в ответ HTTP
    doc.pipe(res);
    doc.font("fonts/RobotoFlex-Regular.ttf");

    // Добавляем информацию о пользователе в PDF
    doc.text(`Жанюолот`);

    // Добавляем информацию о курсах пользователя в PDF

    // Завершаем документ и ответ
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
};
