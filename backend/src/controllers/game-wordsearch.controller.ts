import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameMode, GameStatus } from '../entities/Game';
import { GameParticipant } from '../entities/GameParticipant';
import { User } from '../entities/User';
import { emitToGame } from '../socket/game-socket';

const gameRepository = AppDataSource.getRepository(Game);
const participantRepository = AppDataSource.getRepository(GameParticipant);
const userRepository = AppDataSource.getRepository(User);

// In-memory storage for word search game data (tableros por jugador, palabras encontradas, tiempos)
const wordSearchGames: Map<string, {
  words: string[];
  gridSize: number;
  timeLimit: number; // in seconds
  useSharedGrid: boolean; // true = mismo tablero para todos, false = aleatorio
  sharedGrid?: string[][]; // tablero compartido si useSharedGrid = true
  playerBoards: Map<string, { grid: string[][], foundWords: Set<string>, startTime?: number, endTime?: number }>;
  timerInterval?: NodeJS.Timeout; // Server-side timer
  timeRemaining?: number; // Current time remaining
}> = new Map();

/**
 * Generate a unique 6-character room code
 */
function generateRoomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Generate word search grid with hidden words
 */
function generateWordSearchGrid(words: string[], gridSize: number = 15): string[][] {
  const grid: string[][] = Array(gridSize).fill(null).map(() => Array(gridSize).fill(''));
  const directions = [
    { dx: 0, dy: 1 },   // horizontal right
    { dx: 0, dy: -1 },  // horizontal left
    { dx: 1, dy: 0 },   // vertical down
    { dx: -1, dy: 0 },  // vertical up
    { dx: 1, dy: 1 },   // diagonal down-right
    { dx: -1, dy: -1 }, // diagonal up-left
    { dx: 1, dy: -1 },  // diagonal down-left
    { dx: -1, dy: 1 },  // diagonal up-right
  ];

  const placedWords: Array<{ word: string; startX: number; startY: number; direction: { dx: number; dy: number } }> = [];

  // Place each word
  for (const word of words) {
    const upperWord = word.toUpperCase().replace(/\s+/g, '');
    if (upperWord.length === 0 || upperWord.length > gridSize) continue;

    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const direction = directions[Math.floor(Math.random() * directions.length)];
      const startX = Math.floor(Math.random() * gridSize);
      const startY = Math.floor(Math.random() * gridSize);

      // Check if word fits
      let canPlace = true;
      const positions: Array<{ x: number; y: number; letter: string }> = [];
      
      for (let i = 0; i < upperWord.length; i++) {
        const x = startX + direction.dx * i;
        const y = startY + direction.dy * i;

        if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
          canPlace = false;
          break;
        }

        // Check if cell is empty or has the same letter
        if (grid[x][y] !== '' && grid[x][y] !== upperWord[i]) {
          canPlace = false;
          break;
        }

        positions.push({ x, y, letter: upperWord[i] });
      }

      if (canPlace) {
        // Place the word
        positions.forEach(({ x, y, letter }) => {
          grid[x][y] = letter;
        });
        placedWords.push({ word: upperWord, startX, startY, direction });
        placed = true;
      }
    }
  }

  // Fill empty cells with random letters
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === '') {
        grid[i][j] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }

  return grid;
}

/**
 * Create a new Word Search game
 * POST /api/game/wordsearch/create
 */
