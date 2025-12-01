import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Game Service for HTTP API calls
 * Handles Kahoot and Geoparty game modes
 */

// ==================== INTERFACES ====================

export interface CreateGameRequest {
  name?: string;
  eventId?: string;
  totalQuestions?: number;
}

export interface CreateGameResponse {
  success: boolean;
  data: {
    game: {
      id: string;
      roomCode?: string; // 6-character unique room code for joining
      name: string;
      mode: 'KAHOOT' | 'GEOPARTY';
      status: 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
      totalQuestions: number;
    };
  };
  message: string;
}

export interface JoinGameRequest {
  userId: string;
  teamId?: string; // Only for Kahoot
}

export interface JoinGameResponse {
  success: boolean;
  data: {
    participant: {
      id: string;
      userId: string;
      teamId?: string;
      score: number;
    };
  };
  message: string;
}

export interface StartGameResponse {
  success: boolean;
  data: {
    game: {
      id: string;
      status: string;
      startedAt: string;
    };
    currentQuestion?: any;
  };
  message: string;
}

export interface SubmitAnswerRequest {
  participantId: string;
  questionId: string;
  selectedAnswer: number;
  timeRemaining: number;
}

export interface SubmitAnswerResponse {
  success: boolean;
  data: {
    answer: {
      isCorrect: boolean;
      points: number;
      correctAnswer: number;
    };
    participant: {
      score: number;
      correctAnswers: number;
      wrongAnswers: number;
      streak: number;
    };
  };
}

export interface NextQuestionResponse {
  success: boolean;
  data: {
    game: {
      id: string;
      questionsAnswered: number;
      totalQuestions: number;
    };
    currentQuestion?: any;
    finished: boolean;
  };
  message?: string;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  userId: string;
  userName: string;
  teamId?: string;
  teamName?: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  streak: number;
}

export interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
  };
}

export interface GameDetailsResponse {
  success: boolean;
  data: {
    game: {
      id: string;
      name: string;
      mode: string;
      status: string;
      questionsAnswered: number;
      totalQuestions: number;
      startedAt?: string;
      finishedAt?: string;
    };
    participants: number;
    participantsList: Array<{
      id: string;
      userName: string;
      teamName?: string;
      score: number;
    }>;
  };
}

export interface SelectQuestionRequest {
  category: string;
}

