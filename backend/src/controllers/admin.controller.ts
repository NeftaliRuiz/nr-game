import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Question, QuestionDifficulty } from '../entities/Question';
import { Team } from '../entities/Team';
import { Event } from '../entities/Event';
import { Game, GameStatus } from '../entities/Game';
import { hashPassword } from '../utils/bcrypt';

const userRepository = AppDataSource.getRepository(User);
const questionRepository = AppDataSource.getRepository(Question);
const teamRepository = AppDataSource.getRepository(Team);
const eventRepository = AppDataSource.getRepository(Event);
const gameRepository = AppDataSource.getRepository(Game);

// ============ USER MANAGEMENT ============

/**
 * Get all users with pagination
 * GET /api/admin/users
 */
export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const queryBuilder = userRepository.createQueryBuilder('user');

    if (search) {
      queryBuilder.where(
        'user.email LIKE :search OR user.name LIKE :search',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .select(['user.id', 'user.email', 'user.name', 'user.role', 'user.createdAt', 'user.lastLogin'])
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
}

/**
 * Get a single user by ID
 * GET /api/admin/users/:id
 */
export async function getUserById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const user = await userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt', 'lastLogin'],
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
}

/**
 * Create a new user
 * POST /api/admin/users
 */
export async function createUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await userRepository.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const user = userRepository.create({
      email,
      password: hashedPassword,
      name,
      role: role === 'admin' ? UserRole.ADMIN : UserRole.USER,
    });

    await userRepository.save(user);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
}

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id; // UUID string
    const { name, role, password } = req.body;

    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (name) user.name = name;
    if (role) user.role = role;
    if (password) user.password = await hashPassword(password);

    await userRepository.save(user);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
}

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params.id; // UUID string

    // Prevent self-deletion
    if (req.user?.userId === userId) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
      return;
    }

    const result = await userRepository.delete(userId);

    if (result.affected === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
}

// ============ QUESTION MANAGEMENT ============

/**
 * Get all questions with pagination and filters
 * GET /api/admin/questions
 */
export async function getQuestions(req: Request, res: Response): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const difficulty = req.query.difficulty as string;
    const search = req.query.search as string;
    const eventId = req.query.eventId as string;
    const round = req.query.round as string;
    const gameMode = req.query.gameMode as string;

    const queryBuilder = questionRepository.createQueryBuilder('question')
      .leftJoinAndSelect('question.event', 'event');

    if (category) {
      queryBuilder.andWhere('question.category = :category', { category });
    }

    if (difficulty) {
      queryBuilder.andWhere('question.difficulty = :difficulty', { difficulty });
    }

    if (eventId) {
      queryBuilder.andWhere('question.eventId = :eventId', { eventId });
    }

    if (round) {
      queryBuilder.andWhere('question.round = :round', { round: parseInt(round) });
    }

    if (gameMode) {
      queryBuilder.andWhere('question.gameMode = :gameMode', { gameMode });
    }

    if (search) {
      queryBuilder.andWhere('question.question LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [questions, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('question.createdAt', 'DESC')
      .getManyAndCount();

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions',
    });
  }
}

/**
 * Get a single question by ID
 * GET /api/admin/questions/:id
 */
export async function getQuestionById(req: Request, res: Response): Promise<void> {
  try {
    const question = await questionRepository.findOne({
      where: { id: req.params.id }
    });

    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Question not found',
      });
      return;
    }

    res.json({
      success: true,
      data: { question },
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question',
    });
  }
}

/**
 * Create a new question
 * POST /api/admin/questions
 */
export async function createQuestion(req: Request, res: Response): Promise<void> {
  try {
    const {
      category,
      difficulty,
      question: questionText,
      options,
      correctAnswer,
      timeLimit,
      eventId,
    } = req.body;

    const question = questionRepository.create({
      category,
      difficulty,
      question: questionText,
      options,
      correctAnswer,
      timeLimit: timeLimit || 30,
      eventId: eventId || null,
    });

    await questionRepository.save(question);

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: { question },
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question',
    });
  }
}

/**
 * Update question
 * PUT /api/admin/questions/:id
 */
export async function updateQuestion(req: Request, res: Response): Promise<void> {
  try {
    const questionId = req.params.id; // UUID string
    const {
      category,
      difficulty,
      question: questionText,
      options,
      correctAnswer,
      timeLimit,
    } = req.body;

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

    if (category) question.category = category;
    if (difficulty) question.difficulty = difficulty;
    if (questionText) question.question = questionText;
    if (options) question.options = options;
    if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
    if (timeLimit) question.timeLimit = timeLimit;

    await questionRepository.save(question);

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: { question },
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question',
    });
  }
}

/**
 * Delete question
 * DELETE /api/admin/questions/:id
 */
