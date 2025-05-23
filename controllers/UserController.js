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
import { chromium } from "playwright";
import aiResponses from "../models/aiResponses.js";
import quizResponses from "../models/quizResponses.js";
import mongoose from "mongoose";

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
      // isDataUser: false,
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
    console.log("token", req.query.token);

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
    console.log("id", req.query.userId);
    const user = await userModel.findById(req.query.userId).populate("courses");

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    const UserData = new UserDto(user);

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
    console.log("message", message);

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const aiSubscription = user.subscription.find((sub) => sub.title === "ai");
    if (!aiSubscription || aiSubscription.planPoint <= 0) {
      return res.status(403).json({ message: "Недостаточно AI-токенов" });
    }

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

    const response = await axios.post(
      "https://workers-playground-shiny-haze-2f78jjjj.janbolotcode.workers.dev/v1/chat/completions",
      prompt,
      config
    );

    // Создаем новый документ AiResponses
    const newAiResponse = new aiResponses({
      choices: response.data.choices,
      created: response.data.created,
      id: response.data.id,
      model: response.data.model,
      prompt_filter_results: response.data.prompt_filter_results,
      system_fingerprint: response.data.system_fingerprint,
      usage: response.data.usage,
    });

    // Сохраняем ответ AI
    const savedResponse = await newAiResponse.save();

    // Уменьшаем количество токенов
    aiSubscription.planPoint -= 1;

    // Добавляем ID сохраненного ответа в массив пользователя
    user.aiResponses.push(savedResponse._id);

    await user.save();

    const UserData = new UserDto(user);

    res.json({
      response: response.data.choices[0].message.content,
      userData: UserData,
      statusCode: response.status,
    });
  } catch (error) {
    console.error("Error in fetchChatgpt:", error);
    res.status(500).json({
      message: "Произошла ошибка при обработке запроса",
      error: error.message,
    });
  }
};

// Check subscription endpoint
export const checkSubscription = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      console.log("Пользователь не найден");
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const aiSubscription = user.subscription.find((sub) => sub.title === "ai");
    const hasValidSubscription = aiSubscription && aiSubscription.planPoint > 0;

    res.json({ hasValidSubscription });
  } catch (error) {
    res.status(500).json({
      message: "Произошла ошибка при проверке подписки",
      error: error.message,
    });
  }
};

// Save response endpoint
export const saveAiResponse = async (req, res) => {
  try {
    const { userId, response, product } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const aiSubscription = user.subscription.find((sub) => sub.title === product);

    // Create new AI response document
    const newAiResponse = new aiResponses({
      choices: response.choices,
      created: response.created,
      id: response.id,
      model: response.model,
      prompt_filter_results: response.prompt_filter_results,
      system_fingerprint: response.system_fingerprint,
      usage: response.usage,
    });

    // Save response and update user
    const savedResponse = await newAiResponse.save();

    // Decrease token count
    aiSubscription.planPoint -= 1;

    // Add response ID to user's responses
    user.aiResponses.push(savedResponse._id);

    await user.save();

    const UserData = new UserDto(user);

    res.json({ userData: UserData });
  } catch (error) {
    res.status(500).json({
      message: "Произошла ошибка при сохранении ответа",
      error: error.message,
    });
  }
};

// Save response endpoint
export const saveAiQuiz = async (req, res) => {
  try {
    const { userId, response, product } = req.body;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const aiSubscription = user.subscription.find((sub) => sub.title === product);

    // Create new AI response document
    const newQuizResponse = new quizResponses({
      choices: response.choices,
      created: response.created,
      id: response.id,
      model: response.model,
      prompt_filter_results: response.prompt_filter_results,
      system_fingerprint: response.system_fingerprint,
      usage: response.usage,
    });

    // Save response and update user
    const savedResponse = await newQuizResponse.save();

    // Decrease token count
    aiSubscription.quizPoint -= 1;

    // Add response ID to user's responses
    user.quizResponses.push(savedResponse._id);

    await user.save();

    const UserData = new UserDto(user);

    res.json({ userData: UserData });
  } catch (error) {
    res.status(500).json({
      message: "Произошла ошибка при сохранении ответа",
      error: error.message,
    });
  }
};

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Ensure these are set in your environment
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  // region: process.env.AWS_REGION, // e.g. "us-east-1"
});

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Функция для загрузки файла в S3 и последующего удаления
const uploadToS3 = async (filePath, fileName, type) => {
  const fileContent = fs.readFileSync(filePath);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `files/${fileName}`,
    Body: fileContent,
    ContentType:
      type === "pdf"
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };

  try {
    const data = await s3.upload(params).promise();
    console.log("File uploaded successfully:", data.Location);

    // Удаляем локальный файл после успешной загрузки
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file:", err);
      else console.log(`Temporary file ${filePath} deleted`);
    });

    return data.Location;
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

    // Launch Playwright browser
    const browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(htmlContent);

    // Generate PDF
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
    console.error("Ошибка во время генерации PDF:", error.message);
    console.error(error.stack); // Полный стек ошибки
    res.status(500).json({ error: "Ошибка генерации или загрузки PDF" });
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
        console.log("ready ", response);
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

