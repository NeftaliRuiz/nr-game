import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Game, GameMode, GameStatus } from '../entities/Game';
import { GameParticipant } from '../entities/GameParticipant';
import { User } from '../entities/User';
import { Team } from '../entities/Team';
import { Question } from '../entities/Question';
import { Answer } from '../entities/Answer';
import { Event } from '../entities/Event';
import * as fs from 'fs';
import * as path from 'path';

// Load fallback questions from JSON
let fallbackQuestions: any[] = [];
try {
  const questionsPath = path.join(__dirname, '../data/kahoot-questions.json');
  const data = fs.readFileSync(questionsPath, 'utf-8');
  const parsed = JSON.parse(data);
  fallbackQuestions = parsed.questions || [];
  console.log(`✅ Loaded ${fallbackQuestions.length} fallback Kahoot questions`);
} catch (error) {
  console.warn('⚠️ Could not load fallback questions:', error);
}

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
 * Helper: Count available questions for a game/event
 */
async function countAvailableQuestions(eventId: string | null): Promise<number> {
  const questionRepository = AppDataSource.getRepository(Question);
  const queryBuilder = questionRepository.createQueryBuilder('question');
  
  if (eventId) {
    queryBuilder.where('question.eventId = :eventId', { eventId });
  }
  
  // Filter by game mode (KAHOOT only) - but allow NULL for backward compatibility
  queryBuilder.andWhere('(question.gameMode = :mode OR question.gameMode IS NULL)', { 
    mode: GameMode.KAHOOT 
  });
  
  return await queryBuilder.getCount();
}

/**
 * Create a new Kahoot game session (Team-based)
 * POST /api/game/kahoot/create
 */
export async function createKahootGame(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const eventRepository = AppDataSource.getRepository(Event);
    
    const { name, eventId, totalQuestions } = req.body;

    // Validate event if provided
    let event = null;
    if (eventId) {
      event = await eventRepository.findOne({ where: { id: eventId } });
      if (!event) {
        res.status(404).json({
          success: false,
          message: 'Event not found',
        });
        return;
      }
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

    // Count available questions for this event
    const availableQuestions = await countAvailableQuestions(eventId || null);
    
    // Use the minimum between requested and available questions
    const effectiveTotalQuestions = Math.min(totalQuestions || 10, availableQuestions);
    
    // Create game
    const game = gameRepository.create({
      roomCode: roomCode!,
      name: name || 'Kahoot Game',
      mode: GameMode.KAHOOT,
      status: GameStatus.WAITING,
      eventId: eventId || null,
      usedQuestionIds: [],
      totalQuestions: effectiveTotalQuestions,
    });

    await gameRepository.save(game);

    res.status(201).json({
      success: true,
      data: {
        game: {
          id: game.id,
          roomCode: game.roomCode,
          name: game.name,
          mode: game.mode,
          status: game.status,
          totalQuestions: game.totalQuestions,
          availableQuestions: availableQuestions,
          requestedQuestions: totalQuestions || 10,
        },
      },
      message: availableQuestions < (totalQuestions || 10) 
        ? `Juego creado con ${effectiveTotalQuestions} preguntas (solo hay ${availableQuestions} disponibles)`
        : 'Kahoot game created successfully',
    });
  } catch (error) {
    console.error('Create Kahoot game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create Kahoot game',
    });
  }
}

/**
 * Join game as a team
 * POST /api/game/kahoot/:gameId/join
 */
export async function joinKahootGame(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const participantRepository = AppDataSource.getRepository(GameParticipant);
    const userRepository = AppDataSource.getRepository(User);
    
    const { gameId } = req.params;
    const { userId, teamId } = req.body;

    const game = await gameRepository.findOne({ 
      where: { roomCode: gameId.toUpperCase() } 
    });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user already joined
    const existingParticipant = await participantRepository.findOne({
      where: { gameId: game.id, userId },
    });

    if (existingParticipant) {
      res.status(400).json({
        success: false,
        message: 'User already joined this game',
      });
      return;
    }

    // Create participant
    const participant = participantRepository.create({
      userId,
      teamId: teamId || null,
      gameId: game.id,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0,
    });

    await participantRepository.save(participant);

    res.json({
      success: true,
      data: {
        participant: {
          id: participant.id,
          userId: participant.userId,
          teamId: participant.teamId,
          score: participant.score,
        },
      },
      message: 'Joined game successfully',
    });
  } catch (error) {
    console.error('Join Kahoot game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join game',
    });
  }
}

