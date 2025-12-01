import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService, LeaderboardEntry } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';
import { environment } from '../../../environments/environment';

interface Question {
  id: string;
  question: string;
  text?: string;
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
  name?: string;
  score: number;
  hasAnswered: boolean;
  correctAnswers?: number;
}

interface SavedGame {
  gameId: string;
  roomCode: string;
  gameName: string;
  createdAt: string;
  status: 'waiting' | 'active' | 'paused' | 'finished';
  participantCount: number;
}

@Component({
  selector: 'app-game-kahoot-host',
  templateUrl: './game-kahoot-host.component.html',
  styleUrls: ['./game-kahoot-host.component.css']
})
export class GameKahootHostComponent implements OnInit, OnDestroy {
  @ViewChild('questionFileInput') questionFileInput?: ElementRef<HTMLInputElement>;

  // Game configuration
  gameId: string = '';
  roomCode: string = '';
  gameName: string = 'Trivia Kahoot';
  totalQuestions: number = 10;
  questionCount: number = 10;
  timePerQuestion: number = 20;
  selectedEventId: string = '';
  
  // Game phases: 'menu' | 'setup' | 'lobby' | 'countdown' | 'question' | 'answer-reveal' | 'leaderboard' | 'final-results'
  gamePhase: string = 'menu';
  
  // Saved games
  savedGames: SavedGame[] = [];
  
  // Current question data
  currentQuestion: Question | null = null;
  currentQuestionIndex: number = 0;
  questionNumber: number = 0;
  
  // Timer
  timeRemaining: number = 0;
  timeLimit: number = 20;
  timerProgress: number = 100;
  timerInterval: any;
  countdownValue: number = 3;
  
  // Participants & Answers
  participants: Participant[] = [];
  answeredCount: number = 0;
  answersReceived: number = 0;
  answerDistribution: number[] = [0, 0, 0, 0]; // Count per option
  
  // Leaderboard
  leaderboard: LeaderboardEntry[] = [];
  
  // Events
  events: any[] = [];
  
  // UI State
  isLoading: boolean = false;
  showQRCode: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  joinUrl: string = '';
  questionFile: File | null = null;
  questionFileName: string = '';
  uploadedQuestionCount: number = 0;
  questionUploadSummary: string = '';
  isUploadingQuestions: boolean = false;
  readonly questionTemplateUrl = `${environment.apiUrl}/questions/template`;
  
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
    // Load saved games from localStorage
    this.loadSavedGames();
    this.loadEvents();
    
