import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private userLoadingSubject = new BehaviorSubject<boolean>(true); // Track loading state
  private tokenKey = 'trivia_auth_token';

  public currentUser$ = this.currentUserSubject.asObservable();
  public userLoading$ = this.userLoadingSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    this.loadUserFromToken();
  }

  /**
   * Load user from stored token on app initialization
   */
  private loadUserFromToken(): void {
    const token = this.getToken();
    if (token) {
      this.userLoadingSubject.next(true);
      this.http.get<AuthResponse>(`${this.apiUrl}/profile`).subscribe({
        next: (response) => {
          if (response.success) {
            this.currentUserSubject.next(response.data.user);
          }
          this.userLoadingSubject.next(false);
        },
        error: () => {
          // Token invalid, clear it
          this.logout();
          this.userLoadingSubject.next(false);
        }
      });
    } else {
      // No token, not loading
      this.userLoadingSubject.next(false);
    }
  }

  /**
   * Check if user data is still loading
   */
  isUserLoading(): boolean {
    return this.userLoadingSubject.value;
  }

  /**
   * Register a new user
   */
  register(email: string, password: string, name: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      email,
      password,
      name
    }).pipe(
      tap(response => {
        if (response.success && response.data.token) {
          this.setToken(response.data.token);
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  /**
   * Login with email and password
   */
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.data.token) {
          this.setToken(response.data.token);
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }

  /**
   * Logout current user
   */
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    this.currentUserSubject.next(null);
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    return this.currentUserValue?.role === 'admin';
  }

  /**
   * Get stored JWT token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Store JWT token
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * Get user profile
   */
  getProfile(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/profile`);
  }

  /**
   * Update user profile
   */
  updateProfile(name: string, email: string): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.apiUrl}/profile`, {
      name,
      email
    }).pipe(
      tap(response => {
        if (response.success) {
          this.currentUserSubject.next(response.data.user);
        }
      })
    );
  }
}