/**
 * Start Kahoot game
 * POST /api/game/kahoot/:gameId/start
 */
export async function startKahootGame(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const questionRepository = AppDataSource.getRepository(Question);
    
    const { gameId } = req.params;
    console.log(`🎮 Starting Kahoot game: ${gameId}`);

    const game = await gameRepository.findOne({
      where: { roomCode: gameId.toUpperCase() },
      relations: ['event'],
    });

    if (!game) {
      console.log(`❌ Game not found: ${gameId}`);
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    console.log(`✅ Game found: ${game.id}, eventId: ${game.eventId}`);

    game.status = GameStatus.IN_PROGRESS;
    game.startedAt = new Date();
    await gameRepository.save(game);

    // Get first random question
    const firstQuestion = await getRandomQuestion(game, questionRepository, gameRepository);
    
    console.log(`📝 First question: ${firstQuestion ? firstQuestion.id : 'NONE'}`);
    
    if (!firstQuestion) {
      console.log(`⚠️ No questions available for game ${gameId}`);
    }

    res.json({
      success: true,
      data: {
        game: {
          id: game.id,
          status: game.status,
          startedAt: game.startedAt,
        },
        currentQuestion: firstQuestion,
      },
      message: 'Game started successfully',
    });
  } catch (error) {
    console.error('Start Kahoot game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start game',
    });
  }
}

/**
 * Helper: Get random question for game
 */
async function getRandomQuestion(game: Game, questionRepository: any, gameRepository: any): Promise<any> {
  console.log(`🔍 Getting random question for game ${game.roomCode}`);
  console.log(`   Used questions: ${game.usedQuestionIds?.length || 0}`);
  
  // First, try to get from database
  const queryBuilder = questionRepository.createQueryBuilder('question');

  // Filter by event if specified, otherwise get ALL questions (not just eventId IS NULL)
  if (game.eventId) {
    queryBuilder.where('question.eventId = :eventId', { eventId: game.eventId });
  }
  // Removed: queryBuilder.where('question.eventId IS NULL') - too restrictive

  // Filter by game mode (KAHOOT only) - but allow NULL for backward compatibility
  queryBuilder.andWhere('(question.gameMode = :mode OR question.gameMode IS NULL)', { 
    mode: GameMode.KAHOOT 
  });

  // Exclude already used questions
  if (game.usedQuestionIds && game.usedQuestionIds.length > 0) {
    queryBuilder.andWhere('question.id NOT IN (:...usedIds)', {
      usedIds: game.usedQuestionIds,
    });
  }

  let questions = await queryBuilder.getMany();
  console.log(`   Found ${questions.length} questions in database`);
  
  // No fallback - only use questions from the event/database
  if (questions.length === 0) {
    console.log(`   No questions available - game will end`);
    return null;
  }

  // Pick random question from database
  const randomIndex = Math.floor(Math.random() * questions.length);
  const selectedQuestion = questions[randomIndex];

  // Add to used questions
  game.usedQuestionIds = [...(game.usedQuestionIds || []), selectedQuestion.id];
  await gameRepository.save(game);

  console.log(`   Selected DB question: ${selectedQuestion.id}`);
  return selectedQuestion;
}

/**
 * Submit answer for Kahoot game
 * POST /api/game/kahoot/:gameId/answer
 */
