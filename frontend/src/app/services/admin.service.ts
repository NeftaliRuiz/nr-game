import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Question {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correctAnswer: number;
  points: number;
  timeLimit: number;
  eventId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    questions: T[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://10.45.3.141:3000/api/admin';

  constructor(private http: HttpClient) {}

  // ============ Questions Management ============

  /**
   * Get all questions with pagination
   */
  getQuestions(page: number = 1, limit: number = 10): Observable<PaginatedResponse<Question>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<PaginatedResponse<Question>>(`${this.apiUrl}/questions`, { params });
  }

  /**
   * Get a single question by ID
   */
  getQuestionById(id: string): Observable<ApiResponse<Question>> {
    return this.http.get<ApiResponse<Question>>(`${this.apiUrl}/questions/${id}`);
  }

  /**
   * Create a new question
   */
  createQuestion(question: Partial<Question>): Observable<ApiResponse<Question>> {
    return this.http.post<ApiResponse<Question>>(`${this.apiUrl}/questions`, question);
  }

  /**
   * Update an existing question
   */
  updateQuestion(id: string, question: Partial<Question>): Observable<ApiResponse<Question>> {
    return this.http.put<ApiResponse<Question>>(`${this.apiUrl}/questions/${id}`, question);
  }

  /**
   * Delete a question
   */
  deleteQuestion(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/questions/${id}`);
  }

  // ============ Events Management ============

  /**
   * Get all events with pagination
   */
  getEvents(page: number = 1, limit: number = 100): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get(`${this.apiUrl}/events`, { params });
  }

  // ============ Users Management ============

  /**
   * Get all users with pagination
   */
  getUsers(page: number = 1, limit: number = 1000): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get(`${this.apiUrl}/users`, { params });
  }

  /**
   * Get all teams
   */
  getTeams(eventId?: string): Observable<any> {
    const baseUrl = 'http://10.45.3.141:3000/api/teams';
    const url = eventId ? `${baseUrl}?eventId=${eventId}` : baseUrl;
    return this.http.get(url);
  }

  /**
   * Get a single user by ID
   */
  getUserById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  /**
   * Create a new user
   */
  createUser(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, user);
  }

  /**
   * Update an existing user
   */
  updateUser(id: string, user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, user);
  }

  /**
   * Delete a user
   */
  deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  // ============ Teams ============

  /**
   * Create a new team
   */
  createTeam(team: any): Observable<any> {
    const baseUrl = 'http://10.45.3.141:3000/api/teams';
    return this.http.post(baseUrl, team);
  }

  /**
   * Update an existing team
   */
  updateTeam(id: string, team: any): Observable<any> {
    const baseUrl = 'http://10.45.3.141:3000/api/teams';
    return this.http.put(`${baseUrl}/${id}`, team);
  }

  /**
   * Delete a team
   */
  deleteTeam(id: string): Observable<any> {
    const baseUrl = 'http://10.45.3.141:3000/api/teams';
    return this.http.delete(`${baseUrl}/${id}`);
  }

  // ============ Statistics ============

  /**
   * Get admin dashboard statistics
   */
  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics`);
  }
}