export async function deleteQuestion(req: Request, res: Response): Promise<void> {
  try {
    const questionId = req.params.id; // UUID string

    const result = await questionRepository.delete(questionId);

    if (result.affected === 0) {
      res.status(404).json({
        success: false,
        message: 'Question not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question',
    });
  }
}

// ============ STATISTICS ============

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
export async function getStats(req: Request, res: Response): Promise<void> {
  try {
    const [
      totalUsers,
      totalQuestions,
      totalEvents,
      totalGames,
      activeGames,
    ] = await Promise.all([
      userRepository.count(),
      questionRepository.count(),
      eventRepository.count(),
      gameRepository.count(),
      gameRepository.count({ where: { status: GameStatus.IN_PROGRESS } }),
    ]);

    const recentUsers = await userRepository.find({
      select: ['id', 'name', 'email', 'createdAt'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    const recentGames = await gameRepository.find({
      relations: ['event'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Get questions by category
    const questionsByCategory = await questionRepository
      .createQueryBuilder('question')
      .select('question.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('question.category')
      .getRawMany();

    const categoryMap: { [key: string]: number } = {};
    questionsByCategory.forEach((item: any) => {
      categoryMap[item.category] = parseInt(item.count);
    });

    // Get questions by difficulty
    const questionsByDifficulty = await questionRepository
      .createQueryBuilder('question')
      .select('question.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('question.difficulty')
      .getRawMany();

    const difficultyMap: { easy: number; medium: number; hard: number } = {
      easy: 0,
      medium: 0,
      hard: 0,
    };
    questionsByDifficulty.forEach((item: any) => {
      if (item.difficulty in difficultyMap) {
        difficultyMap[item.difficulty as 'easy' | 'medium' | 'hard'] = parseInt(item.count);
      }
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalQuestions,
          totalEvents,
          totalGames,
          activeGames,
          questionsByCategory: categoryMap,
          questionsByDifficulty: difficultyMap,
        },
        recentUsers,
        recentGames,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
}

// ============ STATISTICS DASHBOARD ============

/**
 * Get dashboard statistics
 * GET /api/admin/statistics
 */
export async function getStatistics(req: Request, res: Response): Promise<void> {
  try {
    // Count totals
    const totalUsers = await userRepository.count();
    const totalQuestions = await questionRepository.count();
    const totalEvents = await eventRepository.count();
    const totalGames = await gameRepository.count();
    const totalTeams = await teamRepository.count();

    // Count active games
    const activeGames = await gameRepository.count({
      where: { status: GameStatus.IN_PROGRESS },
    });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await userRepository.count({
      where: {
        createdAt: AppDataSource.getRepository(User)
          .createQueryBuilder()
          .where('createdAt >= :date', { date: sevenDaysAgo })
          .getQuery() as any,
      },
    });

    // Get recent games (last 7 days)
    const recentGames = await gameRepository.count({
      where: {
        createdAt: AppDataSource.getRepository(Game)
          .createQueryBuilder()
          .where('createdAt >= :date', { date: sevenDaysAgo })
          .getQuery() as any,
      },
    });

    // Questions by difficulty
    const questionsByDifficulty = await questionRepository
      .createQueryBuilder('question')
      .select('question.difficulty', 'difficulty')
      .addSelect('COUNT(*)', 'count')
      .groupBy('question.difficulty')
      .getRawMany();

    // Questions by category (top 5)
    const questionsByCategory = await questionRepository
      .createQueryBuilder('question')
      .select('question.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('question.category')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    // Recent activity - last 10 games
    const recentActivity = await gameRepository.find({
      relations: ['event'],
      order: { createdAt: 'DESC' },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        mode: true,
        createdAt: true,
        event: {
          id: true,
          name: true,
        },
      },
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalQuestions,
          totalEvents,
          totalGames,
          totalTeams,
          activeGames,
        },
        recentActivity: {
          newUsersThisWeek: recentUsers,
          gamesPlayedThisWeek: recentGames,
        },
        charts: {
          questionsByDifficulty: questionsByDifficulty.map((item) => ({
            difficulty: item.difficulty,
            count: parseInt(item.count),
          })),
          questionsByCategory: questionsByCategory.map((item) => ({
            category: item.category,
            count: parseInt(item.count),
          })),
        },
        games: recentActivity,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
    });
  }
}

// ============ TEAM MANAGEMENT ============

/**
 * Get all teams
 * GET /api/admin/teams
 */
export async function getTeams(req: Request, res: Response): Promise<void> {
  try {
    const teams = await teamRepository.find({
      order: { createdAt: 'DESC' },
    });

    res.json({
      success: true,
      data: {
        teams,
      },
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
    });
  }
}