export async function createWordSearchGame(req: Request, res: Response): Promise<void> {
  try {
    const { name, eventId, words, gridSize = 15, timeLimit = 300, useSharedGrid = true } = req.body;

    if (!words || !Array.isArray(words) || words.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Words array is required and must not be empty',
      });
      return;
    }

    // Validate event if provided
    if (eventId) {
      // Event validation logic here if needed
    }

    // Generate unique room code
    let roomCode: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      roomCode = generateRoomCode();
      const existingGame = await gameRepository.findOne({ where: { roomCode } });
      if (!existingGame) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate unique room code',
      });
      return;
    }

    // Create game in database
    const game = gameRepository.create({
      name: name || 'Word Search Game',
      roomCode: roomCode!,
      mode: GameMode.WORDSEARCH,
      status: GameStatus.WAITING,
      eventId: eventId || null,
      usedQuestionIds: [], // Not used for word search but required
      totalQuestions: words.length, // Store word count
    });

    await gameRepository.save(game);

    // Generate shared grid if useSharedGrid is true
    const normalizedWords = words.map((w: string) => w.toUpperCase().replace(/\s+/g, ''));
    let sharedGrid: string[][] | undefined;
    
    if (useSharedGrid) {
      sharedGrid = generateWordSearchGrid(normalizedWords, gridSize);
    }

    // Store word search game data in memory
    wordSearchGames.set(game.id, {
      words: normalizedWords,
      gridSize,
      timeLimit,
      useSharedGrid,
      sharedGrid,
      playerBoards: new Map(),
    });

    res.status(201).json({
      success: true,
      data: {
        game: {
          id: game.id,
          roomCode: game.roomCode,
          name: game.name,
          mode: game.mode,
          status: game.status,
          words: words,
          gridSize,
          timeLimit,
        },
      },
      message: 'Word Search game created successfully',
    });
  } catch (error) {
    console.error('Create Word Search game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Word Search game',
    });
  }
}

/**
 * Join Word Search game as player
 * POST /api/game/wordsearch/:roomCode/join
 */
export async function joinWordSearchGame(req: Request, res: Response): Promise<void> {
  try {
    const { roomCode } = req.params;
    const { userId } = req.body;

    const game = await gameRepository.findOne({ where: { roomCode: roomCode.toUpperCase() } });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    // Support guest users (non-UUID)
    let user = null;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (typeof userId === 'string' && uuidRegex.test(userId)) {
      user = await userRepository.findOne({ where: { id: userId } });
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }
    }

    // Check if user already joined
    const isGuest = !uuidRegex.test(userId);
    let existingParticipant = null;
    
    if (isGuest) {
      // For guests, check by guestIdentifier
      existingParticipant = await participantRepository.findOne({
        where: { gameId: game.id, guestIdentifier: userId },
      });
    } else {
      // For registered users, check by userId
      existingParticipant = await participantRepository.findOne({
        where: { gameId: game.id, userId },
      });
    }

    if (existingParticipant) {
      // If user already joined, just return their existing participant data
      res.json({
        success: true,
        data: {
          participant: existingParticipant,
          message: 'Ya estás conectado a este juego',
        },
      });
      return;
    }

    // Create participant
    const participant = participantRepository.create({
      userId: isGuest ? null : userId,
      guestIdentifier: isGuest ? userId : null,
      gameId: game.id,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0,
    });

    await participantRepository.save(participant);

    // Generate or use shared grid for this player
    const gameData = wordSearchGames.get(game.id);
    if (gameData) {
      let playerGrid: string[][];
      
      if (gameData.useSharedGrid && gameData.sharedGrid) {
        // Use the shared grid (same for all players)
        playerGrid = gameData.sharedGrid.map(row => [...row]); // Deep copy
      } else {
        // Generate unique grid for this player
        playerGrid = generateWordSearchGrid(gameData.words, gameData.gridSize);
      }
      
      gameData.playerBoards.set(participant.id, {
        grid: playerGrid,
        foundWords: new Set(),
      });
    }

    // Emit player joined event
    emitToGame(game.roomCode, 'participant-joined', {
      gameId: game.id,
      participantId: participant.id,
      userName: user?.name || `Guest ${userId.substring(0, 8)}`,
    });

    res.json({
      success: true,
      data: {
        participant: {
          id: participant.id,
          userId: participant.userId,
          score: participant.score,
        },
        game: {
          id: game.id,
          roomCode: game.roomCode,
          name: game.name,
          status: game.status,
        },
      },
      message: 'Joined game successfully',
    });
  } catch (error) {
    console.error('Join Word Search game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join game',
    });
  }
}