// Получение пользователей с пагинацией, поиском и сортировкой
export const getAdminUsersList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "createdAt",
      sortOrder = -1,
    } = req.query;

    // Построение условия поиска
    const searchCondition = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    // Опции сортировки
    const sortOptions = {};
    sortOptions[sortBy] = parseInt(sortOrder);

    // Получение данных с пагинацией
    const users = await userModel
      .find(searchCondition)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Получаем общее количество пользователей по запросу
    const totalUsers = await userModel.countDocuments(searchCondition);

    res.json({
      users,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: parseInt(page),
      totalUsers,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Ошибка при получении списка пользователей" });
  }
};

export const grantAiAccess = async (req, res) => {
  try {
    const { userId, planPoint, quizPoint, speedReadingPoint, expiresInDays } =
      req.body;


    // Проверка наличия userId
    if (!userId || userId === "") {
      return res
        .status(400)
        .json({ message: "ID пользователя не указан или пустой" });
    }

    // Проверка валидности ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Недопустимый формат ID пользователя" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Ищем подписку с title "ai" или создаем новую
    const planSubscriptionIndex = user.subscription.findIndex(
      (sub) => sub.title === "plan"
    );
    const quizSubscriptionIndex = user.subscription.findIndex(
      (sub) => sub.title === "quiz"
    ); const speedReadingSubscriptionIndex = user.subscription.findIndex(
      (sub) => sub.title === "speedReading"
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    if (planSubscriptionIndex !== -1) {
      // Обновляем существующую подписку
      // Получаем текущие значения planPoint и quizPoint или используем 0, если они не существуют
      console.log('planSubscriptionIndex');

      const currentPlanPoint =
        user.subscription[planSubscriptionIndex].planPoint || 0;

      user.subscription[planSubscriptionIndex] = {
        ...user.subscription[planSubscriptionIndex],
        title: "plan",
        isActive: true,
        planPoint: currentPlanPoint + parseInt(planPoint), // Добавляем к существующему значению
        expiresAt,
      };
    } else {
      user.subscription.push({
        title: "plan",
        isActive: true,
        planPoint: parseInt(planPoint),
        expiresAt,
      });

    }

    if (quizSubscriptionIndex !== -1) {
      console.log('quizSubscriptionIndex');
      const currentQuizPoint =
        user.subscription[quizSubscriptionIndex].quizPoint || 0;

      user.subscription[quizSubscriptionIndex] = {
        ...user.subscription[quizSubscriptionIndex],
        title: "quiz",
        isActive: true,
        quizPoint: currentQuizPoint + parseInt(quizPoint), // Добавляем к существующему значению
        expiresAt,
      };
    } else {
      user.subscription.push({
        title: "quiz",
        isActive: true,
        quizPoint: parseInt(quizPoint),
        expiresAt,
      });
    }

    if (speedReadingSubscriptionIndex !== -1) {
      const currentSpeedReadingPoint =
        user.subscription[speedReadingSubscriptionIndex].speedReadingPoint || 0;

      console.log('speedReadingPoint', speedReadingPoint, currentSpeedReadingPoint);
      user.subscription[speedReadingSubscriptionIndex] = {
        ...user.subscription[speedReadingSubscriptionIndex],
        title: "speedReading",
        isActive: true,
        speedReadingPoint: currentSpeedReadingPoint + parseInt(speedReadingPoint), // Добавляем к существующему значению
        expiresAt,
      };
    } else {
      // Создаем новую подписк
      user.subscription.push({
        title: "speedReading",
        isActive: true,
        speedReadingPoint: parseInt(speedReadingPoint),
        expiresAt,
      });
    }

    await user.save();

    const UserData = new UserDto(user);

    res.json({
      success: true,
      message: "Доступ к ИИ успешно предоставлен",
      user: UserData,
    });
  } catch (error) {
    console.error("Error granting AI access:", error);
    res.status(500).json({
      message: "Ошибка при предоставлении доступа к ИИ",
      error: error.message,
    });
  }
};

// Получение пользователей с AI-подписками
export const getUsersWithAiSubscription = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = -1,
      search = "",
    } = req.query;

    // 🔍 Ищем хотя бы одну активную подписку
    const subscriptionFilter = {
      subscription: {
        $elemMatch: {
          isActive: true,
          title: { $in: ["plan", "quiz", "speedReading"] },
        },
      },
    };

    // 🔍 Условие поиска по имени, email или телефону
    const searchCondition = search
      ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phoneNumber: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    const query = search
      ? { $and: [subscriptionFilter, searchCondition] }
      : subscriptionFilter;

    const sortOptions = {};
    sortOptions[sortBy] = parseInt(sortOrder);

    const users = await userModel
      .find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalUsers = await userModel.countDocuments(query);

    const userDtos = users.map((user) => new UserDto(user));

    res.json({
      users: userDtos,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: parseInt(page),
      totalUsers,
    });
  } catch (error) {
    console.error("Error fetching users with AI subscription:", error);
    res.status(500).json({
      message: "Ошибка при получении пользователей с подписками AI",
      error: error.message,
    });
  }
};


