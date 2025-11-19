import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getStats,
  getTeams,
  getStatistics,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, validatePagination } from '../middleware/validation';

const router = Router();

// Apply authentication and admin check to all routes
router.use(authenticate, requireAdmin);

// ============ USER ROUTES ============

router.get('/users', validatePagination, getUsers);

router.get('/users/:id', getUserById);

router.post(
  '/users',
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
    body('role').optional().isIn(['admin', 'user']),
  ]),
  createUser
);

router.put(
  '/users/:id',
  validate([
    param('id').isInt(),
    body('name').optional().trim().notEmpty(),
    body('role').optional().isIn(['admin', 'user']),
    body('password').optional().isLength({ min: 6 }),
  ]),
  updateUser
);

router.delete(
  '/users/:id',
  validate([param('id').isInt()]),
  deleteUser
);

// ============ QUESTION ROUTES ============

router.get('/questions', validatePagination, getQuestions);

router.get('/questions/:id', getQuestionById);

router.post(
  '/questions',
  validate([
    body('category').trim().notEmpty(),
    body('difficulty').isIn(['easy', 'medium', 'hard']),
    body('question').trim().notEmpty(),
    body('options').isArray({ min: 2, max: 6 }),
    body('options.*').trim().notEmpty(),
    body('correctAnswer').isInt({ min: 0 }),
    body('timeLimit').optional().isInt({ min: 5, max: 300 }),
    body('eventId').optional().isInt(),
  ]),
  createQuestion
);

router.put(
  '/questions/:id',
  validate([
    param('id').isInt(),
    body('category').optional().trim().notEmpty(),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
    body('question').optional().trim().notEmpty(),
    body('options').optional().isArray({ min: 2, max: 6 }),
    body('options.*').optional().trim().notEmpty(),
    body('correctAnswer').optional().isInt({ min: 0 }),
    body('timeLimit').optional().isInt({ min: 5, max: 300 }),
  ]),
  updateQuestion
);

router.delete(
  '/questions/:id',
  validate([param('id').isInt()]),
  deleteQuestion
);

// ============ TEAM ROUTES ============

router.get('/teams', getTeams);

// ============ STATS ROUTES ============

router.get('/stats', getStats);
router.get('/statistics', getStatistics);

export default router;
