import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService, LeaderboardEntry } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
  category: string;
  timeLimit: number;
  points: number;
}

interface Participant {
  id: string;
  userName: string;
  score: number;
  hasAnswered: boolean;
}

@Component({
  selector: 'app-game-kahoot-host',
  templateUrl: './game-kahoot-host.component.html',
  styleUrls: ['./game-kahoot-host.component.css']
})
export class GameKahootHostComponent implements OnInit, OnDestroy {
  // Game configuration
  gameId: string = '';
  roomCode: string = '';
  gameName: string = 'Trivia Kahoot';
  totalQuestions: number = 10;
  
  // Game phases: 'setup' | 'lobby' | 'countdown' | 'question' | 'answer-reveal' | 'leaderboard' | 'final-results'
  gamePhase: string = 'setup';
  
  // Current question data
  currentQuestion: Question | null = null;
  questionNumber: number = 0;
  
  // Timer
  timeRemaining: number = 0;
  timeLimit: number = 20;
  timerProgress: number = 100;
  timerInterval: any;
  countdownValue: number = 3;
  
  // Participants & Answers
  participants: Participant[] = [];
  answersReceived: number = 0;
  answerDistribution: number[] = [0, 0, 0, 0]; // Count per option
  
  // Leaderboard
  leaderboard: LeaderboardEntry[] = [];
  
  // UI State
  isLoading: boolean = false;
  showQRCode: boolean = false;
  
  // WebSocket subscriptions
  private subscriptions: Subscription[] = [];
  
