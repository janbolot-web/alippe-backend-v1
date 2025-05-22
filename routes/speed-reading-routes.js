import express from 'express';
import { SpeedReadingController } from '../controllers/speed-reading-controller.js';

const router = express.Router();

// Маршрут для получения жанров
router.get('/genres', SpeedReadingController.getGenres);

// Маршрут для принудительного обновления промптов
router.post('/force-update-prompts', SpeedReadingController.forceUpdatePrompts);

// Маршрут для генерации образовательного контента
router.post('/generate-content', SpeedReadingController.generateEducationalContent);

// Маршруты для работы с сессиями
router.post('/sessions', SpeedReadingController.createSession);
router.get('/sessions', SpeedReadingController.getUserSessions);
router.get('/sessions/:sessionId', SpeedReadingController.getSessionById);
router.patch('/sessions/:sessionId/status', SpeedReadingController.updateSessionStatus);
router.post('/sessions/:sessionId/results', SpeedReadingController.addStudentResult);

// Маршруты для таймера
router.post('/sessions/:sessionId/timer/start', SpeedReadingController.startTimer);
router.post('/sessions/:sessionId/timer/stop', SpeedReadingController.stopTimer);
router.get('/sessions/:sessionId/timer', SpeedReadingController.getCurrentTime);

export default router; 