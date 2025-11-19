import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GameService, LeaderboardEntry } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
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
  selector: 'app-game-geoparty',
  templateUrl: './game-geoparty.component.html',
  styleUrls: ['./game-geoparty.component.css']
})
export class GameGeopartyComponent implements OnInit, OnDestroy {
  // Board mode
  boardMode: boolean = true; // show board by default instead of simple category select
  rowsCount: number = 5; // default rows (difficulty levels)
  colsCount: number = 6; // default columns (categories)
  // board data structure: categoryId -> array of cells
  board: { [categoryId: string]: Array<{ value: number; used: boolean; difficulty: string; question?: Question; winnerTeamId?: string }> } = {};

  // Teams mode
  teamMode: boolean = false;
  teams: Array<{ id: string; name: string; score: number; color?: string; icon?: string }> = [];
  currentTeamIndex: number = 0;
  newTeamName: string = '';
  newTeamColor: string = '';
  // store the selected cell so submitAnswer can reference it
  currentSelectedCell: { categoryId: string; rowIndex: number } | null = null;
  // Game state
  gameId: string = '';
  gamePhase: 'join' | 'waiting' | 'category-select' | 'playing' | 'results' = 'join';
  currentQuestion: Question | null = null;
  selectedAnswer: number | null = null;
  hasAnswered: boolean = false;
  answerResult: { isCorrect: boolean; correctAnswer: number } | null = null;

  // Participant info
  participantId: string = '';
  userId: string = '';
  playerName: string = '';
  currentScore: number = 0;
  correctAnswersCount: number = 0;
  streak: number = 0;

  // Categories
  selectedCategory: string = '';
  categories: Category[] = [
    { id: 'Geography', name: 'Geografía', icon: '🌍', color: 'bg-blue-500' },
    { id: 'Science', name: 'Ciencias', icon: '🔬', color: 'bg-green-500' },
    { id: 'History', name: 'Historia', icon: '📜', color: 'bg-yellow-600' },
    { id: 'Sports', name: 'Deportes', icon: '⚽', color: 'bg-red-500' },
    { id: 'Entertainment', name: 'Entretenimiento', icon: '🎬', color: 'bg-purple-500' },
    { id: 'Technology', name: 'Tecnología', icon: '💻', color: 'bg-indigo-500' },
    { id: 'Art', name: 'Arte', icon: '🎨', color: 'bg-pink-500' },
    { id: 'Music', name: 'Música', icon: '🎵', color: 'bg-orange-500' },
    { id: 'Literature', name: 'Literatura', icon: '📚', color: 'bg-teal-500' }
  ];

  // Timer
  timeRemaining: number = 0;
  timerProgress: number = 100;
  timerInterval: any;

  // Leaderboard
  leaderboard: LeaderboardEntry[] = [];
  participants: any[] = [];

  // Stats
  totalQuestions: number = 20;
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