    // Check if returning to existing game
    const savedGame = localStorage.getItem('kahoot_host_game');
    if (savedGame) {
      try {
        const game = JSON.parse(savedGame);
        if (game.gameId && game.roomCode) {
          // Don't auto-connect, just show menu with option to resume
          this.gamePhase = 'menu';
        }
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

  // ==================== SAVED GAMES MANAGEMENT ====================

  loadSavedGames(): void {
    const games = localStorage.getItem('kahoot_saved_games');
    if (games) {
      try {
        this.savedGames = JSON.parse(games);
        // Sort by date, most recent first
        this.savedGames.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      } catch (e) {
        this.savedGames = [];
      }
    }
  }

  saveSavedGames(): void {
    localStorage.setItem('kahoot_saved_games', JSON.stringify(this.savedGames));
  }

  addToSavedGames(game: SavedGame): void {
    // Remove if exists (to update)
    this.savedGames = this.savedGames.filter(g => g.gameId !== game.gameId);
    // Add to beginning
    this.savedGames.unshift(game);
    // Keep only last 20 games
    if (this.savedGames.length > 20) {
      this.savedGames = this.savedGames.slice(0, 20);
    }
    this.saveSavedGames();
  }

  updateSavedGameStatus(gameId: string, status: 'waiting' | 'active' | 'paused' | 'finished', participantCount?: number): void {
    const game = this.savedGames.find(g => g.gameId === gameId);
    if (game) {
      game.status = status;
      if (participantCount !== undefined) {
        game.participantCount = participantCount;
      }
      this.saveSavedGames();
    }
  }

  deleteSavedGame(gameId: string): void {
    if (confirm('¿Eliminar este juego del historial?')) {
      this.savedGames = this.savedGames.filter(g => g.gameId !== gameId);
      this.saveSavedGames();
    }
  }

  loadEvents(): void {
    // Load available events for question filtering
    this.gameService.getEvents().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.events = response.data.events || [];
        }
      },
      error: () => {
        this.events = [];
      }
    });
  }

  getSelectedEventName(): string {
    if (!this.selectedEventId) return 'Selecciona un evento';
    const event = this.events.find(e => e.id === this.selectedEventId);
    return event?.name || 'Selecciona un evento';
  }

  // ==================== NAVIGATION ====================

  goToMenu(): void {
    this.stopTimer();
    this.websocketService.disconnect();
    this.gamePhase = 'menu';
    this.resetGameState();
  }

  goToSetup(): void {
    this.gamePhase = 'setup';
    this.resetGameState();
  }

  resetGameState(): void {
    this.gameId = '';
    this.roomCode = '';
    this.currentQuestion = null;
    this.questionNumber = 0;
    this.participants = [];
    this.leaderboard = [];
    this.answersReceived = 0;
    this.answerDistribution = [0, 0, 0, 0];
    this.uploadedQuestionCount = 0;
    this.questionUploadSummary = '';
  }

  resumeGame(savedGame: SavedGame): void {
    this.isLoading = true;
    
    // Try to load game from API
    this.gameService.getKahootGame(savedGame.roomCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.gameId = savedGame.gameId;
          this.roomCode = savedGame.roomCode;
          this.gameName = savedGame.gameName;
          
          // Update join URL
          this.joinUrl = `${window.location.origin}/game/kahoot/join/${this.roomCode}`;
          
          // Set participants
          this.participants = response.data.participantsList?.map((p: any) => ({
            id: p.id,
            userName: p.userName || 'Jugador',
            name: p.userName || 'Jugador',
            score: p.score || 0,
            hasAnswered: false,
            correctAnswers: p.correctAnswers || 0
          })) || [];
          
          // Save as current game
          localStorage.setItem('kahoot_host_game', JSON.stringify({
            gameId: this.gameId,
            roomCode: this.roomCode,
            gameName: this.gameName
          }));
          
          this.gamePhase = 'lobby';
          this.connectWebSocket();
          
          // Update saved game status
          this.updateSavedGameStatus(this.gameId, 'waiting', this.participants.length);
        } else {
          this.errorMessage = 'No se pudo cargar el juego. Es posible que haya expirado.';
          setTimeout(() => this.errorMessage = '', 3000);
          this.deleteSavedGame(savedGame.gameId);
        }
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar el juego. Es posible que haya expirado.';
        setTimeout(() => this.errorMessage = '', 3000);
        this.deleteSavedGame(savedGame.gameId);
        this.isLoading = false;
      }
    });
  }

  // ==================== GAME SETUP ====================

  createGame(): void {
    if (!this.gameName.trim()) {
      alert('Por favor ingresa un nombre para el juego');
      return;
    }

    if (!this.selectedEventId && !this.questionFile) {
      this.errorMessage = 'Selecciona un evento o sube un archivo de preguntas para generar uno automáticamente.';
      setTimeout(() => this.errorMessage = '', 4000);
      return;
    }

    this.isLoading = true;

    const finishCreation = () => {
      const createData: any = {
        name: this.gameName,
        totalQuestions: this.questionCount,
        eventId: this.selectedEventId
      };

      this.gameService.createKahootGame(createData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.gameId = response.data.game.id;
            this.roomCode = response.data.game.roomCode || '';
            
            // Use the actual available questions count from server
            this.totalQuestions = response.data.game.totalQuestions;
            
            // Show warning if less questions than requested
            const available = response.data.game.availableQuestions;
            const requested = response.data.game.requestedQuestions;
            if (available < requested) {
              this.successMessage = `⚠️ Solo hay ${available} preguntas disponibles (solicitaste ${requested})`;
              setTimeout(() => this.successMessage = '', 5000);
            }
            
            // Update join URL
            this.joinUrl = `${window.location.origin}/game/kahoot/join/${this.roomCode}`;
            
            // Save to localStorage as current game
            localStorage.setItem('kahoot_host_game', JSON.stringify({
              gameId: this.gameId,
              roomCode: this.roomCode,
              gameName: this.gameName,
              totalQuestions: this.totalQuestions
            }));
            
            // Add to saved games history
            this.addToSavedGames({
              gameId: this.gameId,
              roomCode: this.roomCode,
              gameName: this.gameName,
              createdAt: new Date().toISOString(),
              status: 'waiting',
              participantCount: 0
            });
            
            this.gamePhase = 'lobby';
            this.connectWebSocket();
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating game:', error);
          this.errorMessage = 'Error al crear el juego';
          setTimeout(() => this.errorMessage = '', 3000);
          this.isLoading = false;
        }
      });
    };

    if (this.questionFile) {
      this.isUploadingQuestions = true;
      const formData = new FormData();
      formData.append('file', this.questionFile);
      formData.append('eventId', this.selectedEventId);
      formData.append('gameMode', 'kahoot');

      this.gameService.uploadQuestionsFile(formData).subscribe({
        next: (response) => {
          this.isUploadingQuestions = false;
          this.uploadedQuestionCount = response?.data?.savedCount || 0;
          const linkedEvent = response?.data?.event;
          if (linkedEvent?.id) {
            this.selectedEventId = linkedEvent.id;
            const existingEvent = this.events.find(e => e.id === linkedEvent.id);
            if (!existingEvent) {
              this.events = [...this.events, linkedEvent];
            } else {
              Object.assign(existingEvent, linkedEvent);
            }
            this.questionUploadSummary = `Preguntas vinculadas al evento "${linkedEvent.name}" (${this.uploadedQuestionCount})`;
          } else {
            this.questionUploadSummary = `Preguntas vinculadas al evento (${this.uploadedQuestionCount})`;
          }
          if (response?.data?.eventAutoCreated) {
            this.successMessage = `Se creó automáticamente el evento "${linkedEvent?.name || 'Nuevo evento'}" con ${this.uploadedQuestionCount} preguntas`;
          } else {
            this.successMessage = `Se cargaron ${this.uploadedQuestionCount} preguntas para este evento`;
          }
          setTimeout(() => this.successMessage = '', 3000);
          this.clearQuestionFileInput();
          this.questionFile = null;
          this.questionFileName = '';
          this.loadEvents();
          finishCreation();
        },
        error: (error) => {
          console.error('Error uploading questions:', error);
          this.isUploadingQuestions = false;
          this.isLoading = false;
          this.errorMessage = error?.error?.message || 'No se pudieron subir las preguntas';
          setTimeout(() => this.errorMessage = '', 4000);
        }
      });
    } else {
      finishCreation();
    }
  }

  onQuestionFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const isValid = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      this.errorMessage = 'Formato no compatible. Usa archivos .xlsx, .xls o .csv';
      setTimeout(() => this.errorMessage = '', 3500);
      this.clearQuestionFileInput();
      return;
    }

    this.questionFile = file;
    this.questionFileName = file.name;
  }

  removeQuestionFile(): void {
    this.questionFile = null;
    this.questionFileName = '';
    this.clearQuestionFileInput();
  }

  downloadQuestionsTemplate(): void {
    window.open(this.questionTemplateUrl, '_blank');
  }

  private clearQuestionFileInput(): void {
    if (this.questionFileInput?.nativeElement) {
      this.questionFileInput.nativeElement.value = '';
    }
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
      this.answeredCount++;
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
            name: p.userName || 'Jugador',
            score: p.score || 0,
            hasAnswered: false,
            correctAnswers: p.correctAnswers || 0
          }));
          
          // Update saved game participant count
          if (this.gameId) {
            this.updateSavedGameStatus(this.gameId, 'waiting', this.participants.length);
          }
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
    this.answeredCount = 0;
    this.answerDistribution = [0, 0, 0, 0];
    this.participants.forEach(p => p.hasAnswered = false);
    
    // Set timer using configured time or question time limit
    this.timeLimit = this.timePerQuestion || this.currentQuestion.timeLimit || 20;
    this.timeRemaining = this.timeLimit;
    this.timerProgress = 100;
    
    // Broadcast question to players (without correct answer)
    this.websocketService.changeQuestion(this.roomCode, {
      id: this.currentQuestion.id,
      question: this.currentQuestion.question || this.currentQuestion.text,
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
    
    // Load leaderboard first, then notify players
    this.gameService.getKahootLeaderboard(this.roomCode).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboard = response.data.leaderboard;
          
          // Notify all players with the loaded leaderboard
          this.websocketService.endGame(this.roomCode, this.leaderboard);
        }
      },
      error: (err) => {
        console.error('Error loading final leaderboard:', err);
      }
    });
    
    // Update saved game status to finished
    this.updateSavedGameStatus(this.gameId, 'finished', this.participants.length);
    
    // Clear current game reference
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

  getAnswerCount(index: number): number {
    return this.answerDistribution[index] || 0;
  }

  getProgressPercentage(): number {
    if (this.participants.length === 0) return 0;
    return Math.round((this.answeredCount / this.participants.length) * 100);
  }

  getLeaderboard(): any[] {
    // Use API leaderboard if available (has accurate scores)
    if (this.leaderboard && this.leaderboard.length > 0) {
      return this.leaderboard.map(entry => ({
        ...entry,
        name: entry.userName || 'Jugador',
        score: entry.score || 0,
        correctAnswers: entry.correctAnswers || 0
      }));
    }
    
    // Fallback to participants (may not have updated scores)
    const sorted = [...this.participants].sort((a, b) => (b.score || 0) - (a.score || 0));
    return sorted.map(p => ({
      ...p,
      name: p.userName || p.name || 'Jugador'
    }));
  }

  copyJoinUrl(): void {
    navigator.clipboard.writeText(this.joinUrl).then(() => {
      this.successMessage = 'Enlace copiado al portapapeles';
      setTimeout(() => this.successMessage = '', 3000);
    });
  }

  onEventChange(): void {
    // Could load questions count for selected event
    console.log('Event changed:', this.selectedEventId);
  }

  playAgain(): void {
    // Reset game state and go to setup
    this.resetGameState();
    this.gamePhase = 'setup';
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
