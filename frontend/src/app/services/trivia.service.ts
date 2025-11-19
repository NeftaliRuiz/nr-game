import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Question, Category, AnswerValidation } from '../models/question.model';
import { Team, GameSession, LeaderboardEntry } from '../models/team.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TriviaService {
  private apiUrl = environment.apiUrl + '/trivia';
  
  // Game state
  private currentSessionSubject = new BehaviorSubject<GameSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();
  
  private currentQuestionSubject = new BehaviorSubject<Question | null>(null);
  public currentQuestion$ = this.currentQuestionSubject.asObservable();
  
  private leaderboardSubject = new BehaviorSubject<LeaderboardEntry[]>([]);
  public leaderboard$ = this.leaderboardSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<{ success: boolean; categories: Category[] }>(`${this.apiUrl}/categories`)
      .pipe(map(response => response.categories));
  }

  // Questions
  getQuestionsByCategory(category: string, difficulty?: string, limit?: number): Observable<Question[]> {
    let url = `${this.apiUrl}/questions/category/${category}`;
    const params: string[] = [];
    
    if (difficulty) params.push(`difficulty=${difficulty}`);
    if (limit) params.push(`limit=${limit}`);
    
    if (params.length > 0) url += `?${params.join('&')}`;
    
    return this.http.get<{ success: boolean; questions: Question[] }>(url)
      .pipe(map(response => response.questions));
  }

  getRandomQuestion(category?: string, excludeIds?: number[]): Observable<Question> {
    let url = `${this.apiUrl}/questions/random`;
    const params: string[] = [];
    
    if (category) params.push(`category=${category}`);
    if (excludeIds && excludeIds.length > 0) params.push(`exclude=${excludeIds.join(',')}`);
    
    if (params.length > 0) url += `?${params.join('&')}`;
    
    return this.http.get<{ success: boolean; question: Question }>(url)
      .pipe(
        map(response => {
          const question = response.question;

          // Shuffle options while preserving which one is correct
          if (question && question.options && question.options.length > 0) {
            const originalCorrect = question.correctAnswer;
            // Create array of indices
            const idx = question.options.map((_, i) => i);
            // Fisher-Yates shuffle
            for (let i = idx.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [idx[i], idx[j]] = [idx[j], idx[i]];
            }
            // Reorder options according to shuffled indices
            const newOptions = idx.map(i => question.options[i]);
            // Find new index of the original correct answer
            const newCorrect = idx.indexOf(originalCorrect);
            question.options = newOptions;
            question.correctAnswer = newCorrect;
          }

          this.currentQuestionSubject.next(question);
          return question;
        })
      );
  }

  // Answer validation
  validateAnswer(questionId: number, answer: number, timeRemaining: number, selectedOption?: string): Observable<AnswerValidation> {
    return this.http.post<AnswerValidation>(`${this.apiUrl}/validate`, {
      questionId,
      answer,
      timeRemaining,
      selectedOption
    });
  }

  // Game session management
  createGameSession(teams: Team[]): Observable<GameSession> {
    return this.http.post<{ success: boolean; sessionId: string; session: GameSession }>(
      `${this.apiUrl}/sessions`,
      { teams }
    ).pipe(
      map(response => {
        this.currentSessionSubject.next(response.session);
        return response.session;
      })
    );
  }

  getGameSession(sessionId: string): Observable<GameSession> {
    return this.http.get<{ success: boolean; session: GameSession }>(
      `${this.apiUrl}/sessions/${sessionId}`
    ).pipe(map(response => response.session));
  }

  updateTeamScore(sessionId: string, teamId: string, points: number, isCorrect: boolean): Observable<GameSession> {
    return this.http.put<{ success: boolean; team: Team; session: GameSession }>(
      `${this.apiUrl}/sessions/${sessionId}/score`,
      { teamId, points, isCorrect }
    ).pipe(
      map(response => {
        this.currentSessionSubject.next(response.session);
        return response.session;
      })
    );
  }

  getLeaderboard(sessionId: string): Observable<LeaderboardEntry[]> {
    return this.http.get<{ success: boolean; leaderboard: LeaderboardEntry[] }>(
      `${this.apiUrl}/sessions/${sessionId}/leaderboard`
    ).pipe(
      map(response => {
        const leaderboard = response.leaderboard.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
        this.leaderboardSubject.next(leaderboard);
        return leaderboard;
      })
    );
  }

  finalizeSession(sessionId: string): Observable<GameSession> {
    return this.http.post<{ success: boolean; session: GameSession }>(
      `${this.apiUrl}/sessions/${sessionId}/finalize`,
      {}
    ).pipe(map(response => response.session));
  }

  // Utility methods
  getCurrentSession(): GameSession | null {
    return this.currentSessionSubject.value;
  }

  getCurrentQuestion(): Question | null {
    return this.currentQuestionSubject.value;
  }

  resetGame(): void {
    this.currentSessionSubject.next(null);
    this.currentQuestionSubject.next(null);
    this.leaderboardSubject.next([]);
  }
}
