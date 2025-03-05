import jwt from "jsonwebtoken";
import User from "../models/user-model.js"; // Предполагается, что у вас есть такая модель

// Конфигурация JWT
const JWT_SECRET =
  process.env.JWT_SECRET || "alippepro_secure_key_change_in_production";
const TOKEN_EXPIRY = "7d"; // Токен действителен 7 дней

/**
 * Создает JWT токен для пользователя
 * @param {Object} user - Объект пользователя
 * @returns {String} JWT токен
 */
export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      nickname: user.nickname || user.name,
      role: user.role || "user",
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

/**
 * Middleware аутентификации для Socket.io
 * @param {Object} socket - Socket.io сокет
 * @param {Function} next - Следующий middleware
 */
export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    // Проверка наличия токена
    if (!token) {
      return next(new Error("authentication_required"));
    }

    // Верификация токена
    const decoded = jwt.verify(token, JWT_SECRET);

    // Проверка актуальности пользователя в БД
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error("user_not_found"));
    }

    // Прикрепляем информацию о пользователе к сокету
    socket.userId = decoded.userId;
    socket.user = {
      _id: user._id,
      nickname: user.nickname || user.name,
      role: user.role || "user",
    };

    console.log(`Аутентифицирован пользователь: ${socket.user.nickname}`);
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new Error("token_expired"));
    }
    console.error("Ошибка аутентификации:", error.message);
    next(new Error("authentication_failed"));
  }
};

/**
 * Обычный Express middleware для аутентификации
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 * @param {Function} next - Следующая функция middleware
 */
export const expressAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Требуется аутентификация" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Срок действия токена истек" });
    }
    return res.status(401).json({ error: "Ошибка аутентификации" });
  }
};

/**
 * Проверка роли пользователя
 * @param {Array} roles - Массив допустимых ролей
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Требуется аутентификация" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Недостаточно прав" });
    }

    next();
  };
};

/**
 * Рефреш токен
 * @param {Object} req - Express запрос
 * @param {Object} res - Express ответ
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token обязателен" });
    }

    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    const newToken = generateToken(user);
    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ error: "Недействительный refresh token" });
  }
};
