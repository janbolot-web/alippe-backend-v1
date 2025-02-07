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
import AWS from "aws-sdk";
import path from "path";
import puppeteer from "puppeteer";
import { marked } from "marked";
import htmlToDocx from "html-to-docx";
import { v4 as uuidv4 } from "uuid";

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
  try {
    const { message, userId } = req.body;
    console.log('message',message);
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const aiSubscription = user.subscription.find((sub) => sub.title === "ai");
    if (aiSubscription && aiSubscription.planPoint > 0) {
      // Отправка запроса в GPT-4
      // console.log("!!!!!!!!!data",data);

      const prompt = {
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: message,
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
          "https://workers-playground-shiny-haze-2f78jjjj.janbolotcode.workers.dev/v1/chat/completions",
          prompt,
          config
        )
        .then((response) => {
          return response;
        })
        .catch((error) => {
          console.error("Произошла ошибка:", error); // обработка ошибки
        });

      aiSubscription.planPoint -= 1;
      await user.save();

      const UserData = new UserDto(user);
      console.log(UserData);

      res.json({
        response: response.data.choices[0].message.content,
        userData: UserData,
        statusCode: response.status,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({ message: "Не удалось удалить пользователья" });
  }
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Ensure these are set in your environment
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // region: process.env.AWS_REGION, // e.g. "us-east-1"
});

const __dirname = path.dirname(new URL(import.meta.url).pathname);

const uploadToS3 = async (filePath, fileName, type) => {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME, // Your S3 bucket name
    Key: `files/${fileName}`, // S3 object key (you can adjust the path in S3 as needed)
    Body: fileContent,
    ContentType: type == "pdf" ? "application/pdf" : "application/word", // Adjust content type based on file
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("File uploaded successfully:", data.Location);
    return data.Location; // Return the URL of the uploaded file
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw error;
  }
};

function ensureTempDirectoryExists() {
  const tempPath = path.join(__dirname, "temp");
  if (!fs.existsSync(tempPath)) {
    fs.mkdirSync(tempPath, { recursive: true });
  }
}
export const downloadPdf = async (req, res) => {
  try {
    // Ensure temporary directory exists
    ensureTempDirectoryExists();

    const { markdown } = req.body;
    const fileName = `${uuidv4()}.pdf`;
    const filePath = path.join(__dirname, "temp", fileName);

    // Convert Markdown to HTML
    const htmlContent = `
    <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Lato', sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            line-height: 1.6;
          }
          .content {
            page-break-before: always;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #2c3e50;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }
          h1 {
            font-size: 2.5em;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 0.3em;
          }
          h2 {
            font-size: 2em;
          }
          h3 {
            font-size: 1.75em;
          }
          p {
            margin: 0 0 1em;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5em;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #f8f9fa;
            font-weight: bold;
          }
          ul, ol {
            margin: 0 0 1.5em 1.5em;
            padding: 0;
          }
          li {
            margin-bottom: 0.5em;
          }
          .header {
            text-align: center;
            margin-bottom: 2em;
          }
          .header img {
            max-width: 150px;
            margin-bottom: 1em;
          }
          .footer {
            text-align: center;
            font-size: 0.9em;
            color: #777;
            margin-top: 2em;
          }
          @media print {
            .content {
              padding-top: 40px;
              padding-bottom: 40px;
            }
            .footer {
              position: fixed;
              bottom: 0;
              width: 100%;
            }
          }
        </style>
      </head>
      <body>
      
        <div class="content">
          ${marked(markdown)}
        </div>
      
      </body>
    </html>
    `;

    // Use Puppeteer to convert HTML to PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Add padding to the top and bottom of each page
    await page.pdf({
      path: filePath,
      format: "A4",
      margin: {
        top: "40px",
        bottom: "40px",
        left: "60px",
        right: "60px",
      },
    });

    await browser.close();

    const type = "pdf";

    // Upload to S3
    const s3Url = await uploadToS3(filePath, fileName, type);

    // Send response
    res.json({ message: "PDF generated and uploaded", fileUrl: s3Url });
  } catch (error) {
    console.error("Error during PDF generation or upload:", error);
    res.status(500).json({ error: "Error generating or uploading PDF" });
  }
};

