import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService, LeaderboardEntry } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';

interface Team {
  id: string;
  name: string;
}

interface Question {
  id: string;
  question: string;
  options: string[];
  difficulty: string;
  category: string;
  timeLimit: number;
}

@Component({
  selector: 'app-game-kahoot',
  templateUrl: './game-kahoot.component.html',
  styleUrls: ['./game-kahoot.component.css']
})
export class GameKahootComponent implements OnInit, OnDestroy {
  // Game state
  gameId: string = '';
  gamePhase: 'join' | 'waiting' | 'playing' | 'results' = 'join';
  currentQuestion: Question | null = null;
  selectedAnswer: number | null = null;
  hasAnswered: boolean = false;
  answerResult: { isCorrect: boolean; correctAnswer: number } | null = null;

  // Participant info
  participantId: string = '';
  userId: string = '';
  selectedTeamId: string = '';
  isAdmin: boolean = false;

  // Timer
  timeRemaining: number = 0;
  timerProgress: number = 100;
  timerInterval: any;

  // Leaderboard
  leaderboard: LeaderboardEntry[] = [];
  participants: any[] = [];

  // Available teams (mock data - should come from API)
  teams: Team[] = [
    { id: '1', name: 'Team Red' },
    { id: '2', name: 'Team Blue' },
    { id: '3', name: 'Team Green' },
    { id: '4', name: 'Team Yellow' }
  ];

  // Stats
  totalQuestions: number = 0;
  questionsAnswered: number = 0;

  // Loading states
  isLoading: boolean = false;
  loadingMessage: string = '';

  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    public gameService: GameService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    // Get gameId from route params or query params
    this.route.params.subscribe(params => {
      if (params['gameId']) {
        this.gameId = params['gameId'];
        this.loadGameDetails();
      }
    });

    // Generate temporary userId for guests (allow playing without login)
    this.userId = this.generateGuestId();
    
