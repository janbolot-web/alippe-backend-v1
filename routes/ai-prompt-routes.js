import express from 'express';
import {
  initializePrompts,
  getAllPrompts,
  getPromptById,
  createPrompt,
  updatePrompt,
  deletePrompt,
  getPromptsByGenreAndLanguage,
  forceUpdatePrompts
} from '../controllers/AIPromptController.js';
import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public routes
router.get('/genre/:genre/language/:language', getPromptsByGenreAndLanguage);
router.get('/initialize', initializePrompts);
router.get('/all', getAllPrompts);

// Admin routes
router.get('/force-update',  forceUpdatePrompts);

// Protected routes (require authentication)
router.get('/', authMiddleware, getAllPrompts);
router.get('/:id', authMiddleware, getPromptById);
router.post('/', authMiddleware, createPrompt);
router.put('/:id', authMiddleware, updatePrompt);
router.delete('/:id', authMiddleware, deletePrompt);

export default router; 