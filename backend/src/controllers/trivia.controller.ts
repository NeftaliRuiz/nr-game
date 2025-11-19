import { Request, Response } from 'express';
import data from '../data/questions.json';

interface Question {
  id: number;
  category: string;
  difficulty: string;
  points: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface GameSession {
  id: string;
  teams: Team[];
  currentQuestionIndex: number;
  usedQuestions: number[];
  createdAt: Date;
  finished?: boolean;
  finishedAt?: Date | null;
}

interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
}

// In-memory storage (for demo purposes - use DB in production)
const gameSessions: Map<string, GameSession> = new Map();

export const getCategories = (req: Request, res: Response) => {
  try {
    res.json({ success: true, categories: data.categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
};

export const getQuestionsByCategory = (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { difficulty, limit } = req.query;

    let questions = data.questions.filter(q => q.category === category);

    if (difficulty) {
      questions = questions.filter(q => q.difficulty === difficulty);
    }

    // Shuffle questions
    questions = questions.sort(() => Math.random() - 0.5);

    if (limit) {
      questions = questions.slice(0, parseInt(limit as string));
    }

    res.json({ success: true, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching questions' });
  }
};

export const getRandomQuestion = (req: Request, res: Response) => {
  try {
    const { category, exclude } = req.query;
    let questions = [...data.questions];

    if (category) {
      questions = questions.filter(q => q.category === category);
    }

    if (exclude) {
      const excludeIds = (exclude as string).split(',').map(id => parseInt(id));
      questions = questions.filter(q => !excludeIds.includes(q.id));
    }

    if (questions.length === 0) {
      return res.status(404).json({ success: false, message: 'No questions available' });
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    const question = questions[randomIndex];

    res.json({ success: true, question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching random question' });
  }
};

export const validateAnswer = (req: Request, res: Response) => {
  try {
    const { questionId, answer, timeRemaining, selectedOption } = req.body;

    const question = data.questions.find(q => q.id === questionId);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Determine correctness: prefer selectedOption (text) if provided, otherwise use index
    let isCorrect = false;
    if (typeof selectedOption === 'string') {
      const correctText = question.options[question.correctAnswer];
      isCorrect = correctText === selectedOption;
    } else if (typeof answer === 'number') {
      isCorrect = question.correctAnswer === answer;
    }

    let points = 0;
    if (isCorrect) {
      // Calculate points based on time remaining (bonus for speed)
      const timeBonus = Math.floor((timeRemaining / question.timeLimit) * 50);
      points = question.points + timeBonus;
    }

    res.json({
      success: true,
      isCorrect,
      points,
      correctAnswer: question.correctAnswer,
      correctAnswerText: question.options[question.correctAnswer],
      reference: (question as any).reference || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error validating answer' });
  }
};

export const createGameSession = (req: Request, res: Response) => {
  try {
    const { teams } = req.body;

    const sessionId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: GameSession = {
      id: sessionId,
      teams: teams.map((team: Team) => ({
        ...team,
        score: 0,
        correctAnswers: 0,
        totalAnswers: 0,
        streak: 0
      })),
      currentQuestionIndex: 0,
      usedQuestions: [],
      createdAt: new Date()
    };

    gameSessions.set(sessionId, session);

    res.json({ success: true, sessionId, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating game session' });
  }
};

export const getGameSession = (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = gameSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching session' });
  }
};

export const updateTeamScore = (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { teamId, points, isCorrect } = req.body;

    const session = gameSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const team = session.teams.find(t => t.id === teamId);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    team.totalAnswers++;

    if (isCorrect) {
      team.correctAnswers++;
      team.streak++;
      
      // Streak bonus: +50 points for every 3 consecutive correct answers
      const streakBonus = Math.floor(team.streak / 3) * 50;
      team.score += points + streakBonus;
    } else {
      team.streak = 0;
    }

    gameSessions.set(sessionId, session);

    res.json({ success: true, team, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating score' });
  }
};

export const getLeaderboard = (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = gameSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const leaderboard = session.teams
      .map(team => ({
        ...team,
        accuracy: team.totalAnswers > 0 
          ? Math.round((team.correctAnswers / team.totalAnswers) * 100) 
          : 0
      }))
      .sort((a, b) => b.score - a.score);

    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
  }
};

export const finalizeSession = (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = gameSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.finished = true;
    session.finishedAt = new Date();
    gameSessions.set(sessionId, session);

    res.json({ success: true, session });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error finalizing session' });
  }
};