export interface SelectQuestionResponse {
  success: boolean;
  data: {
    question: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  // NOTE: backend in this workspace runs on port 3001 (see backend/server logs)
  private readonly API_URL = `${environment.apiUrl}/game`;

  constructor(private http: HttpClient) {}

  // ==================== KAHOOT METHODS ====================

  /**
   * Create a new Kahoot game (Team-based)
   */
  createKahootGame(data: CreateGameRequest): Observable<CreateGameResponse> {
    return this.http.post<CreateGameResponse>(`${this.API_URL}/kahoot/create`, data);
  }

  /**
   * Join Kahoot game as team member
   */
  joinKahootGame(gameId: string, data: JoinGameRequest): Observable<JoinGameResponse> {
    return this.http.post<JoinGameResponse>(`${this.API_URL}/kahoot/${gameId}/join`, data);
  }

  /**
   * Join Kahoot game as guest (no login required)
   */
  joinKahootGameAsGuest(gameId: string, data: { userName: string; guestId: string }): Observable<JoinGameResponse> {
    return this.http.post<JoinGameResponse>(`${this.API_URL}/kahoot/${gameId}/join-guest`, data);
  }

  /**
   * Start Kahoot game (admin only)
   */
  startKahootGame(gameId: string): Observable<StartGameResponse> {
    return this.http.post<StartGameResponse>(`${this.API_URL}/kahoot/${gameId}/start`, {});
  }

  /**
   * Submit answer for current question in Kahoot game
   */
  submitKahootAnswer(gameId: string, data: SubmitAnswerRequest): Observable<SubmitAnswerResponse> {
    return this.http.post<SubmitAnswerResponse>(`${this.API_URL}/kahoot/${gameId}/answer`, data);
  }

  /**
   * Load next question in Kahoot game (admin only)
   */
  nextKahootQuestion(gameId: string): Observable<NextQuestionResponse> {
    return this.http.post<NextQuestionResponse>(`${this.API_URL}/kahoot/${gameId}/next`, {});
  }

  /**
   * Get Kahoot game leaderboard
   */
  getKahootLeaderboard(gameId: string): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.API_URL}/kahoot/${gameId}/leaderboard`);
  }

  /**
   * Get Kahoot game details
   */
  getKahootGame(gameId: string): Observable<GameDetailsResponse> {
    return this.http.get<GameDetailsResponse>(`${this.API_URL}/kahoot/${gameId}`);
  }

  // ==================== EVENTS ====================

  /**
   * Get all available events
   */
  getEvents(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/events`);
  }

  // ==================== GEOPARTY METHODS ====================

  /**
   * Create a new Geoparty game (Individual mode)
   */
  createGeopartyGame(data: CreateGameRequest): Observable<CreateGameResponse> {
    return this.http.post<CreateGameResponse>(`${this.API_URL}/geoparty/create`, data);
  }

  /**
   * Join Geoparty game as individual player
   */
  joinGeopartyGame(gameId: string, userId: string): Observable<JoinGameResponse> {
    return this.http.post<JoinGameResponse>(`${this.API_URL}/geoparty/${gameId}/join`, { userId });
  }

  /**
   * Start Geoparty game
   */
  startGeopartyGame(gameId: string): Observable<StartGameResponse> {
    return this.http.post<StartGameResponse>(`${this.API_URL}/geoparty/${gameId}/start`, {});
  }

  /**
   * Select question by category (Geoparty-specific)
   */
  selectGeopartyQuestion(gameId: string, category: string): Observable<SelectQuestionResponse> {
    return this.http.post<SelectQuestionResponse>(
      `${this.API_URL}/geoparty/${gameId}/select-question`,
      { category }
    );
  }

  /**
   * Reserve a cell (categoryId + rowIndex) and get assigned question
   */
  reserveGeopartyCell(gameId: string, categoryId: string, rowIndex: number, participantId?: string, teamId?: string) {
    return this.http.post<SelectQuestionResponse>(`${this.API_URL}/geoparty/${gameId}/reserve-cell`, {
      categoryId,
      rowIndex,
      participantId,
      teamId,
    });
  }

  /**
   * Submit answer for selected question in Geoparty game
   */
  submitGeopartyAnswer(gameId: string, data: SubmitAnswerRequest): Observable<SubmitAnswerResponse> {
    return this.http.post<SubmitAnswerResponse>(`${this.API_URL}/geoparty/${gameId}/answer`, data);
  }

  /**
   * Get Geoparty game leaderboard (individual scores)
   */
  getGeopartyLeaderboard(gameId: string): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.API_URL}/geoparty/${gameId}/leaderboard`);
  }

  /**
   * Get Geoparty game details
   */
  getGeopartyGame(gameId: string): Observable<GameDetailsResponse> {
    return this.http.get<GameDetailsResponse>(`${this.API_URL}/geoparty/${gameId}`);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Get active game rooms (for monitoring)
   */
  getActiveRooms(): Observable<any> {
    return this.http.get(`${this.API_URL}/rooms`);
  }

  /**
   * Get game room details by room code
   */
  getGameRoom(roomCode: string): Observable<any> {
    return this.http.get(`${this.API_URL}/rooms/${roomCode}`);
  }

  /**
   * Calculate time bonus for scoring
   */
  calculateTimeBonus(timeRemaining: number, timeLimit: number): number {
    return Math.max(0, Math.floor((timeRemaining / timeLimit) * 50));
  }

  /**
   * Calculate streak bonus
   */
  calculateStreakBonus(streak: number): number {
    return Math.floor(streak / 3) * 50;
  }

  /**
   * Get total score with bonuses
   */
  getTotalScore(basePoints: number, timeBonus: number, streakBonus: number): number {
    return basePoints + timeBonus + streakBonus;
  }

  /**
   * Format game time (seconds to MM:SS)
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get difficulty badge color
   */
  getDifficultyColor(difficulty: string): string {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  }

  /**
   * Get category icon (for Geoparty)
   */
  getCategoryIcon(category: string): string {
    const icons: { [key: string]: string } = {
      'Geography': '🌍',
      'Science': '🔬',
      'History': '📜',
      'Sports': '⚽',
      'Entertainment': '🎬',
      'Technology': '💻',
      'Art': '🎨',
      'Music': '🎵',
      'Literature': '📚',
    };
    return icons[category] || '❓';
  }

  /**
   * Get rank medal emoji
   */
  getRankMedal(rank: number): string {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  }

  // ==================== WORD SEARCH METHODS ====================

  /**
   * Create a new Word Search game
   */
  createWordSearchGame(data: {
    name?: string;
    eventId?: string;
    words: string[];
    gridSize?: number;
    timeLimit?: number;
    useSharedGrid?: boolean;
  }): Observable<CreateGameResponse> {
    return this.http.post<CreateGameResponse>(`${this.API_URL}/wordsearch/create`, data);
  }

  /**
   * Join Word Search game as player
   */
  joinWordSearchGame(roomCode: string, userId: string): Observable<JoinGameResponse> {
    return this.http.post<JoinGameResponse>(`${this.API_URL}/wordsearch/${roomCode}/join`, { userId });
  }

  /**
   * Start Word Search game
   */
  startWordSearchGame(roomCode: string): Observable<StartGameResponse> {
    return this.http.post<StartGameResponse>(`${this.API_URL}/wordsearch/${roomCode}/start`, {});
  }
  
  /**
   * Finish word search game manually
   */
  finishWordSearchGame(roomCode: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.API_URL}/wordsearch/${roomCode}/finish`, {});
  }

  /**
   * Get player's individual word search grid
   */
  getPlayerGrid(roomCode: string, participantId: string): Observable<{
    success: boolean;
    data: {
      grid: string[][];
      words: string[];
      foundWords: string[];
    };
  }> {
    return this.http.get<any>(`${this.API_URL}/wordsearch/${roomCode}/grid/${participantId}`);
  }

  /**
   * Submit found word
   */
  submitFoundWord(roomCode: string, participantId: string, word: string): Observable<{
    success: boolean;
    data: {
      isValid: boolean;
      points: number;
      participant: {
        score: number;
        foundWordsCount: number;
        completionTime?: number;
      };
    };
    message: string;
  }> {
    return this.http.post<any>(`${this.API_URL}/wordsearch/${roomCode}/submit-word`, {
      participantId,
      word
    });
  }

  /**
   * Get Word Search leaderboard
   */
  getWordSearchLeaderboard(roomCode: string): Observable<{
    success: boolean;
    data: {
      leaderboard: Array<{
        rank: number;
        participantId: string;
        userName: string;
        score: number;
        foundWordsCount: number;
        completionTime?: number;
        isFinished: boolean;
      }>;
    };
  }> {
    return this.http.get<any>(`${this.API_URL}/wordsearch/${roomCode}/leaderboard`);
  }

  /**
   * Get Word Search game details
   */
  getWordSearchGame(roomCode: string): Observable<{
    success: boolean;
    data: {
      game: {
        id: string;
        roomCode: string;
        name: string;
        mode: string;
        status: string;
        words: string[];
        gridSize: number;
        timeLimit: number;
        startedAt?: string;
      };
      participants: number;
      participantsList: Array<{
        id: string;
        userName: string;
        score: number;
        foundWordsCount: number;
        isFinished: boolean;
      }>;
    };
  }> {
    return this.http.get<any>(`${this.API_URL}/wordsearch/${roomCode}`);
  }
}
