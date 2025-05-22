import express from "express";
import cors from "cors";
import router from "./router/index.js";
import aiPromptRouter from "./router/ai-prompt-routes.js";
import speedReadingRouter from "./routes/speed-reading-routes.js";

const app = express();

// Настройка CORS для всех источников
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Конфигурация обработки JSON
app.use(express.json({
  limit: '10mb', 
  strict: true // Строгий парсинг JSON
}));

// Установка заголовков для всех ответов
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Глобальный обработчик ошибок для всех запросов
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  
  // Убедимся, что заголовок установлен правильно
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Отправляем ответ с использованием JSON.stringify для гарантии корректного формата
  res.status(500).send(JSON.stringify({
    success: false,
    message: "Внутренняя ошибка сервера",
    error: err.message
  }));
});

app.use("/api", router);
app.use("/api/prompts", aiPromptRouter);
app.use("/api/speed-reading", speedReadingRouter);

export default app;