// Получение общей статистики использования AI
export const getAiUsageStatistics = async (req, res) => {
  try {
    // Статистика по времени (по часам)
    const hourlyStats = await aiResponses.aggregate([
      {
        $addFields: {
          createdDate: {
            $cond: {
              if: { $isNumber: "$created" },
              then: { $toDate: { $multiply: ["$created", 1000] } }, // Умножаем на 1000, если это Unix timestamp в секундах
              else: "$created", // Если поле уже дата, оставляем как есть
            },
          },
        },
      },
      {
        $addFields: {
          hour: { $hour: "$createdDate" },
          day: { $dayOfMonth: "$createdDate" },
          month: { $month: "$createdDate" },
          year: { $year: "$createdDate" },
        },
      },
      {
        $group: {
          _id: { hour: "$hour", day: "$day", month: "$month", year: "$year" },
          count: { $sum: 1 },
          totalTokens: { $sum: "$usage.total_tokens" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ]);

    // Статистика по дням
    const dailyStats = await aiResponses.aggregate([
      {
        $addFields: {
          createdDate: {
            $cond: {
              if: { $isNumber: "$created" },
              then: { $toDate: { $multiply: ["$created", 1000] } },
              else: "$created",
            },
          },
        },
      },
      {
        $addFields: {
          day: { $dayOfMonth: "$createdDate" },
          month: { $month: "$createdDate" },
          year: { $year: "$createdDate" },
        },
      },
      {
        $group: {
          _id: { day: "$day", month: "$month", year: "$year" },
          count: { $sum: 1 },
          totalTokens: { $sum: "$usage.total_tokens" },
          promptTokens: { $sum: "$usage.prompt_tokens" },
          completionTokens: { $sum: "$usage.completion_tokens" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Общая статистика по пользователям
    const userStats = await userModel.aggregate([
      { $unwind: "$aiResponses" },
      {
        $lookup: {
          from: "airesponses",
          localField: "aiResponses",
          foreignField: "_id",
          as: "responseData",
        },
      },
      { $unwind: "$responseData" },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$name" },
          email: { $first: "$email" },
          phoneNumber: { $first: "$phoneNumber" },
          totalRequests: { $sum: 1 },
          totalTokens: { $sum: "$responseData.usage.total_tokens" },
          promptTokens: { $sum: "$responseData.usage.prompt_tokens" },
          completionTokens: { $sum: "$responseData.usage.completion_tokens" },
        },
      },
      { $sort: { totalRequests: -1 } },
    ]);

    // Статистика по типам (Plan/Quiz)
    const typeStats = await Promise.all([
      // Plan stats
      aiResponses.countDocuments(),
      aiResponses.aggregate([
        {
          $group: {
            _id: null,
            totalTokens: { $sum: "$usage.total_tokens" },
            promptTokens: { $sum: "$usage.prompt_tokens" },
            completionTokens: { $sum: "$usage.completion_tokens" },
          },
        },
      ]),

      // Quiz stats
      quizResponses.countDocuments(),
      quizResponses.aggregate([
        {
          $group: {
            _id: null,
            totalTokens: { $sum: "$usage.total_tokens" },
            promptTokens: { $sum: "$usage.prompt_tokens" },
            completionTokens: { $sum: "$usage.completion_tokens" },
          },
        },
      ]),
    ]);
    // Расчет стоимости (по тарифам OpenAI для GPT-4o)

    // Расчет стоимости (по тарифам OpenAI для GPT-4o)
    const INPUT_COST_PER_1K = 0.01; // $0.01 за 1K токенов ввода
    const OUTPUT_COST_PER_1K = 0.03; // $0.03 за 1K токенов вывода

    // Для Plan
    const planPromptTokens = typeStats[1][0]?.promptTokens || 0;
    const planCompletionTokens = typeStats[1][0]?.completionTokens || 0;
    const totalPlanCost = (
      (planPromptTokens / 1000) * INPUT_COST_PER_1K +
      (planCompletionTokens / 1000) * OUTPUT_COST_PER_1K
    ).toFixed(2);

    // Для Quiz
    const quizPromptTokens = typeStats[3][0]?.promptTokens || 0;
    const quizCompletionTokens = typeStats[3][0]?.completionTokens || 0;
    const totalQuizCost = (
      (quizPromptTokens / 1000) * INPUT_COST_PER_1K +
      (quizCompletionTokens / 1000) * OUTPUT_COST_PER_1K
    ).toFixed(2);

    const responseData = {
      hourlyStats,
      dailyStats,
      userStats,
      planStats: {
        totalRequests: typeStats[0],
        totalTokens: typeStats[1][0]?.totalTokens || 0,
        estimatedCost: totalPlanCost,
      },
      quizStats: {
        totalRequests: typeStats[2],
        totalTokens: typeStats[3][0]?.totalTokens || 0,
        estimatedCost: totalQuizCost,
      },
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error getting AI usage statistics:", error);
    res.status(500).json({
      message: "Ошибка при получении статистики использования AI",
      error: error.message,
    });
  }
};

// Получение детальной статистики по конкретному пользователю
export const getUserAiStatistics = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Недопустимый формат ID пользователя" });
    }

    const user = await userModel
      .findById(userId)
      .populate("aiResponses")
      .populate("quizResponses");

    if (!user) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    // Статистика по времени для этого пользователя
    const hourlyStats = await aiResponses.aggregate([
      { $match: { _id: { $in: user.aiResponses } } },
      {
        $addFields: {
          createdDate: {
            $cond: {
              if: { $isNumber: "$created" },
              then: { $toDate: { $multiply: ["$created", 1000] } },
              else: "$created",
            },
          },
        },
      },
      {
        $addFields: {
          hour: { $hour: "$createdDate" },
          day: { $dayOfMonth: "$createdDate" },
          month: { $month: "$createdDate" },
          year: { $year: "$createdDate" },
        },
      },
      {
        $group: {
          _id: { hour: "$hour", day: "$day", month: "$month", year: "$year" },
          count: { $sum: 1 },
          totalTokens: { $sum: "$usage.total_tokens" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
    ]);

    // Подробная информация о запросах
    const planRequests = user.aiResponses.map((resp) => ({
      id: resp._id,
      timestamp: resp.created,
      promptTokens: resp.usage?.prompt_tokens || 0,
      completionTokens: resp.usage?.completion_tokens || 0,
      totalTokens: resp.usage?.total_tokens || 0,
      model: resp.model,
      estimatedCost: (
        ((resp.usage?.prompt_tokens || 0) / 1000) * 0.01 +
        ((resp.usage?.completion_tokens || 0) / 1000) * 0.03
      ).toFixed(4),
    }));

    const quizRequests = user.quizResponses.map((resp) => ({
      id: resp._id,
      timestamp: resp.created,
      promptTokens: resp.usage?.prompt_tokens || 0,
      completionTokens: resp.usage?.completion_tokens || 0,
      totalTokens: resp.usage?.total_tokens || 0,
      model: resp.model,
      estimatedCost: (
        ((resp.usage?.prompt_tokens || 0) / 1000) * 0.01 +
        ((resp.usage?.completion_tokens || 0) / 1000) * 0.03
      ).toFixed(4),
    }));

    // Общая статистика
    const planTotalTokens = planRequests.reduce(
      (sum, req) => sum + req.totalTokens,
      0
    );
    const quizTotalTokens = quizRequests.reduce(
      (sum, req) => sum + req.totalTokens,
      0
    );

    const planTotalCost = planRequests
      .reduce((sum, req) => sum + parseFloat(req.estimatedCost), 0)
      .toFixed(2);
    const quizTotalCost = quizRequests
      .reduce((sum, req) => sum + parseFloat(req.estimatedCost), 0)
      .toFixed(2);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      hourlyStats,
      planStats: {
        totalRequests: planRequests.length,
        totalTokens: planTotalTokens,
        estimatedCost: planTotalCost,
        requests: planRequests,
      },
      quizStats: {
        totalRequests: quizRequests.length,
        totalTokens: quizTotalTokens,
        estimatedCost: quizTotalCost,
        requests: quizRequests,
      },
    });
  } catch (error) {
    console.error("Error getting user AI statistics:", error);
    res.status(500).json({
      message:
        "Ошибка при получении статистики использования AI для пользователя",
      error: error.message,
    });
  }
};
