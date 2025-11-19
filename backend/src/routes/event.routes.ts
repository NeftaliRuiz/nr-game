import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  addTeamToEvent,
  getEventTeams,
  getEventQuestions,
} from '../controllers/event.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate, validatePagination } from '../middleware/validation';

const router = Router();

// Public routes (read-only)
router.get('/', validatePagination, getEvents);
router.get('/:id', validate([param('id').isInt()]), getEventById);
router.get('/:id/teams', validate([param('id').isInt()]), getEventTeams);
router.get('/:id/questions', validate([param('id').isInt()]), getEventQuestions);

// Admin routes (create, update, delete)
router.post(
  '/',
  authenticate,
  requireAdmin,
  validate([
    body('name').trim().notEmpty(),
    body('description').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
  ]),
  createEvent
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  validate([
    param('id').isInt(),
    body('name').optional().trim().notEmpty(),
    body('description').optional().trim(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('status').optional().isIn(['upcoming', 'active', 'completed']),
  ]),
  updateEvent
);

router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  validate([param('id').isInt()]),
  deleteEvent
);

router.post(
  '/:id/teams',
  authenticate,
  requireAdmin,
  validate([
    param('id').isInt(),
    body('name').trim().notEmpty(),
  ]),
  addTeamToEvent
);

export default router;
