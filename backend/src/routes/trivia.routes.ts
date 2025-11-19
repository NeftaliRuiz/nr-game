import { Router } from 'express';
import * as triviaController from '../controllers/trivia.controller';

const router = Router();

// Categories
router.get('/categories', triviaController.getCategories);

// Questions
router.get('/questions/category/:category', triviaController.getQuestionsByCategory);
router.get('/questions/random', triviaController.getRandomQuestion);

// Answer validation
router.post('/validate', triviaController.validateAnswer);

// Game sessions
router.post('/sessions', triviaController.createGameSession);
router.get('/sessions/:sessionId', triviaController.getGameSession);
router.put('/sessions/:sessionId/score', triviaController.updateTeamScore);
router.get('/sessions/:sessionId/leaderboard', triviaController.getLeaderboard);
router.post('/sessions/:sessionId/finalize', triviaController.finalizeSession);

export default router;