  // Colors for options (Kahoot style)
  optionColors = [
    { bg: 'bg-red-500', hover: 'hover:bg-red-600', icon: '▲' },
    { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', icon: '◆' },
    { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', icon: '●' },
    { bg: 'bg-green-500', hover: 'hover:bg-green-600', icon: '■' }
  ];

  constructor(
    public router: Router,
    private gameService: GameService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    // Check if returning to existing game
    const savedGame = localStorage.getItem('kahoot_host_game');
    if (savedGame) {
      try {
        const game = JSON.parse(savedGame);
        this.gameId = game.gameId;
        this.roomCode = game.roomCode;
        this.gameName = game.gameName;
        this.gamePhase = 'lobby';
        this.connectWebSocket();
        this.loadGameState();
      } catch (e) {
        localStorage.removeItem('kahoot_host_game');
      }
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopTimer();
    this.websocketService.disconnect();
  }

  // ==================== GAME SETUP ====================

  createGame(): void {
    if (!this.gameName.trim()) {
      alert('Por favor ingresa un nombre para el juego');
      return;
    }

    this.isLoading = true;

    this.gameService.createKahootGame({
      name: this.gameName,
      totalQuestions: this.totalQuestions
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.gameId = response.data.game.id;
          this.roomCode = response.data.game.roomCode || '';
          
          // Save to localStorage
          localStorage.setItem('kahoot_host_game', JSON.stringify({
            gameId: this.gameId,
            roomCode: this.roomCode,
            gameName: this.gameName
          }));
          
          this.gamePhase = 'lobby';
          this.connectWebSocket();
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating game:', error);
        alert('Error al crear el juego');
        this.isLoading = false;
      }
    });
  }

  // ==================== WEBSOCKET ====================

  connectWebSocket(): void {
    this.websocketService.connect(
      this.roomCode,
      'host',
      'Presentador',
      'KAHOOT',
      true
    );

    this.subscribeToWebSocketEvents();
  }

  subscribeToWebSocketEvents(): void {
    // Participant joined
    const joinSub = this.websocketService.on('participant-joined').subscribe((data: any) => {
      console.log('Participant joined:', data);
      this.loadParticipants();
    });
    this.subscriptions.push(joinSub);

    // Participant left
    const leftSub = this.websocketService.on('participant-left').subscribe((data: any) => {
      console.log('Participant left:', data);
      this.loadParticipants();
    });
    this.subscriptions.push(leftSub);

    // Answer submitted
    const answerSub = this.websocketService.on('answer-submitted').subscribe((data: any) => {
      this.answersReceived++;
      // Update answer distribution
      if (data.selectedAnswer >= 0 && data.selectedAnswer < 4) {
        this.answerDistribution[data.selectedAnswer]++;
      }
      // Mark participant as answered
      const participant = this.participants.find(p => p.id === data.participantId);
      if (participant) {
        participant.hasAnswered = true;
      }
    });
    this.subscriptions.push(answerSub);
  }

  loadParticipants(): void {
    this.gameService.getKahootGame(this.roomCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.participants = response.data.participantsList.map((p: any) => ({
            id: p.id,
            userName: p.userName || 'Jugador',
            score: p.score || 0,
            hasAnswered: false
          }));
        }
      }
    });
  }

  loadGameState(): void {
    this.loadParticipants();
  }

  // ==================== GAME FLOW ====================

  startGame(): void {
    if (this.participants.length < 1) {
      alert('Se necesita al menos 1 jugador para comenzar');
      return;
    }

    this.isLoading = true;

    this.gameService.startKahootGame(this.roomCode).subscribe({
      next: (response) => {
        if (response.success) {
          // Notify all players
          this.websocketService.startGame(this.roomCode);
          
          // Load first question
          if (response.data.currentQuestion) {
            this.currentQuestion = response.data.currentQuestion;
            this.questionNumber = 1;
            
            // Start countdown only if we have a question
            this.startCountdown();
          } else {
            console.error('No questions available!');
            alert('Error: No hay preguntas disponibles. Contacta al administrador.');
            this.gamePhase = 'lobby';
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error starting game:', error);
        alert('Error al iniciar el juego');
        this.isLoading = false;
      }
    });
  }

  startCountdown(): void {
    this.gamePhase = 'countdown';
    this.countdownValue = 3;
    
    const countdownInterval = setInterval(() => {
      this.countdownValue--;
      if (this.countdownValue <= 0) {
        clearInterval(countdownInterval);
        this.showQuestion();
      }
    }, 1000);
  }

  showQuestion(): void {
    if (!this.currentQuestion) return;
    
    this.gamePhase = 'question';
    this.answersReceived = 0;
    this.answerDistribution = [0, 0, 0, 0];
    this.participants.forEach(p => p.hasAnswered = false);
    
    // Set timer
    this.timeLimit = this.currentQuestion.timeLimit || 20;
    this.timeRemaining = this.timeLimit;
    this.timerProgress = 100;
    
    // Broadcast question to players (without correct answer)
    this.websocketService.changeQuestion(this.roomCode, {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question,
      options: this.currentQuestion.options,
      timeLimit: this.timeLimit,
      category: this.currentQuestion.category,
      difficulty: this.currentQuestion.difficulty,
      points: this.currentQuestion.points
    });
    
    // Start timer
    this.startTimer();
    this.websocketService.startTimer(this.roomCode, this.timeLimit);
  }

  showAnswerReveal(): void {
    this.gamePhase = 'answer-reveal';
    this.stopTimer();
    this.websocketService.stopTimer(this.roomCode);
    
    // Load updated leaderboard
    this.loadLeaderboard();
  }

  showLeaderboard(): void {
    this.gamePhase = 'leaderboard';
    
    // Broadcast leaderboard to all players
    this.websocketService.updateLeaderboard(this.roomCode, this.leaderboard);
  }

  nextQuestion(): void {
    this.isLoading = true;

    this.gameService.nextKahootQuestion(this.roomCode).subscribe({
      next: (response) => {
        if (response.success) {
          if (response.data.finished) {
            // Game ended
            this.showFinalResults();
          } else if (response.data.currentQuestion) {
            this.currentQuestion = response.data.currentQuestion;
            this.questionNumber++;
            this.startCountdown();
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading next question:', error);
        this.isLoading = false;
      }
    });
  }

  showFinalResults(): void {
    this.gamePhase = 'final-results';
    this.loadLeaderboard();
    
    // Notify all players
    this.websocketService.endGame(this.roomCode, this.leaderboard);
    
    // Clear saved game
    localStorage.removeItem('kahoot_host_game');
  }

  // ==================== TIMER ====================

  startTimer(): void {
    this.stopTimer();

    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.timerProgress = (this.timeRemaining / this.timeLimit) * 100;
      } else {
        this.showAnswerReveal();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ==================== LEADERBOARD ====================

  loadLeaderboard(): void {
    this.gameService.getKahootLeaderboard(this.roomCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboard = response.data.leaderboard;
        }
      }
    });
  }

  // ==================== UTILITIES ====================

  getJoinUrl(): string {
    return `${window.location.origin}/game/kahoot/join/${this.roomCode}`;
  }

  copyRoomCode(): void {
    navigator.clipboard.writeText(this.roomCode);
    alert('Código copiado: ' + this.roomCode);
  }

  toggleQRCode(): void {
    this.showQRCode = !this.showQRCode;
  }

  getTimerColor(): string {
    if (this.timerProgress > 50) return '#10b981';
    if (this.timerProgress > 25) return '#f59e0b';
    return '#ef4444';
  }

  getRankMedal(rank: number): string {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}°`;
  }

  getAnswerPercentage(index: number): number {
    if (this.answersReceived === 0) return 0;
    return Math.round((this.answerDistribution[index] / this.answersReceived) * 100);
  }

  endGame(): void {
    if (confirm('¿Estás seguro de que quieres terminar el juego?')) {
      this.showFinalResults();
    }
  }

  newGame(): void {
    localStorage.removeItem('kahoot_host_game');
    this.gamePhase = 'setup';
    this.gameId = '';
    this.roomCode = '';
    this.currentQuestion = null;
    this.questionNumber = 0;
    this.participants = [];
    this.leaderboard = [];
    this.websocketService.disconnect();
  }
}