export const downloadWord = async (req, res) => {
  ensureTempDirectoryExists();

  const { markdown } = req.body;
  const fileName = `${uuidv4()}.docx`;
  const filePath = path.join(__dirname, "temp", fileName);

  // Convert Markdown to HTML
  const htmlContent = marked(markdown);

  // Generate DOCX from HTML
  const docxBuffer = await htmlToDocx(htmlContent);

  // Write the DOCX file to disk temporarily
  fs.writeFileSync(filePath, docxBuffer);

  const type = "word";

  // Upload to S3
  const s3Url = await uploadToS3(filePath, fileName, type);

  // Send response
  res.json({ message: "DOCX generated and uploaded", fileUrl: s3Url });
};

export const sendMessageToChatGPT = async (req, res) => {
  const { message, userId } = req.body;

  const apiUrl =
    "https://workers-playground-shiny-haze-2f78jjjj.janbolotcode.workers.dev/v1/chat/completions";
  const bearerToken = process.env.OPEN_AI;

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${bearerToken}`,
  };

  try {
    const user = await userModel.findById(userId);
    console.log(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const aiSubscription = user.subscription.find((sub) => sub.title === "ai");
    if (aiSubscription && aiSubscription.quizPoint > 0) {
      // Отправка запроса в GPT-4
      const response = await axios.post(
        apiUrl,
        {
          model: "gpt-4o",
          messages: [{ role: "user", content: message }],
          temperature: 0.7,
        },
        { headers }
      );

      if (response.status === 200) {
        aiSubscription.quizPoint -= 1;
        await user.save();

        let data = response.data?.choices?.[0]?.message?.content;
        if (!data) {
          return res.status(400).json({ message: "Ошибка обработки данных" });
        }

        // Удаляем ```json в начале и ``` в конце, если они есть
        data = data.trim();
        if (data.startsWith("```json")) {
          data = data.substring(7); // Удаляем "```json\n"
        }
        if (data.endsWith("```")) {
          data = data.substring(0, data.length - 3); // Удаляем "```"
        }

        let questions;
        try {
          const parsed = JSON.parse(data.trim());

          if (parsed && parsed.questions) {
            questions = parsed.questions;
          } else {
            throw new Error("Некорректный формат данных");
          }
        } catch (error) {
          return res
            .status(400)
            .json({ message: "Ошибка парсинга JSON", error });
        }

        // Функция для перемешивания ответов
        const shuffleAnswers = (questions) => {
          questions.forEach((question) => {
            if (Array.isArray(question.answers)) {
              question.answers.sort(() => Math.random() - 0.5);
            }
          });
        };

        shuffleAnswers(questions);
        const UserData = new UserDto(user);

        res.json({ questions, UserData });
      } else {
        print("Ошибка запроса к GPT-4");
        res.status(500).json({ message: "Ошибка запроса к GPT-4" });
      }
    } else {
      return res.status(400).json({ message: "Недостаточно quizPoint" });
    }
  } catch (error) {
    console.error("Ошибка:", error);
    res.status(500).json({ message: "Ошибка сервера", error });
  }
};

export const addGptRequestToUser = async (req, res) => {
  try {
    const { userId } = req.body;

    // Находим пользователя по ID
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Ищем подписку с title "ai"
    const aiSubscription = user.subscription.find((sub) => sub.title === "ai");

    if (aiSubscription && aiSubscription.quizPoint > 0) {
      aiSubscription.quizPoint -= 1; // Уменьшаем quizPoint на 1
      await user.save(); // Сохраняем изменения в базе данных
    } else {
      return res.status(400).json({ message: "Недостаточно quizPoint" });
    }
    const UserData = new UserDto(user);

    res.json(UserData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// export const generatePdf = async (req, res) => {
//   try {
//     const doc = new pdfkit();

//     // Устанавливаем заголовок ответа для указания типа содержимого как PDF
//     res.setHeader("Content-Type", "application/pdf");
//     // Устанавливаем заголовок ответа для указания имени файла
//     res.setHeader(
//       "Content-Disposition",
//       'attachment; filename="user_data.pdf"'
//     );

//     // Перенаправляем вывод PDF в ответ HTTP
//     doc.pipe(res);
//     doc.font("fonts/RobotoFlex-Regular.ttf");

//     // Добавляем информацию о пользователе в PDF
//     doc.text(`Жанюолот`);

//     // Добавляем информацию о курсах пользователя в PDF

//     // Завершаем документ и ответ
//     doc.end();
//   } catch (error) {
//     console.error("Error generating PDF:", error);
//     res.status(500).json({ success: false, message: "Error generating PDF" });
//   }
// };
