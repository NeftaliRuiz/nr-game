import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';

interface Question {
  id: string;
  question: string;
  options: string[];
  timeLimit: number;
  category: string;
  difficulty: string;
  points: number;
}

@Component({
  selector: 'app-game-kahoot-player',
  templateUrl: './game-kahoot-player.component.html',
  styleUrls: ['./game-kahoot-player.component.css']
})
export class GameKahootPlayerComponent implements OnInit, OnDestroy {
  // Game connection
  roomCode: string = '';
  userName: string = '';
  participantId: string = '';
  userId: string = '';
  
  // Game phases: 'join' | 'waiting' | 'question' | 'answered' | 'result' | 'leaderboard' | 'finished'
  gamePhase: string = 'join';
  
  // Current question
  currentQuestion: Question | null = null;
  selectedAnswer: number | null = null;
  hasAnswered: boolean = false;
  
  // Answer result
  isCorrect: boolean = false;
  pointsEarned: number = 0;
  correctAnswer: number = -1;
  
  // Timer
  timeRemaining: number = 0;
  timeLimit: number = 20;
  
  // Score
  totalScore: number = 0;
  rank: number = 0;
  
  // UI
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // WebSocket subscriptions
  private subscriptions: Subscription[] = [];
  
  // Kahoot colors
  optionColors = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', icon: '▲', name: 'Rojo' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', icon: '◆', name: 'Azul' },
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', icon: '●', name: 'Amarillo' },
    { bg: 'bg-green-500', hover: 'hover:bg-green-600', icon: '■', name: 'Verde' }
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private gameService: GameService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    // Check for room code in URL
    this.route.params.subscribe(params => {
      if (params['roomCode']) {
        this.roomCode = params['roomCode'].toUpperCase();
      }
    });
    
    // Check for saved session
    const savedSession = localStorage.getItem('kahoot_player_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        this.roomCode = session.roomCode;
        this.userName = session.userName;
        this.userId = session.userId;
        this.participantId = session.participantId;
        this.totalScore = session.totalScore || 0;
        
        // Reconnect to game
        this.reconnectToGame();
      } catch (e) {
        localStorage.removeItem('kahoot_player_session');
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.websocketService.disconnect();
  }

  // ==================== JOIN GAME ====================

  joinGame(): void {
    if (!this.roomCode.trim()) {
      this.errorMessage = 'Ingresa el código PIN';
      return;
    }
    
    if (!this.userName.trim()) {
      this.errorMessage = 'Ingresa tu nombre';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    
    // Generate guest userId
    this.userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    this.gameService.joinKahootGameAsGuest(this.roomCode, {
      userName: this.userName,
      guestId: this.userId
    }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.participantId = response.data.participant.id;
          
          // Save session
          localStorage.setItem('kahoot_player_session', JSON.stringify({
            roomCode: this.roomCode,
            userName: this.userName,
            userId: this.userId,
            participantId: this.participantId,
            totalScore: 0
          }));
          
          this.gamePhase = 'waiting';
          this.connectWebSocket();
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error joining game:', error);
        this.errorMessage = error.error?.message || 'Error al unirse al juego';
        this.isLoading = false;
      }
    });
  }

  reconnectToGame(): void {
    this.gamePhase = 'waiting';
    this.connectWebSocket();
  }

  // ==================== WEBSOCKET ====================

  connectWebSocket(): void {
    this.websocketService.connect(
      this.roomCode,
      this.participantId,
      this.userName,
      'KAHOOT',
      true
    );

    this.subscribeToWebSocketEvents();
  }

  subscribeToWebSocketEvents(): void {
    // Game started
    const startSub = this.websocketService.on('game-started').subscribe(() => {
      console.log('Game started!');
    });
    this.subscriptions.push(startSub);

    // Question changed
    const questionSub = this.websocketService.on('question-changed').subscribe((data: any) => {
      console.log('New question:', data);
      this.currentQuestion = data.question || data;
      this.selectedAnswer = null;
      this.hasAnswered = false;
      this.timeLimit = this.currentQuestion?.timeLimit || 20;
      this.timeRemaining = this.timeLimit;
      this.gamePhase = 'question';
    });
    this.subscriptions.push(questionSub);

    // Timer tick
    const timerSub = this.websocketService.on('timer-tick').subscribe((data: any) => {
      this.timeRemaining = data.timeRemaining;
      
      // Auto-submit if time runs out
      if (this.timeRemaining <= 0 && !this.hasAnswered) {
        this.timeUp();
      }
    });
    this.subscriptions.push(timerSub);

    // Timer expired
    const expiredSub = this.websocketService.on('timer-expired').subscribe(() => {
      if (!this.hasAnswered) {
        this.timeUp();
      }
    });
    this.subscriptions.push(expiredSub);

    // Answer result
    const resultSub = this.websocketService.on('answer-result').subscribe((data: any) => {
      if (data.participantId === this.participantId) {
        this.isCorrect = data.isCorrect;
        this.pointsEarned = data.points;
        this.correctAnswer = data.correctAnswer;
        this.totalScore += data.points;
        this.gamePhase = 'result';
        
        // Update saved session
        this.updateSavedSession();
      }
    });
    this.subscriptions.push(resultSub);

    // Leaderboard updated
    const leaderboardSub = this.websocketService.on('leaderboard-updated').subscribe((data: any) => {
      const leaderboard = data.leaderboard || data;
      const myEntry = leaderboard.find((e: any) => e.participantId === this.participantId);
      if (myEntry) {
        this.rank = myEntry.rank;
        this.totalScore = myEntry.score;
      }
      this.gamePhase = 'leaderboard';
    });
    this.subscriptions.push(leaderboardSub);

    // Game ended
    const endSub = this.websocketService.on('game-ended').subscribe((data: any) => {
      const leaderboard = data.finalLeaderboard || [];
      const myEntry = leaderboard.find((e: any) => e.participantId === this.participantId);
      if (myEntry) {
        this.rank = myEntry.rank;
        this.totalScore = myEntry.score;
      }
      this.gamePhase = 'finished';
      localStorage.removeItem('kahoot_player_session');
    });
    this.subscriptions.push(endSub);
  }

  // ==================== ANSWER SUBMISSION ====================

  selectAnswer(index: number): void {
    if (this.hasAnswered || this.timeRemaining <= 0) return;
    
    this.selectedAnswer = index;
    this.hasAnswered = true;
    this.gamePhase = 'answered';
    
    // Submit answer via API
    this.gameService.submitKahootAnswer(this.roomCode, {
      participantId: this.participantId,
      questionId: this.currentQuestion?.id || '',
      selectedAnswer: index,
      timeRemaining: this.timeRemaining
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.isCorrect = response.data.answer.isCorrect;
          this.pointsEarned = response.data.answer.points;
          this.correctAnswer = response.data.answer.correctAnswer;
          this.totalScore = response.data.participant.score;
          this.gamePhase = 'result';
          
          // Update saved session
          this.updateSavedSession();
        }
      },
      error: (error) => {
        console.error('Error submitting answer:', error);
      }
    });
    
    // Notify via WebSocket
    this.websocketService.submitAnswer(
      this.roomCode,
      this.participantId,
      this.currentQuestion?.id || '',
      index
    );
  }

  timeUp(): void {
    if (!this.hasAnswered) {
      this.hasAnswered = true;
      this.isCorrect = false;
      this.pointsEarned = 0;
      this.gamePhase = 'result';
    }
  }

  // ==================== UTILITIES ====================

  updateSavedSession(): void {
    const session = {
      roomCode: this.roomCode,
      userName: this.userName,
      userId: this.userId,
      participantId: this.participantId,
      totalScore: this.totalScore
    };
    localStorage.setItem('kahoot_player_session', JSON.stringify(session));
  }

  getTimerPercentage(): number {
    return (this.timeRemaining / this.timeLimit) * 100;
  }

  getTimerColor(): string {
    const percentage = this.getTimerPercentage();
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  getRankEmoji(): string {
    if (this.rank === 1) return '🥇';
    if (this.rank === 2) return '🥈';
    if (this.rank === 3) return '🥉';
    return '🎯';
  }

  playAgain(): void {
    localStorage.removeItem('kahoot_player_session');
    this.gamePhase = 'join';
    this.roomCode = '';
    this.userName = '';
    this.participantId = '';
    this.totalScore = 0;
    this.websocketService.disconnect();
  }
}
