import { Router } from 'express';
import {
  createKahootGame,
  joinKahootGame,
  startKahootGame,
  submitKahootAnswer,
  nextKahootQuestion,
  getKahootLeaderboard,
  getKahootGame,
} from '../controllers/game-kahoot.controller';
import {
  createGeopartyGame,
  joinGeopartyGame,
  startGeopartyGame,
  selectQuestion,
  reserveCell,
  submitGeopartyAnswer,
  getGeopartyLeaderboard,
  getGeopartyGame,
} from '../controllers/game-geoparty.controller';
import {
  createWordSearchGame,
  joinWordSearchGame,
  startWordSearchGame,
  getPlayerGrid,
  submitFoundWord,
  getWordSearchLeaderboard,
  getWordSearchGame,
  finishWordSearchGame,
} from '../controllers/game-wordsearch.controller';
import {
  getActiveGameRooms,
  getGameRoomByCode,
} from '../controllers/game-rooms.controller';

const router = Router();

// ==================== GENERAL GAME ROUTES ====================
/**
 * @route   GET /api/game/rooms
 * @desc    Get all active game rooms (waiting or in_progress)
 * @access  Public
 */
router.get('/rooms', getActiveGameRooms);

/**
 * @route   GET /api/game/rooms/:roomCode
 * @desc    Get game room details by room code
 * @access  Public
 */
router.get('/rooms/:roomCode', getGameRoomByCode);

// ==================== KAHOOT ROUTES (Team-based) ====================
/**
 * @route   POST /api/game/kahoot/create
 * @desc    Create new Kahoot game session
 * @access  Public
 * @body    { name?: string, eventId?: string, totalQuestions?: number }
 */
router.post('/kahoot/create', createKahootGame);

/**
 * @route   POST /api/game/kahoot/:gameId/join
 * @desc    Join Kahoot game as team member
 * @access  Public
 * @body    { userId: string, teamId: string }
 */
router.post('/kahoot/:gameId/join', joinKahootGame);

/**
 * @route   POST /api/game/kahoot/:gameId/start
 * @desc    Start Kahoot game (admin only)
 * @access  Public
 */
router.post('/kahoot/:gameId/start', startKahootGame);

/**
 * @route   POST /api/game/kahoot/:gameId/answer
 * @desc    Submit answer for current question
 * @access  Public
 * @body    { participantId: string, questionId: string, selectedAnswer: number, timeRemaining: number }
 */
router.post('/kahoot/:gameId/answer', submitKahootAnswer);

/**
 * @route   POST /api/game/kahoot/:gameId/next
 * @desc    Load next question (admin only)
 * @access  Public
 */
router.post('/kahoot/:gameId/next', nextKahootQuestion);

/**
 * @route   GET /api/game/kahoot/:gameId/leaderboard
 * @desc    Get current leaderboard
 * @access  Public
 */
router.get('/kahoot/:gameId/leaderboard', getKahootLeaderboard);

/**
 * @route   GET /api/game/kahoot/:gameId
 * @desc    Get game status and details
 * @access  Public
 */
router.get('/kahoot/:gameId', getKahootGame);

// ==================== GEOPARTY ROUTES (Individual) ====================
/**
 * @route   POST /api/game/geoparty/create
 * @desc    Create new Geoparty game session
 * @access  Public
 * @body    { name?: string, eventId?: string, totalQuestions?: number }
 * @response { success: boolean, data: { game: { id: string, roomCode: string, name: string, mode: string, status: string, totalQuestions: number } } }
 */
router.post('/geoparty/create', createGeopartyGame);

/**
 * @route   POST /api/game/geoparty/:roomCode/join
 * @desc    Join Geoparty game as individual player using room code
 * @access  Public
 * @body    { userId: string }
 */
router.post('/geoparty/:roomCode/join', joinGeopartyGame);

/**
 * @route   POST /api/game/geoparty/:roomCode/start
 * @desc    Start Geoparty game
 * @access  Public
 */
router.post('/geoparty/:roomCode/start', startGeopartyGame);

/**
 * @route   POST /api/game/geoparty/:roomCode/select-question
 * @desc    Select question by category (Geoparty-specific)
 * @access  Public
 * @body    { category: string }
 */
router.post('/geoparty/:roomCode/select-question', selectQuestion);

/**
 * Reserve a board cell and get the assigned question (prevents race conditions)
 */
router.post('/geoparty/:roomCode/reserve-cell', reserveCell);

/**
 * @route   POST /api/game/geoparty/:roomCode/answer
 * @desc    Submit answer for selected question
 * @access  Public
 * @body    { participantId: string, questionId: string, selectedAnswer: number, timeRemaining: number }
 */
router.post('/geoparty/:roomCode/answer', submitGeopartyAnswer);

/**
 * @route   GET /api/game/geoparty/:roomCode/leaderboard
 * @desc    Get current leaderboard (individual scores)
 * @access  Public
 */
router.get('/geoparty/:roomCode/leaderboard', getGeopartyLeaderboard);

/**
 * @route   GET /api/game/geoparty/:roomCode
 * @desc    Get game status and details
 * @access  Public
 */
router.get('/geoparty/:roomCode', getGeopartyGame);

// ==================== WORD SEARCH ROUTES ====================
/**
 * @route   POST /api/game/wordsearch/create
 * @desc    Create new Word Search game session
 * @access  Public
 * @body    { name?: string, eventId?: string, words: string[], gridSize?: number, timeLimit?: number }
 */
router.post('/wordsearch/create', createWordSearchGame);

/**
 * @route   POST /api/game/wordsearch/:roomCode/join
 * @desc    Join Word Search game as player
 * @access  Public
 * @body    { userId: string }
 */
router.post('/wordsearch/:roomCode/join', joinWordSearchGame);

/**
 * @route   POST /api/game/wordsearch/:roomCode/start
 * @desc    Start Word Search game
 * @access  Public
 */
router.post('/wordsearch/:roomCode/start', startWordSearchGame);

/**
 * @route   GET /api/game/wordsearch/:roomCode/grid/:participantId
 * @desc    Get player's individual word search grid
 * @access  Public
 */
router.get('/wordsearch/:roomCode/grid/:participantId', getPlayerGrid);

/**
 * @route   POST /api/game/wordsearch/:roomCode/submit-word
 * @desc    Submit found word
 * @access  Public
 * @body    { participantId: string, word: string }
 */
router.post('/wordsearch/:roomCode/submit-word', submitFoundWord);

/**
 * @route   POST /api/game/wordsearch/:roomCode/finish
 * @desc    Finish game manually (admin only)
 * @access  Public
 */
router.post('/wordsearch/:roomCode/finish', finishWordSearchGame);

/**
 * @route   GET /api/game/wordsearch/:roomCode/leaderboard
 * @desc    Get current leaderboard
 * @access  Public
 */
router.get('/wordsearch/:roomCode/leaderboard', getWordSearchLeaderboard);

/**
 * @route   GET /api/game/wordsearch/:roomCode
 * @desc    Get game status and details
 * @access  Public
 */
router.get('/wordsearch/:roomCode', getWordSearchGame);

export default router;