    // Check if user is admin (optional)
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        this.userId = user.id;
        this.isAdmin = user.role === 'ADMIN';
      } catch (e) {
        console.warn('Error parsing currentUser from localStorage', e);
      }
    }
  }

  // Generate a unique guest ID for players without login
  private generateGuestId(): string {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Disconnect WebSocket
    this.websocketService.disconnect();
    
    // Clear timer
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  // ==================== GAME FLOW ====================

  loadGameDetails(): void {
    this.isLoading = true;
    this.gameService.getKahootGame(this.gameId).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalQuestions = response.data.game.totalQuestions;
          this.questionsAnswered = response.data.game.questionsAnswered;
          this.participants = response.data.participantsList;
          
          // If game already started, join directly to playing phase
          if (response.data.game.status === 'IN_PROGRESS') {
            this.gamePhase = 'playing';
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading game details:', error);
        this.isLoading = false;
      }
    });
  }

  joinGame(): void {
    if (!this.userId || !this.selectedTeamId) {
      alert('Por favor selecciona un equipo');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Uniéndose al juego...';

    this.gameService.joinKahootGame(this.gameId, {
      userId: this.userId,
      teamId: this.selectedTeamId
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.participantId = response.data.participant.id;
          this.gamePhase = 'waiting';
          
          // Connect to WebSocket
          this.connectWebSocket();
          
          this.isLoading = false;
          this.loadingMessage = '';
        }
      },
      error: (error) => {
        console.error('Error joining game:', error);
        alert('Error al unirse al juego');
        this.isLoading = false;
        this.loadingMessage = '';
      }
    });
  }

  startGame(): void {
    if (!this.isAdmin) {
      alert('Solo el administrador puede iniciar el juego');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Iniciando juego...';

    this.gameService.startKahootGame(this.gameId).subscribe({
      next: (response) => {
        if (response.success) {
          this.gamePhase = 'playing';
          
          if (response.data.currentQuestion) {
            this.loadQuestion(response.data.currentQuestion);
          }
          
          // Broadcast start via WebSocket
          this.websocketService.startGame(this.gameId);
          
          this.isLoading = false;
          this.loadingMessage = '';
        }
      },
      error: (error) => {
        console.error('Error starting game:', error);
        alert('Error al iniciar el juego');
        this.isLoading = false;
        this.loadingMessage = '';
      }
    });
  }

  loadQuestion(question: any): void {
    this.currentQuestion = question;
    this.hasAnswered = false;
    this.selectedAnswer = null;
    this.answerResult = null;
    this.timeRemaining = question.timeLimit || 30;
    this.timerProgress = 100;
    
    // Start timer
    this.startTimer();
    
    // Broadcast question change via WebSocket
    if (this.isAdmin) {
      this.websocketService.changeQuestion(this.gameId, question);
      this.websocketService.startTimer(this.gameId, this.timeRemaining);
    }
  }

  selectAnswer(optionIndex: number): void {
    if (this.hasAnswered || !this.currentQuestion) {
      return;
    }

    this.selectedAnswer = optionIndex;
  }

  submitAnswer(): void {
    if (this.selectedAnswer === null || !this.currentQuestion || this.hasAnswered) {
      return;
    }

    this.hasAnswered = true;
    this.isLoading = true;

    this.gameService.submitKahootAnswer(this.gameId, {
      participantId: this.participantId,
      questionId: this.currentQuestion.id,
      selectedAnswer: this.selectedAnswer,
      timeRemaining: this.timeRemaining
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.answerResult = {
            isCorrect: response.data.answer.isCorrect,
            correctAnswer: response.data.answer.correctAnswer
          };
          
          // Broadcast answer via WebSocket
          this.websocketService.submitAnswer(
            this.gameId,
            this.participantId,
            this.currentQuestion!.id,
            this.selectedAnswer!
          );
          
          // Update leaderboard after delay
          setTimeout(() => {
            this.loadLeaderboard();
          }, 1000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error submitting answer:', error);
        this.isLoading = false;
      }
    });
  }

  nextQuestion(): void {
    if (!this.isAdmin) {
      alert('Solo el administrador puede avanzar a la siguiente pregunta');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Cargando siguiente pregunta...';

    // Stop current timer
    this.stopTimer();
    this.websocketService.stopTimer(this.gameId);

    this.gameService.nextKahootQuestion(this.gameId).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data.finished) {
            // Game ended
            this.gamePhase = 'results';
            this.websocketService.endGame(this.gameId, this.leaderboard);
          } else if (response.data.currentQuestion) {
            // Load next question
            this.loadQuestion(response.data.currentQuestion);
            this.questionsAnswered = response.data.game.questionsAnswered;
          }
        }
        this.isLoading = false;
        this.loadingMessage = '';
      },
      error: (error) => {
        console.error('Error loading next question:', error);
        this.isLoading = false;
        this.loadingMessage = '';
      }
    });
  }

  loadLeaderboard(): void {
    this.gameService.getKahootLeaderboard(this.gameId).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboard = response.data.leaderboard;
          
          // Broadcast leaderboard update via WebSocket
          if (this.isAdmin) {
            this.websocketService.updateLeaderboard(this.gameId, this.leaderboard);
          }
        }
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      }
    });
  }

  // ==================== TIMER ====================

  startTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.updateTimerProgress();
      } else {
        this.stopTimer();
        
        // Auto-submit if not answered
        if (!this.hasAnswered && this.selectedAnswer !== null) {
          this.submitAnswer();
        }
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerProgress(): void {
    if (this.currentQuestion) {
      const timeLimit = this.currentQuestion.timeLimit || 30;
      this.timerProgress = (this.timeRemaining / timeLimit) * 100;
    }
  }

  getTimerColor(): string {
    if (this.timerProgress > 50) return '#10b981'; // green
    if (this.timerProgress > 25) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }

  // ==================== WEBSOCKET ====================

  connectWebSocket(): void {
    const userName = localStorage.getItem('userName') || 'Player';
    
    this.websocketService.connect(
      this.gameId,
      this.participantId,
      userName,
      'KAHOOT'
    );

    // Subscribe to WebSocket events
    this.subscribeToWebSocketEvents();
  }

  subscribeToWebSocketEvents(): void {
    // Game started
    const gameStartedSub = this.websocketService.on('game-started').subscribe(() => {
      this.gamePhase = 'playing';
    });
    this.subscriptions.push(gameStartedSub);

    // Question changed
    const questionChangedSub = this.websocketService.on('question-changed').subscribe((question: any) => {
      if (!this.isAdmin) {
        this.loadQuestion(question);
      }
    });
    this.subscriptions.push(questionChangedSub);

    // Timer tick
    const timerTickSub = this.websocketService.on('timer-tick').subscribe((data: any) => {
      if (!this.isAdmin) {
        this.timeRemaining = data.timeRemaining;
        this.updateTimerProgress();
      }
    });
    this.subscriptions.push(timerTickSub);

    // Timer expired
    const timerExpiredSub = this.websocketService.on('timer-expired').subscribe(() => {
      this.stopTimer();
    });
    this.subscriptions.push(timerExpiredSub);

    // Answer submitted (by other players)
    const answerSubmittedSub = this.websocketService.on('answer-submitted').subscribe((data: any) => {
      console.log('Answer submitted by participant:', data.participantId);
    });
    this.subscriptions.push(answerSubmittedSub);

    // Leaderboard updated
    const leaderboardUpdatedSub = this.websocketService.on('leaderboard-updated').subscribe((leaderboard: any) => {
      this.leaderboard = leaderboard;
    });
    this.subscriptions.push(leaderboardUpdatedSub);

    // Game ended
    const gameEndedSub = this.websocketService.on('game-ended').subscribe((data: any) => {
      this.gamePhase = 'results';
      this.leaderboard = data.finalLeaderboard || this.leaderboard;
    });
    this.subscriptions.push(gameEndedSub);

    // Participant joined
    const participantJoinedSub = this.websocketService.on('participant-joined').subscribe((data: any) => {
      console.log('Participant joined:', data.userName);
      this.loadGameDetails();
    });
    this.subscriptions.push(participantJoinedSub);

    // Participant left
    const participantLeftSub = this.websocketService.on('participant-left').subscribe((data: any) => {
      console.log('Participant left:', data.userName);
      this.loadGameDetails();
    });
    this.subscriptions.push(participantLeftSub);
  }

  // ==================== UTILITIES ====================

  getOptionClass(index: number): string {
    const baseClasses = 'option-btn p-6 text-lg font-semibold rounded-xl transition-all cursor-pointer ';
    
    if (this.hasAnswered) {
      if (this.answerResult) {
        if (index === this.answerResult.correctAnswer) {
          return baseClasses + 'bg-green-500 text-white border-green-600';
        }
        if (index === this.selectedAnswer && !this.answerResult.isCorrect) {
          return baseClasses + 'bg-red-500 text-white border-red-600';
        }
      }
      return baseClasses + 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    if (this.selectedAnswer === index) {
      return baseClasses + 'bg-blue-500 text-white border-blue-600 scale-105';
    }
    
    return baseClasses + 'bg-white hover:bg-blue-100 border-2 border-gray-300 hover:border-blue-400';
  }

  getDifficultyBadgeClass(): string {
    if (!this.currentQuestion) return 'bg-gray-500';
    return this.gameService.getDifficultyColor(this.currentQuestion.difficulty);
  }

  formatTime(seconds: number): string {
    return this.gameService.formatTime(seconds);
  }

  getRankMedal(rank: number): string {
    return this.gameService.getRankMedal(rank);
  }

  getProgressPercentage(): number {
    if (this.totalQuestions === 0) return 0;
    return (this.questionsAnswered / this.totalQuestions) * 100;
  }

  exitGame(): void {
    if (confirm('¿Estás seguro de que quieres salir del juego?')) {
      this.websocketService.disconnect();
      this.router.navigate(['/dashboard']);
    }
  }
}