  // Return teams sorted by score (non-mutating)
  get sortedTeams() {
    return this.teams.slice().sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  getTeamInitialById(teamId?: string | null) {
    if (!teamId) return '';
    const t = this.teams.find(x => x.id === teamId);
    if (!t || !t.name) return '';
    return t.name.charAt(0);
  }

  ngOnInit(): void {
    // Get gameId from route params
    this.route.params.subscribe(params => {
      if (params['gameId']) {
        this.gameId = params['gameId'];
        this.loadGameDetails();
      }
    });

    // Generate temporary userId for guests (allow playing without login)
    this.userId = this.generateGuestId();

    // Get userId from localStorage (optional - for logged users)
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        this.userId = user.id;
        this.playerName = user.name || user.email;
      } catch (e) {
        console.warn('Error parsing currentUser from localStorage', e);
      }
    }
    // initialize default teams (empty)
    this.teams = [];
  }

  // Subscribe to websocket events related to team scores and cell reservations
  private subscribeToSocketTeamEvents() {
    // team score updates
    const teamScoreSub = this.websocketService.on('leaderboard-updated').subscribe((data: any) => {
      // backend may use leaderboard-updated for team scores; attempt to map
      if (data && data.leaderboard) {
        // try to map by teamId or teamName
        data.leaderboard.forEach((entry: any) => {
          if (entry.teamId) {
            const t = this.teams.find(x => x.id === entry.teamId);
            if (t) t.score = entry.score;
          }
        });
      }
    });
    this.subscriptions.push(teamScoreSub);

    // explicit team-score-updated handler (preferred)
    const teamScoreUpdatedSub = this.websocketService.on('team-score-updated').subscribe((payload: any) => {
      // payload: { gameId, teamScores: [{teamId, score}] }
      if (!payload || payload.gameId !== this.gameId) return;
      const scores = payload.teamScores;
      if (Array.isArray(scores)) {
        scores.forEach((s: any) => {
          const found = this.teams.find(x => x.id === s.teamId);
          if (found) found.score = s.score;
        });
      }
    });
    this.subscriptions.push(teamScoreUpdatedSub);

    // cell reserved events
    const cellReservedSub = this.websocketService.on('cell-reserved').subscribe((payload: any) => {
      // payload: { gameId, categoryId, rowIndex, questionId, reservedBy, teamId }
      if (!payload) return;
      if (payload.gameId !== this.gameId) return;
      const keyCat = payload.categoryId;
      const r = payload.rowIndex;
      try {
        const cell = this.getCell(keyCat, r);
        if (cell) cell.used = true;
      } catch (e) {
        // ignore if cell not in this client's board
      }
    });
    this.subscriptions.push(cellReservedSub);
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
    this.gameService.getGeopartyGame(this.gameId).subscribe({
      next: (response) => {
        if (response.success) {
          this.totalQuestions = response.data.game.totalQuestions;
          this.questionsAnswered = response.data.game.questionsAnswered;
          this.participants = response.data.participantsList;
          
          // If game already started, join directly to playing phase
          if (response.data.game.status === 'IN_PROGRESS') {
            this.gamePhase = 'category-select';
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
    if (!this.userId || !this.playerName) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Uniéndose al juego...';

    this.gameService.joinGeopartyGame(this.gameId, this.userId).subscribe({
      next: (response) => {
        if (response.success) {
          this.participantId = response.data.participant.id;
          this.currentScore = response.data.participant.score;
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
    this.isLoading = true;
    this.loadingMessage = 'Iniciando juego...';

    this.gameService.startGeopartyGame(this.gameId).subscribe({
      next: (response) => {
        if (response.success) {
          this.gamePhase = 'category-select';
          
          // Broadcast start via WebSocket
          this.websocketService.startGame(this.gameId);
          
          this.isLoading = false;
          this.loadingMessage = '';
          // initialize board when game starts
          this.setupBoard();
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

  selectCategory(category: Category): void {
    if (this.isLoading) return;

    this.selectedCategory = category.id;
    this.isLoading = true;
    this.loadingMessage = 'Cargando pregunta...';

    this.gameService.selectGeopartyQuestion(this.gameId, category.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadQuestion(response.data.question);
          this.gamePhase = 'playing';
          this.isLoading = false;
          this.loadingMessage = '';
        }
      },
      error: (error) => {
        console.error('Error selecting question:', error);
        alert('Error al cargar la pregunta');
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
    this.websocketService.changeQuestion(this.gameId, question);
    this.websocketService.startTimer(this.gameId, this.timeRemaining);
    // attach selected cell info to currentQuestion for scoring/marking
    if (this.currentSelectedCell && this.currentQuestion) {
      (this.currentQuestion as any).__cell = this.currentSelectedCell;
    }
  }

  // ========== NEW: BOARD / JEOPARDY HELPERS ==========
  setupBoard(): void {
    // prepare categories to use (take first colsCount)
    const cats = this.categories.slice(0, this.colsCount);
    const baseValues = [100, 200, 300, 400, 500];

    this.board = {};
    for (let c of cats) {
      this.board[c.id] = [];
      for (let r = 0; r < this.rowsCount; r++) {
        const value = baseValues[r] || (100 * (r + 1));
        const difficulty = r < 2 ? 'easy' : r < 4 ? 'medium' : 'hard';
        this.board[c.id].push({ value, used: false, difficulty, question: undefined });
      }
    }

    // optionally fetch and assign questions for each cell from backend
    // For now, we'll leave question undefined; selecting a cell will call selectCategory
  }

  getBoardCategories(): Category[] {
    return this.categories.slice(0, this.colsCount);
  }

  getCell(categoryId: string, rowIndex: number) {
    return this.board[categoryId][rowIndex];
  }

  selectCell(categoryId: string, rowIndex: number) {
    const cell = this.getCell(categoryId, rowIndex);
    if (!cell || cell.used) return;

    // attempt to reserve the cell on the server to avoid race conditions
    // mark optimistically until server confirms
    cell.used = true;
    this.currentSelectedCell = { categoryId, rowIndex };

    const participantId = this.participantId || undefined;
    const teamId = this.teamMode ? (this.getCurrentTeam()?.id) : undefined;

    this.gameService.reserveGeopartyCell(this.gameId, categoryId, rowIndex, participantId, teamId).subscribe({
      next: (response) => {
        if (response.success) {
          this.loadQuestion(response.data.question);
          this.gamePhase = 'playing';
        } else {
          // revert optimistic mark
          cell.used = false;
          this.currentSelectedCell = null;
          alert('No se pudo reservar la celda');
        }
      },
      error: (err) => {
        console.error('Failed to reserve cell', err);
        // revert optimistic mark
        cell.used = false;
        this.currentSelectedCell = null;
        alert('Unable to reserve this cell. It may have been taken by another player.');
      }
    });
  }

  // Team management
  addTeam(name?: string) {
    const id = `team_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const teamName = name || (this.newTeamName && this.newTeamName.trim()) || `Equipo ${this.teams.length + 1}`;
    const teamColor = this.newTeamColor || this.getRandomColor();
    const icons = ['📜','🪨','🐑','🌾','🔥','⛺','📯','✡️','⚑'];
    const icon = icons[this.teams.length % icons.length];

    this.teams.push({ id, name: teamName, score: 0, color: teamColor, icon });

    // reset inputs
    this.newTeamName = '';
    this.newTeamColor = '';
  }

  private getRandomColor() {
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
    return palette[Math.floor(Math.random() * palette.length)];
  }

  removeTeam(index: number) {
    if (index >= 0 && index < this.teams.length) {
      this.teams.splice(index, 1);
    }
  }

  nextTeamTurn() {
    if (this.teams.length === 0) return;
    this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
  }

  awardPointsToCurrentTeam(points: number) {
    if (this.teams.length === 0) return;
    this.teams[this.currentTeamIndex].score += points;
  }

  getCurrentTeam() {
    return this.teams[this.currentTeamIndex];
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

    const payload: any = {
      participantId: this.participantId,
      questionId: this.currentQuestion.id,
      selectedAnswer: this.selectedAnswer,
      timeRemaining: this.timeRemaining
    };
    if (this.teamMode) {
      const team = this.getCurrentTeam();
      if (team) payload.teamId = team.id;
    }

    this.gameService.submitGeopartyAnswer(this.gameId, payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.answerResult = {
            isCorrect: response.data.answer.isCorrect,
            correctAnswer: response.data.answer.correctAnswer
          };
          
          // Update participant stats
          this.currentScore = response.data.participant.score;
          this.correctAnswersCount = response.data.participant.correctAnswers;
          this.streak = response.data.participant.streak;

          // If server returned updated team scores, sync local teams
          if ((response.data as any).teamScores) {
            const ts: any = (response.data as any).teamScores;
            if (Array.isArray(ts)) {
              ts.forEach((t: any) => {
                const found = this.teams.find(x => x.id === t.teamId);
                if (found) found.score = t.score;
              });
            } else {
              Object.keys(ts).forEach(k => {
                const found = this.teams.find(x => x.id === k);
                if (found) found.score = ts[k];
              });
            }
          }
          
          // Broadcast answer via WebSocket
          this.websocketService.submitAnswer(
            this.gameId,
            this.participantId,
            this.currentQuestion!.id,
            this.selectedAnswer!
          );
          
          // Stop timer
          this.stopTimer();
          this.websocketService.stopTimer(this.gameId);
          
          // Update leaderboard after delay
          setTimeout(() => {
            this.loadLeaderboard();
          }, 1000);
          
          // Increment questions answered
          this.questionsAnswered++;

          // Handle team scoring if active
          if (this.teamMode) {
            const sel = this.currentSelectedCell;
            const cell = sel ? this.getCell(sel.categoryId, sel.rowIndex) : null;
            const basePoints = cell ? cell.value : 100;
            const timeBonus = this.gameService.calculateTimeBonus(this.timeRemaining, this.currentQuestion?.timeLimit || 30);
            const streakBonus = this.gameService.calculateStreakBonus(this.streak);

            if (response.data.answer.isCorrect) {
              const total = this.gameService.getTotalScore(basePoints, timeBonus, streakBonus);
              this.awardPointsToCurrentTeam(total);
              if (cell && sel) {
                cell.winnerTeamId = this.getCurrentTeam()?.id;
              }
            }

            // advance to next team turn
            this.nextTeamTurn();
            // clear selected cell after scoring
            this.currentSelectedCell = null;
          }
          
          // Check if game finished
          if (this.questionsAnswered >= this.totalQuestions) {
            setTimeout(() => {
              this.finishGame();
            }, 3000);
          } else {
            // Return to category selection after delay
            setTimeout(() => {
              this.gamePhase = 'category-select';
              this.selectedCategory = '';
            }, 3000);
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error submitting answer:', error);
        this.isLoading = false;
      }
    });
  }

  finishGame(): void {
    this.gamePhase = 'results';
    this.websocketService.endGame(this.gameId, this.leaderboard);
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.gameService.getGeopartyLeaderboard(this.gameId).subscribe({
      next: (response) => {
        if (response.success) {
          this.leaderboard = response.data.leaderboard;
          
          // Broadcast leaderboard update via WebSocket
          this.websocketService.updateLeaderboard(this.gameId, this.leaderboard);
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
        } else if (!this.hasAnswered) {
          // Return to category selection if time expired without answer
          this.gamePhase = 'category-select';
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
    this.websocketService.connect(
      this.gameId,
      this.participantId,
      this.playerName,
      'GEOPARTY'
    );

    // Subscribe to WebSocket events
    this.subscribeToWebSocketEvents();
  // Subscribe to team & cell specific events
  this.subscribeToSocketTeamEvents();
  }

  subscribeToWebSocketEvents(): void {
    // Game started
    const gameStartedSub = this.websocketService.on('game-started').subscribe(() => {
      this.gamePhase = 'category-select';
    });
    this.subscriptions.push(gameStartedSub);

    // Question changed (by other players)
    const questionChangedSub = this.websocketService.on('question-changed').subscribe((data: any) => {
      console.log('Question changed by another player:', data.question);
    });
    this.subscriptions.push(questionChangedSub);

    // Timer tick
    const timerTickSub = this.websocketService.on('timer-tick').subscribe((data: any) => {
      // Each player manages their own timer in Geoparty
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

  getCategoryClass(category: Category): string {
    const baseClasses = 'category-card p-6 rounded-xl cursor-pointer transition-all transform hover:scale-110 text-center ';
    
    if (this.isLoading && this.selectedCategory === category.id) {
      return baseClasses + category.color + ' text-white opacity-75 scale-105';
    }
    
    return baseClasses + category.color + ' text-white hover:shadow-2xl';
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

  getMyRank(): number {
    const myEntry = this.leaderboard.find(entry => entry.participantId === this.participantId);
    return myEntry ? myEntry.rank : 0;
  }

  exitGame(): void {
    if (confirm('¿Estás seguro de que quieres salir del juego?')) {
      this.websocketService.disconnect();
      this.router.navigate(['/dashboard']);
    }
  }

  // Generate a unique guest ID for players without login
  private generateGuestId(): string {
    return 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  playAgain(): void {
    this.gamePhase = 'join';
    this.gameId = '';
    this.participantId = '';
    this.currentScore = 0;
    this.correctAnswersCount = 0;
    this.streak = 0;
    this.questionsAnswered = 0;
    this.leaderboard = [];
    this.websocketService.disconnect();
  }
}
