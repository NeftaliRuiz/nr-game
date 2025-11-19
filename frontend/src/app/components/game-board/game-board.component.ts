import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { TriviaService } from '../../services/trivia.service';
import { Question, Category } from '../../models/question.model';
import { Team, LeaderboardEntry } from '../../models/team.model';
import { QuestionCardComponent } from '../question-card/question-card.component';
import { TimerComponent } from '../timer/timer.component';

enum GameState {
  SETUP = 'setup',
  PLAYING = 'playing',
  RESULTS = 'results',
  FINAL = 'final'
}

@Component({
  selector: 'app-game-board',
  template: `
  <div #boardContainer class="container mx-auto px-4 py-8">
      <!-- Header -->
      <header class="text-center mb-12">
        <h1 class="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          📚 Deuteronomio 28
        </h1>
        <p class="text-xl text-white/80">Juego de Preguntas y Respuestas</p>
        <div class="mt-4 flex justify-center gap-4">
          <button (click)="togglePresent()" class="btn-secondary px-4 py-2" [title]="isPresenting ? 'Salir presentación (ESC)' : 'Presentar en pantalla completa'">
            {{ isPresenting ? 'Salir presentación' : 'Presentar' }}
          </button>
        </div>
      </header>

      <!-- Setup Screen -->
      <div *ngIf="gameState === 'setup'" class="max-w-4xl mx-auto">
        <div class="card">
          <h2 class="text-3xl font-bold mb-6 text-center">Configuración del Juego</h2>
          
          <!-- Game mode -->
          <div class="mb-8">
            <label class="block text-lg font-semibold mb-4 text-white label-strong">Modo de juego:</label>
            <div class="grid grid-cols-2 gap-4">
              <button
                (click)="gameMode = 'individual'"
                [ngClass]="{
                  'bg-primary border-primary': gameMode === 'individual',
                  'bg-white/10 border-white/20': gameMode !== 'individual'
                }"
                class="p-6 rounded-xl border-2 transition-all hover:scale-105"
              >
                <div class="text-4xl mb-2">👤</div>
                <div class="font-bold">Individual</div>
              </button>
              <button
                (click)="gameMode = 'team'"
                [ngClass]="{
                  'bg-primary border-primary': gameMode === 'team',
                  'bg-white/10 border-white/20': gameMode !== 'team'
                }"
                class="p-6 rounded-xl border-2 transition-all hover:scale-105"
              >
                <div class="text-4xl mb-2">👥</div>
                <div class="font-bold">Equipos</div>
              </button>
            </div>
          </div>

          <!-- Team setup -->
          <div class="mb-8">
            <label class="block text-lg font-semibold mb-4 text-white label-strong">
              {{ gameMode === 'team' ? 'Equipos' : 'Jugadores' }} ({{ teams.length }}):
            </label>
            
            <div class="space-y-4 mb-4">
              <div *ngFor="let team of teams; let i = index" class="flex gap-4 items-center p-4 bg-white/5 rounded-xl">
                <!-- Visible icon container with transparent background + colored border. 
                     An invisible native <select> is overlayed to preserve native dropdown/keyboard behavior
                     while avoiding a white square behind the emoji in the visible UI. -->
                <div class="relative w-12 h-12">
                  <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl border-2"
                       [style.border-color]="team.color"
                       [style.background-color]="'transparent'">
                    {{ team.icon }}
                  </div>

                  <!-- invisible native select stretches over the visible icon to capture clicks/focus -->
                  <select [(ngModel)]="team.icon" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" aria-label="Seleccionar icono de equipo">
                    <option value="📜">📜</option>
                    <option value="🪨">🪨</option>
                    <option value="🐑">🐑</option>
                    <option value="🌾">🌾</option>
                    <option value="🔥">🔥</option>
                    <option value="⛺">⛺</option>
                    <option value="📯">📯</option>
                    <option value="✡️">✡️</option>
                  </select>
                </div>
                
                <input
                  [(ngModel)]="team.name"
                  placeholder="Nombre del equipo"
                  class="flex-1 bg-white/10 px-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary"
                />
                
                <input
                  type="color"
                  [(ngModel)]="team.color"
                  class="w-12 h-12 rounded cursor-pointer"
                />
                
                <button
                  (click)="removeTeam(i)"
                  class="text-danger hover:bg-danger/20 p-2 rounded-lg transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>

            <button (click)="addTeam()" class="btn-secondary w-full">
              ➕ Agregar {{ gameMode === 'team' ? 'Equipo' : 'Jugador' }}
            </button>
          </div>

          <!-- Categories hidden per UX request -->

          <!-- Número de preguntas -->
          <div class="mb-6">
            <label class="block text-lg font-semibold mb-2 text-white label-strong">Número de preguntas por partida:</label>
            <select [(ngModel)]="totalQuestions" class="w-full p-3 rounded-lg bg-white/5">
              <option *ngFor="let n of [5,10,15,20,25,30,40]" [value]="n">{{ n }} preguntas</option>
            </select>
          </div>

          <button
            (click)="startGame()"
            [disabled]="teams.length === 0"
            class="btn-success w-full text-xl py-4 text-white"
          >
            🎮 Iniciar Juego
          </button>
        </div>
      </div>

      <!-- Playing Screen -->
      <div *ngIf="gameState === 'playing'" class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Main game area -->
          <div class="lg:col-span-2 space-y-8">
            <!-- Current turn indicator -->
            <div class="card">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div 
                    class="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2"
                    [style.background-color]="'transparent'"
                    [style.border-color]="currentTeam?.color"
                  >
                    {{ currentTeam?.icon }}
                  </div>
                  <div>
                    <div class="text-sm text-white">Turno actual:</div>
                    <div class="text-2xl font-bold text-white">{{ currentTeam?.name }}</div>
                  </div>
                </div>
                
                <app-timer
                  *ngIf="currentQuestion"
                  [timeLimit]="currentQuestion.timeLimit"
                  (timeUp)="handleTimeUp()"
                  (tick)="onTimerTick($event)"
                ></app-timer>
              </div>
            </div>

            <!-- Question card -->
            <app-question-card
              #questionCard
              [question]="currentQuestion"
              [categoryName]="''" 
              [categoryIcon]="''"
              [categoryColor]="'transparent'"
              [streak]="currentTeam?.streak || 0"
              (answerSubmitted)="handleAnswer($event)"
              (next)="handleNextManual()"
            ></app-question-card>

            <!-- Finish match button -->
            <div class="mt-4 text-right">
              <button (click)="finishGame()" class="btn-secondary px-4 py-2">Finalizar partida</button>
            </div>
          </div>

          <!-- Sidebar with scoreboard -->
          <div class="lg:col-span-1">
            <app-scoreboard [leaderboard]="leaderboard"></app-scoreboard>
            
            <div class="card mt-6 text-center">
              <div class="text-sm text-white/60 mb-2">Pregunta</div>
              <div class="text-4xl font-bold">{{ currentQuestionNumber }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Final Results Screen -->
      <div *ngIf="gameState === 'final'" class="max-w-4xl mx-auto">
        <div class="card text-center">
          <h2 class="text-5xl font-bold mb-8">🎉 ¡Juego Terminado!</h2>
          
          <div class="mb-8" *ngIf="leaderboard.length > 0">
            <div class="text-6xl mb-4">{{ leaderboard[0].icon }}</div>
            <h3 class="text-3xl font-bold mb-2">🏆 Ganador:</h3>
            <p class="text-4xl font-bold text-primary">{{ leaderboard[0].name }}</p>
            <p class="text-2xl text-white/80 mt-2">{{ leaderboard[0].score }} puntos</p>
          </div>

          <app-scoreboard [leaderboard]="leaderboard"></app-scoreboard>

          <button (click)="resetGame()" class="btn-success w-full mt-8 text-xl py-4">
            🔄 Nueva Partida
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class GameBoardComponent implements OnInit {
  @ViewChild('questionCard') questionCard!: QuestionCardComponent;
  @ViewChild('boardContainer', { static: true }) boardContainer!: ElementRef;
  @ViewChild(TimerComponent) timerComponent!: TimerComponent;

  gameState: GameState = GameState.SETUP;
  gameMode: 'individual' | 'team' = 'team';
  isPresenting: boolean = false;
  private _originalBackground: string = '';
  
  teams: Team[] = [];
  openIconIndex: number | null = null;
  categories: Category[] = [];
  leaderboard: LeaderboardEntry[] = [];
  
  currentQuestion: Question | null = null;
  currentCategory: Category | null = null;
  currentTeamIndex: number = 0;
  currentTeam: Team | null = null;
  currentQuestionNumber: number = 0;
  timeRemaining: number = 20;
  
  sessionId: string = '';
  usedQuestionIds: number[] = [];
  totalQuestions: number = 10;
  private advanceTimeout: any = null;

  constructor(private triviaService: TriviaService) {}

  ngOnInit(): void {
    this.loadCategories();
    this.addTeam();
    this.addTeam();
  }

  toggleIconDropdown(index: number) {
    this.openIconIndex = this.openIconIndex === index ? null : index;
  }

  loadCategories(): void {
    this.triviaService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (err) => console.error('Error loading categories:', err)
    });
  }

  addTeam(): void {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const icons = ['📜','🪨','�','�','🔥','⛺','📯','✡️'];
    
    const team: Team = {
      id: `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${this.gameMode === 'team' ? 'Equipo' : 'Jugador'} ${this.teams.length + 1}`,
      icon: icons[this.teams.length % icons.length],
      color: colors[this.teams.length % colors.length],
      score: 0,
      correctAnswers: 0,
      totalAnswers: 0,
      streak: 0
    };
    
    this.teams.push(team);
  }

  removeTeam(index: number): void {
    this.teams.splice(index, 1);
  }

  startGame(): void {
    if (this.teams.length === 0) return;
    
    this.triviaService.createGameSession(this.teams).subscribe({
      next: (session) => {
        this.sessionId = session.id;
        this.gameState = GameState.PLAYING;
        this.currentTeamIndex = 0;
        this.currentTeam = this.teams[0];
        this.currentQuestionNumber = 0;
        this.loadNextQuestion();
        // Enter presentation mode automatically when the host starts the game
        try {
          this.enterFullscreen();
        } catch (e) {
          // ignore if browser blocks or error occurs
        }
      },
      error: (err) => console.error('Error creating session:', err)
    });
  }

  loadNextQuestion(): void {
    if (this.currentQuestionNumber >= this.totalQuestions) {
      this.endGame();
      return;
    }

    const randomCategory = this.categories[Math.floor(Math.random() * this.categories.length)];
    this.currentCategory = randomCategory;

    this.triviaService.getRandomQuestion(randomCategory.id, this.usedQuestionIds).subscribe({
      next: (question) => {
        this.currentQuestion = question;
        this.usedQuestionIds.push(question.id);
        this.currentQuestionNumber++;
        this.timeRemaining = question.timeLimit;
        
        if (this.questionCard) {
          this.questionCard.reset();
        }
        
        if (this.timerComponent) {
          this.timerComponent.resetTimer();
        }
      },
      error: (err) => {
        console.error('Error loading question:', err);
        this.endGame();
      }
    });
  }

  handleAnswer(answer: number): void {
    if (!this.currentQuestion || !this.currentTeam) return;

    this.timerComponent?.stopTimer();

    this.triviaService.validateAnswer(
      this.currentQuestion.id,
      answer,
      this.timeRemaining,
      this.currentQuestion.options[answer]
    ).subscribe({
      next: (validation) => {
        // show result and include reference if returned
        this.questionCard?.showResult(validation.isCorrect, validation.points);
        if (validation && (validation as any).reference) {
          // pass reference into the question object so the card can display it
          if (this.currentQuestion) {
            (this.currentQuestion as any).reference = (validation as any).reference;
          }
        }
        
        this.triviaService.updateTeamScore(
          this.sessionId,
          this.currentTeam!.id,
          validation.points,
          validation.isCorrect
        ).subscribe({
          next: (session) => {
            this.teams = session.teams;
            this.currentTeam = session.teams[this.currentTeamIndex];
            this.updateLeaderboard();
            
            // wait 10 seconds so the player can read the feedback & reference (or press 'Siguiente pregunta')
            this.clearAdvanceTimeout();
            this.advanceTimeout = setTimeout(() => {
              this.nextTurn();
            }, 10000);
          }
        });
      },
      error: (err) => console.error('Error validating answer:', err)
    });
  }

  handleTimeUp(): void {
    if (this.questionCard && !this.questionCard.answered) {
      this.questionCard.showResult(false, 0);
      
      if (this.currentTeam) {
        this.triviaService.updateTeamScore(
          this.sessionId,
          this.currentTeam.id,
          0,
          false
        ).subscribe({
          next: (session) => {
            this.teams = session.teams;
            this.currentTeam = session.teams[this.currentTeamIndex];
            this.updateLeaderboard();
            
            this.clearAdvanceTimeout();
            this.advanceTimeout = setTimeout(() => {
              this.nextTurn();
            }, 10000);
          }
        });
      }
    }
  }

  // Called when user clicks the 'Siguiente pregunta' button on the question card
  handleNextManual(): void {
    this.clearAdvanceTimeout();
    this.nextTurn();
  }

  clearAdvanceTimeout(): void {
    if (this.advanceTimeout) {
      clearTimeout(this.advanceTimeout);
      this.advanceTimeout = null;
    }
  }

  onTimerTick(time: number): void {
    this.timeRemaining = time;
  }

  nextTurn(): void {
    this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length;
    this.currentTeam = this.teams[this.currentTeamIndex];
    this.loadNextQuestion();
  }

  // Immediately end the match and show final podium
  finishGame(): void {
    // stop any pending auto-advance
    this.clearAdvanceTimeout();
    // stop timer if running
    try {
      this.timerComponent?.stopTimer();
    } catch (e) {
      // ignore if timer not present
    }
    // fetch latest leaderboard and go to final screen
    // Attempt to finalize session on backend, then end locally
    if (this.sessionId) {
      this.triviaService.finalizeSession(this.sessionId).subscribe({
        next: () => {
          // exit presentation mode when finishing
          if (this.isPresenting) {
            this.exitFullscreen();
          }
          this.updateLeaderboard();
          this.endGame();
        },
        error: () => {
          // if finalize fails, still end locally
          if (this.isPresenting) {
            this.exitFullscreen();
          }
          this.updateLeaderboard();
          this.endGame();
        }
      });
    } else {
      if (this.isPresenting) {
        this.exitFullscreen();
      }
      this.updateLeaderboard();
      this.endGame();
    }
  }

  togglePresent(): void {
    if (!this.isPresenting) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  enterFullscreen(): void {
    const el = this.boardContainer?.nativeElement;
    if (!el) return;

    // preserve current inline background so we can restore it
    this._originalBackground = el.style.backgroundColor || '';

    // compute the effective background color and apply it explicitly so fullscreen doesn't show black
    try {
      const computedBg = window.getComputedStyle(el).backgroundColor;
      if (computedBg) el.style.backgroundColor = computedBg;
    } catch (e) {
      // ignore if getComputedStyle not available
    }

    // ensure it fills the viewport
    el.style.minHeight = '100vh';

    if (el.requestFullscreen) {
      el.requestFullscreen();
      this.isPresenting = true;
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
      this.isPresenting = true;
    }
  }

  exitFullscreen(): void {
    const el = this.boardContainer?.nativeElement;
    if (document.exitFullscreen) {
      document.exitFullscreen();
      this.isPresenting = false;
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
      this.isPresenting = false;
    }

    // restore original inline styles
    try {
      if (el) {
        el.style.backgroundColor = this._originalBackground || '';
        el.style.minHeight = '';
      }
    } catch (e) {
      // ignore
    }
  }

  updateLeaderboard(): void {
    this.triviaService.getLeaderboard(this.sessionId).subscribe({
      next: (leaderboard) => {
        this.leaderboard = leaderboard;
      }
    });
  }

  endGame(): void {
    this.updateLeaderboard();
    this.gameState = GameState.FINAL;
  }

  resetGame(): void {
    this.gameState = GameState.SETUP;
    this.teams = [];
    this.clearAdvanceTimeout();
    this.leaderboard = [];
    this.currentQuestion = null;
    this.currentQuestionNumber = 0;
    this.usedQuestionIds = [];
    this.addTeam();
    this.addTeam();
    // exit presentation if active
    if (this.isPresenting) {
      this.exitFullscreen();
    }
    this.triviaService.resetGame();
  }
}
