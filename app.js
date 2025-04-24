import express from "express";
import cors from "cors";
import router from "./router/index.js";
import aiPromptRouter from "./routes/ai-prompt-routes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Глобальный обработчик ошибок для всех запросов
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).json({
    success: false,
    message: "Внутренняя ошибка сервера",
    error: err.message
  });
});

app.use("/api", router);
app.use("/api/prompts", aiPromptRouter);

export default app;