/**
 * Start Word Search game
 * POST /api/game/wordsearch/:roomCode/start
 */
export async function startWordSearchGame(req: Request, res: Response): Promise<void> {
  try {
    const { roomCode } = req.params;

    const game = await gameRepository.findOne({
      where: { roomCode: roomCode.toUpperCase() },
      relations: ['participants'],
    });

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    game.status = GameStatus.IN_PROGRESS;
    game.startedAt = new Date();
    await gameRepository.save(game);

    // Mark start time for all players and start server-side timer
    const gameData = wordSearchGames.get(game.id);
    if (gameData) {
      const now = Date.now();
      gameData.playerBoards.forEach((board) => {
        board.startTime = now;
      });
      
      // Initialize time remaining
      gameData.timeRemaining = gameData.timeLimit;
      
      // Start server-side timer that broadcasts to all clients
      gameData.timerInterval = setInterval(() => {
        if (gameData.timeRemaining && gameData.timeRemaining > 0) {
          gameData.timeRemaining--;
          
          // Broadcast time remaining to all players
          emitToGame(game.roomCode, 'timer-tick', {
            timeRemaining: gameData.timeRemaining,
          });
          
          // Check if time is up
          if (gameData.timeRemaining === 0) {
            // Stop timer
            if (gameData.timerInterval) {
              clearInterval(gameData.timerInterval);
              gameData.timerInterval = undefined;
            }
            
            // End game
            game.status = GameStatus.FINISHED;
            game.finishedAt = new Date();
            gameRepository.save(game);
            
            // Emit game ended
            emitToGame(game.roomCode, 'game-ended', {
              message: '¡Tiempo agotado!',
              timestamp: new Date().toISOString(),
            });
          }
        }
      }, 1000);
    }

    // Emit game started event with grids for each player
    emitToGame(game.roomCode, 'game-started', {
      gameId: game.id,
      startedAt: game.startedAt,
      timeLimit: gameData?.timeLimit || 300,
    });

    res.json({
      success: true,
      data: {
        game: {
          id: game.id,
          roomCode: game.roomCode,
          status: game.status,
          startedAt: game.startedAt,
        },
      },
      message: 'Game started successfully',
    });
  } catch (error) {
    console.error('Start Word Search game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start game',
    });
  }
}

/**
 * Get player's grid
 * GET /api/game/wordsearch/:roomCode/grid/:participantId
 */
export async function getPlayerGrid(req: Request, res: Response): Promise<void> {
  try {
    const { roomCode, participantId } = req.params;

    const game = await gameRepository.findOne({ where: { roomCode: roomCode.toUpperCase() } });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const gameData = wordSearchGames.get(game.id);
    if (!gameData) {
      res.status(404).json({
        success: false,
        message: 'Game data not found',
      });
      return;
    }

    const playerBoard = gameData.playerBoards.get(participantId);
    if (!playerBoard) {
      res.status(404).json({
        success: false,
        message: 'Player board not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        grid: playerBoard.grid,
        words: gameData.words,
        foundWords: Array.from(playerBoard.foundWords),
        timeLimit: gameData.timeLimit,
      },
    });
  } catch (error) {
    console.error('Get player grid error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get player grid',
    });
  }
}

/**
 * Submit found word
 * POST /api/game/wordsearch/:roomCode/submit-word
 */
