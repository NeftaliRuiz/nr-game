import { Router } from 'express';
import {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../controllers/team.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Public routes (read-only)
router.get('/', getTeams);
router.get('/:id', getTeamById);

// Protected routes (admin only)
router.post('/', authenticate, requireAdmin, createTeam);
router.put('/:id', authenticate, requireAdmin, updateTeam);
router.delete('/:id', authenticate, requireAdmin, deleteTeam);

export default router;