export async function submitKahootAnswer(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const participantRepository = AppDataSource.getRepository(GameParticipant);
    const questionRepository = AppDataSource.getRepository(Question);
    const answerRepository = AppDataSource.getRepository(Answer);
    
    const { gameId } = req.params;
    const { participantId, questionId, selectedAnswer, timeRemaining } = req.body;

    const game = await gameRepository.findOne({ 
      where: { roomCode: gameId.toUpperCase() } 
    });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const participant = await participantRepository.findOne({
      where: { id: participantId, gameId: game.id },
    });

    if (!participant) {
      res.status(404).json({
        success: false,
        message: 'Participant not found',
      });
      return;
    }

    const question = await questionRepository.findOne({
      where: { id: questionId },
    });

    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Question not found',
      });
      return;
    }

    // Check if answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;
    
    // Calculate points (with time bonus)
    let points = 0;
    if (isCorrect) {
      const timeBonus = Math.max(0, (timeRemaining / question.timeLimit) * 50);
      points = question.points + Math.floor(timeBonus);
      
      // Apply streak bonus
      const newStreak = participant.streak + 1;
      if (newStreak % 3 === 0) {
        points += 50; // Streak bonus every 3 correct answers
      }
      participant.streak = newStreak;
    } else {
      participant.streak = 0; // Reset streak on wrong answer
    }

    // Create answer record
    const answer = answerRepository.create({
      participantId: participant.id,
      questionId: question.id,
      selectedAnswer,
      isCorrect,
      points,
      timeRemaining,
    });

    await answerRepository.save(answer);

    // Update participant stats
    participant.score += points;
    participant.totalAnswers++;
    if (isCorrect) {
      participant.correctAnswers++;
    }
    await participantRepository.save(participant);

    const wrongAnswers = participant.totalAnswers - participant.correctAnswers;

    res.json({
      success: true,
      data: {
        answer: {
          isCorrect,
          points,
          correctAnswer: question.correctAnswer,
        },
        participant: {
          score: participant.score,
          correctAnswers: participant.correctAnswers,
          wrongAnswers,
          streak: participant.streak,
        },
      },
    });
  } catch (error) {
    console.error('Submit Kahoot answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answer',
    });
  }
}

/**
 * Get next question in Kahoot game
 * POST /api/game/kahoot/:gameId/next
 */
export async function nextKahootQuestion(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const questionRepository = AppDataSource.getRepository(Question);
    
    const { gameId } = req.params;

    const game = await gameRepository.findOne({ 
      where: { roomCode: gameId.toUpperCase() } 
    });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const usedCount = game.usedQuestionIds?.length || 0;

    // Check if game is finished
    if (usedCount >= game.totalQuestions) {
      game.status = GameStatus.FINISHED;
      game.finishedAt = new Date();
      await gameRepository.save(game);

      res.json({
        success: true,
        data: {
          game: {
            id: game.id,
            status: game.status,
            finishedAt: game.finishedAt,
          },
          finished: true,
        },
        message: 'Game completed',
      });
      return;
    }

    // Get next question
    const nextQuestion = await getRandomQuestion(game, questionRepository, gameRepository);

    if (!nextQuestion) {
      // No more questions available
      game.status = GameStatus.FINISHED;
      game.finishedAt = new Date();
      await gameRepository.save(game);

      res.json({
        success: true,
        data: {
          game: {
            id: game.id,
            status: game.status,
            finishedAt: game.finishedAt,
          },
          finished: true,
        },
        message: 'No more questions available',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        game: {
          id: game.id,
          questionsAnswered: usedCount,
          totalQuestions: game.totalQuestions,
        },
        currentQuestion: nextQuestion,
        finished: false,
      },
    });
  } catch (error) {
    console.error('Next Kahoot question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get next question',
    });
  }
}

/**
 * Get Kahoot game leaderboard
 * GET /api/game/kahoot/:gameId/leaderboard
 */