export async function submitFoundWord(req: Request, res: Response): Promise<void> {
  try {
    const { roomCode } = req.params;
    const { participantId, word } = req.body;

    const game = await gameRepository.findOne({ where: { roomCode: roomCode.toUpperCase() } });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const participant = await participantRepository.findOne({
      where: { id: participantId, gameId: game.id },
      relations: ['user'],
    });

    if (!participant) {
      res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
      return;
    }

    const gameData = wordSearchGames.get(game.id);
    if (!gameData) {
      res.status(404).json({
        success: false,
        message: 'Game data not found',
      });
      return;
    }

    const playerBoard = gameData.playerBoards.get(participantId);
    if (!playerBoard) {
      res.status(404).json({
        success: false,
        message: 'Player board not found',
      });
      return;
    }

    const normalizedWord = word.toUpperCase().replace(/\s+/g, '');
    const isValid = gameData.words.includes(normalizedWord);
    const alreadyFound = playerBoard.foundWords.has(normalizedWord);

    if (isValid && !alreadyFound) {
      playerBoard.foundWords.add(normalizedWord);
      participant.correctAnswers++;
      participant.score += 100; // Base points per word
      
      // Check if player found all words
      if (playerBoard.foundWords.size === gameData.words.length) {
        playerBoard.endTime = Date.now();
        const timeElapsed = Math.floor((playerBoard.endTime - (playerBoard.startTime || 0)) / 1000);
        // Bonus for completion time
        const timeBonus = Math.max(0, gameData.timeLimit - timeElapsed) * 2;
        participant.score += timeBonus;
      }

      await participantRepository.save(participant);

      // Emit word found event
      emitToGame(game.roomCode, 'word-found', {
        gameId: game.id,
        participantId: participant.id,
        userName: participant.user?.name || 'Guest',
        word: normalizedWord,
        foundCount: playerBoard.foundWords.size,
        totalWords: gameData.words.length,
        score: participant.score,
      });

      // Update leaderboard
      const leaderboard = await getLeaderboardData(game.id);
      emitToGame(game.roomCode, 'leaderboard-updated', { leaderboard });

      res.json({
        success: true,
        data: {
          isValid: true,
          word: normalizedWord,
          points: 100,
          participant: {
            id: participant.id,
            score: participant.score,
            foundWordsCount: participant.correctAnswers,
            completionTime: playerBoard.endTime ? Math.floor((playerBoard.endTime - (playerBoard.startTime || 0)) / 1000) : null
          },
          foundWords: Array.from(playerBoard.foundWords),
          allWordsFound: playerBoard.foundWords.size === gameData.words.length,
        },
      });
    } else {
      res.json({
        success: true,
        data: {
          isValid: false,
          alreadyFound,
          foundWords: Array.from(playerBoard.foundWords),
          score: participant.score,
        },
      });
    }
  } catch (error) {
    console.error('Submit found word error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit word',
    });
  }
}

/**
 * Get Word Search game leaderboard
 * GET /api/game/wordsearch/:roomCode/leaderboard
 */
export async function getWordSearchLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const { roomCode } = req.params;

    const game = await gameRepository.findOne({ where: { roomCode: roomCode.toUpperCase() } });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const leaderboard = await getLeaderboardData(game.id);

    res.json({
      success: true,
      data: { leaderboard },
    });
  } catch (error) {
    console.error('Get Word Search leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
    });
  }
}

/**
 * Helper: Get leaderboard data
 */
async function getLeaderboardData(gameId: string): Promise<any[]> {
  const participants = await participantRepository.find({
    where: { gameId },
    relations: ['user'],
    order: { score: 'DESC', correctAnswers: 'DESC' },
  });

  const gameData = wordSearchGames.get(gameId);

  return participants.map((p, index) => {
    const playerBoard = gameData?.playerBoards.get(p.id);
    const timeElapsed = playerBoard?.endTime && playerBoard?.startTime
      ? Math.floor((playerBoard.endTime - playerBoard.startTime) / 1000)
      : null;

    // Get userName from user or guestIdentifier
    let userName = 'Guest';
    if (p.user?.name) {
      userName = p.user.name;
    } else if (p.guestIdentifier) {
      // Extract name from guest identifier (format: guest_NAME_timestamp)
      const parts = p.guestIdentifier.split('_');
      if (parts.length >= 3) {
        // Remove 'guest' prefix and timestamp suffix (last element)
        userName = parts.slice(1, -1).join('_');
      } else if (parts.length === 2) {
        // Old format: guest_timestamp
        userName = `Guest ${parts[1].substring(0, 8)}`;
      }
    } else if (p.userId) {
      userName = `Guest ${p.userId.substring(0, 8)}`;
    }

    return {
      rank: index + 1,
      participantId: p.id,
      userId: p.userId,
      userName: userName,
      score: p.score,
      wordsFound: p.correctAnswers,
      totalWords: gameData?.words.length || 0,
      timeElapsed,
      finished: playerBoard?.foundWords.size === gameData?.words.length,
    };
  });
}

