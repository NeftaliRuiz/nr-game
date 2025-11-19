import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * WebSocket Service for Real-time Game Events
 * Manages Socket.IO connection to /game namespace
 */

export interface GameSocketEvents {
  // Connection events
  'participant-joined': { participantId: string; userName: string; totalParticipants: number };
  'participant-left': { participantId: string; userName: string; totalParticipants: number };
  'game-started': { message: string; timestamp: string };
  'game-ended': { message: string; finalLeaderboard: any[]; timestamp: string };

  // Question events
  'question-changed': { question: any; timestamp: string };
  'current-question': any;
  'timer-tick': { timeRemaining: number; timeLimit: number };
  'timer-expired': { message: string };

  // Answer events
  'answer-submitted': { participantId: string; userName: string; questionId: string; timestamp: string };
  'answer-result': { participantId: string; userName: string; isCorrect: boolean; points: number; correctAnswer: number };

  // Leaderboard events
  'leaderboard-updated': { leaderboard: any[]; timestamp: string };

  // Custom events from server
  'cell-reserved': { gameId: string; categoryId: string; rowIndex: number; questionId?: string; reservedBy?: string; teamId?: string };
  'team-score-updated': { gameId: string; teamScores: Array<{ teamId: string; score: number }>; timestamp?: string };

  // Word Search events
  'word-found': { participantId: string; userName: string; word: string; foundWordsCount: number; score: number };

  // Chat events (optional)
  'chat-message': { userName: string; participantId: string; message: string; timestamp: string };
}

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: Socket | null = null;
  private readonly SOCKET_URL = environment.socketUrl;
  private readonly NAMESPACE = '/game';

  // Event subjects for reactive streams
  private eventSubjects = new Map<keyof GameSocketEvents, Subject<any>>();

  // Connection state
  private connected$ = new Subject<boolean>();
  
  constructor() {
    this.initializeEventSubjects();
  }

  /**
   * Initialize event subjects for all socket events
   */
  private initializeEventSubjects(): void {
    const events: (keyof GameSocketEvents)[] = [
      'participant-joined',
      'participant-left',
      'game-started',
      'game-ended',
      'question-changed',
      'current-question',
      'timer-tick',
      'timer-expired',
      'answer-submitted',
      'answer-result',
      'leaderboard-updated',
      'word-found',
      'chat-message',
    ];

    events.forEach(event => {
      this.eventSubjects.set(event, new Subject<any>());
    });
  }

  /**
   * Connect to Socket.IO server and join game room
   */
  connect(gameId: string, participantId: string, userName: string, mode: 'KAHOOT' | 'GEOPARTY' | 'WORDSEARCH' = 'KAHOOT', autoJoin: boolean = true): void {
    if (this.socket?.connected) {
      console.log('⚠️ Already connected to socket');
      return;
    }

    console.log(`🔌 Connecting to ${this.SOCKET_URL}${this.NAMESPACE}...`);

    this.socket = io(`${this.SOCKET_URL}${this.NAMESPACE}`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to game socket:', this.socket?.id);
      this.connected$.next(true);

      // Only join game if autoJoin is true (false for admin)
      if (autoJoin) {
        this.emit('join-game', { gameId, participantId, userName, mode });
      } else {
        console.log('[DEBUG] Admin connected, NOT emitting join-game');
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from socket:', reason);
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.connected$.next(false);
    });

    // Register all game event listeners
    this.registerEventListeners();
  }

  /**
   * Register listeners for all game events
   */
  private registerEventListeners(): void {
    if (!this.socket) return;

    this.eventSubjects.forEach((subject, event) => {
      this.socket!.on(event, (data: any) => {
        console.log(`📥 Received ${event}:`, data);
        subject.next(data);
      });
    });
  }

  /**
   * Disconnect from socket
   */
  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting from socket...');
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data: any): void {
    if (!this.socket?.connected) {
      console.error('❌ Cannot emit: Socket not connected');
      return;
    }

    console.log(`📤 Emitting ${event}:`, data);
    this.socket.emit(event, data);
  }

  /**
   * Listen to a specific event
   */
  on<K extends keyof GameSocketEvents>(event: K): Observable<GameSocketEvents[K]> {
    const subject = this.eventSubjects.get(event);
    if (!subject) {
      console.warn(`⚠️ No subject found for event: ${event}`);
      return new Observable();
    }
    return subject.asObservable();
  }

  /**
   * Get connection state as observable
   */
  onConnectionChange(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // ==================== GAME EVENT EMITTERS ====================

  /**
   * Start game (admin only)
   */
  startGame(gameId: string): void {
    this.emit('start-game', { gameId });
  }

  /**
   * Load new question
   */
  changeQuestion(gameId: string, question: any): void {
    this.emit('question-changed', { gameId, question });
  }

  /**
   * Start question timer
   */
  startTimer(gameId: string, timeLimit: number): void {
    this.emit('start-timer', { gameId, timeLimit });
  }

  /**
   * Stop question timer
   */
  stopTimer(gameId: string): void {
    this.emit('stop-timer', { gameId });
  }

  /**
   * Submit answer
   */
  submitAnswer(gameId: string, participantId: string, questionId: string, selectedAnswer: number): void {
    this.emit('submit-answer', { gameId, participantId, questionId, selectedAnswer });
  }

  /**
   * Broadcast answer result
   */
  broadcastAnswerResult(gameId: string, participantId: string, isCorrect: boolean, points: number, correctAnswer: number): void {
    this.emit('answer-result', { gameId, participantId, isCorrect, points, correctAnswer });
  }

  /**
   * Update leaderboard
   */
  updateLeaderboard(gameId: string, leaderboard: any[]): void {
    this.emit('leaderboard-updated', { gameId, leaderboard });
  }

  /**
   * End game
   */
  endGame(gameId: string, finalLeaderboard: any[]): void {
    this.emit('end-game', { gameId, finalLeaderboard });
  }

  /**
   * Send chat message
   */
  sendChatMessage(gameId: string, message: string): void {
    this.emit('chat-message', { gameId, message });
  }

  /**
   * Join a room by room code (for Word Search and other games)
   */
  joinRoom(roomCode: string): void {
    this.emit('join-room', { roomCode });
  }

  /**
   * Leave a room
   */
  leaveRoom(roomCode: string): void {
    this.emit('leave-room', { roomCode });
  }
}