export async function getKahootLeaderboard(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const participantRepository = AppDataSource.getRepository(GameParticipant);
    
    const { gameId } = req.params;

    const game = await gameRepository.findOne({ 
      where: { roomCode: gameId.toUpperCase() } 
    });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const participants = await participantRepository.find({
      where: { gameId: game.id },
      relations: ['user', 'team'],
      order: { score: 'DESC' },
    });

    const leaderboard = participants.map((p, index) => {
      // Extract userName from guestIdentifier if available
      let userName = p.user?.name || 'Unknown';
      if (!p.user && p.guestIdentifier) {
        const parts = p.guestIdentifier.split('___');
        userName = parts[0] || 'Jugador';
      }
      
      return {
        rank: index + 1,
        participantId: p.id,
        oderId: p.userId,
        userName: userName,
        teamId: p.teamId,
        teamName: p.team?.name || null,
        score: p.score,
        correctAnswers: p.correctAnswers,
        wrongAnswers: p.totalAnswers - p.correctAnswers,
        streak: p.streak,
      };
    });

    res.json({
      success: true,
      data: {
        leaderboard,
      },
    });
  } catch (error) {
    console.error('Get Kahoot leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get leaderboard',
    });
  }
}

/**
 * Get Kahoot game status
 * GET /api/game/kahoot/:gameId
 */
export async function getKahootGame(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const participantRepository = AppDataSource.getRepository(GameParticipant);
    
    const { gameId } = req.params;

    const game = await gameRepository.findOne({
      where: { roomCode: gameId.toUpperCase() },
      relations: ['event'],
    });

    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    const participants = await participantRepository.find({
      where: { gameId: game.id },
      relations: ['user', 'team'],
    });

    const usedCount = game.usedQuestionIds?.length || 0;

    res.json({
      success: true,
      data: {
        game: {
          id: game.id,
          name: game.name,
          mode: game.mode,
          status: game.status,
          questionsAnswered: usedCount,
          totalQuestions: game.totalQuestions,
          startedAt: game.startedAt,
          finishedAt: game.finishedAt,
        },
        participants: participants.length,
        participantsList: participants.map(p => ({
          id: p.id,
          userName: p.user?.name || p.guestIdentifier?.split('_')[0] || 'Jugador',
          teamName: p.team?.name,
          score: p.score,
        })),
      },
    });
  } catch (error) {
    console.error('Get Kahoot game error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game',
    });
  }
}

/**
 * Join Kahoot game as guest (no login required)
 * POST /api/game/kahoot/:gameId/join-guest
 */
export async function joinKahootGameAsGuest(req: Request, res: Response): Promise<void> {
  try {
    const gameRepository = AppDataSource.getRepository(Game);
    const participantRepository = AppDataSource.getRepository(GameParticipant);
    
    const { gameId } = req.params;
    const { userName, guestId } = req.body;

    if (!userName || !guestId) {
      res.status(400).json({
        success: false,
        message: 'userName and guestId are required',
      });
      return;
    }

    const game = await gameRepository.findOne({ 
      where: { roomCode: gameId.toUpperCase() } 
    });
    if (!game) {
      res.status(404).json({
        success: false,
        message: 'Game not found',
      });
      return;
    }

    if (game.status !== GameStatus.WAITING) {
      res.status(400).json({
        success: false,
        message: 'Game has already started',
      });
      return;
    }

    // Check if guest already joined
    const existingParticipant = await participantRepository.findOne({
      where: { gameId: game.id, guestIdentifier: guestId },
    });

    if (existingParticipant) {
      // Return existing participant (reconnection)
      res.json({
        success: true,
        data: {
          participant: {
            id: existingParticipant.id,
            guestId: existingParticipant.guestIdentifier,
            userName: userName,
            score: existingParticipant.score,
          },
        },
        message: 'Reconnected to game',
      });
      return;
    }

    // Create guest participant (store userName in guestIdentifier field as prefix)
    const participant = participantRepository.create({
      guestIdentifier: `${userName}___${guestId}`,
      gameId: game.id,
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0,
    });

    await participantRepository.save(participant);

    res.json({
      success: true,
      data: {
        participant: {
          id: participant.id,
          guestId: guestId,
          userName: userName,
          score: participant.score,
        },
      },
      message: 'Joined game as guest successfully',
    });
  } catch (error) {
    console.error('Join Kahoot game as guest error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join game',
    });
  }
}