/**
 * Get Word Search game details
 * GET /api/game/wordsearch/:roomCode
 */
export async function getWordSearchGame(req: Request, res: Response): Promise<void> {
  try {
    const { roomCode } = req.params;

    const game = await gameRepository.findOne({
      where: { roomCode: roomCode.toUpperCase() },
      relations: ['participants', 'participants.user'],
    });

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const gameData = wordSearchGames.get(game.id);

    res.json({
      success: true,
      data: {
        game: {
          id: game.id,
          name: game.name,
          mode: game.mode,
          status: game.status,
          roomCode: game.roomCode,
          totalWords: gameData?.words.length || 0,
          words: gameData?.words || [],
          gridSize: gameData?.gridSize || 15,
          timeLimit: gameData?.timeLimit || 300,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
        },
        participants: game.participants.length,
        participantsList: game.participants.map(p => {
          // Get userName from user or use guestIdentifier
          let userName = 'Guest';
          if (p.user?.name) {
            userName = p.user.name;
          } else if (p.guestIdentifier) {
            // Extract name from guest identifier (format: guest_NAME_timestamp)
            const parts = p.guestIdentifier.split('_');
            if (parts.length >= 3) {
              // Remove 'guest' prefix and timestamp suffix
              userName = parts.slice(1, -1).join('_');
            } else if (parts.length === 2) {
              // Old format without name
              userName = `Guest ${parts[1].substring(0, 8)}`;
            }
          }
          
          return {
            id: p.id,
            userName: userName,
            score: p.score,
            foundWordsCount: p.correctAnswers,
            isFinished: false,
          };
        }),
      },
    });
  } catch (error) {
    console.error('Get Word Search game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game',
    });
  }
}

/**
 * Finish word search game manually (admin only)
 */
export async function finishWordSearchGame(req: Request, res: Response): Promise<void> {
  try {
    const { roomCode } = req.params;

    // Find the game
    const game = await gameRepository.findOne({
      where: {
        roomCode: roomCode.toUpperCase(),
      },
      relations: ['participants', 'participants.user'],
    });

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    // Check if game is in progress
    if (game.status !== GameStatus.IN_PROGRESS) {
      res.status(400).json({
        success: false,
        message: 'Game is not in progress',
      });
      return;
    }

    // Update game status
    game.status = GameStatus.FINISHED;
    game.finishedAt = new Date();
    await gameRepository.save(game);

    // Stop server-side timer and update player times
    const gameData = wordSearchGames.get(game.id);
    if (gameData) {
      // Clear server timer
      if (gameData.timerInterval) {
        clearInterval(gameData.timerInterval);
        gameData.timerInterval = undefined;
      }
      
      // Stop player timers
      gameData.playerBoards.forEach((playerData, participantId) => {
        if (playerData.startTime && !playerData.endTime) {
          playerData.endTime = Date.now();
        }
      });
    }

    // Emit game-ended event to all participants
    emitToGame(game.roomCode, 'game-ended', {
      message: 'Juego finalizado por el administrador',
      timestamp: new Date().toISOString(),
      finalStatus: GameStatus.FINISHED,
    });

    res.json({
      success: true,
      message: 'Game finished successfully',
    });
  } catch (error) {
    console.error('Finish Word Search game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finish game',
    });
  }
}
