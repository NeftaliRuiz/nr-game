import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subject, takeUntil } from 'rxjs';

interface Cell {
  letter: string;
  row: number;
  col: number;
  isSelected: boolean;
  isFound: boolean;
  foundWordIndex?: number;
  wordIndex?: number;
}

interface Participant {
  id: string;
  userName: string;
  score: number;
  foundWordsCount: number;
  isFinished: boolean;
}

@Component({
  selector: 'app-game-wordsearch',
  templateUrl: './game-wordsearch.component.html',
  styleUrl: './game-wordsearch.component.css'
})
export class GameWordsearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Route params
  roomCode: string = '';
  isJoinMode: boolean = false;
  
  // User data
  userId: string = '';
  userName: string = '';
  participantId: string = '';
  
  // Game state
  gameStatus: 'WAITING' | 'IN_PROGRESS' | 'FINISHED' = 'WAITING';
  grid: Cell[][] = [];
  words: string[] = [];
  foundWords: Set<string> = new Set();
  targetWordsCount: number = 0;
  
  // Selection state
  selectedCells: Cell[] = [];
  isSelecting: boolean = false;
  isGridLocked: boolean = false;
  
  // Touch support
  touchStartCell: Cell | null = null;
  
  // Timer
  timeLimit: number = 300; // 5 minutes default
  timeRemaining: number = 300;
  timerInterval: any;
  
  // Score
  myScore: number = 0;
  myFoundWordsCount: number = 0;
  isFinished: boolean = false;
  completionTime: number | null = null;
  
  // Participants (panel lateral)
  participants: Participant[] = [];
  totalParticipants: number = 0;
  
  // Leaderboard en tiempo real
  leaderboard: Array<{
    rank: number;
    participantId: string;
    userName: string;
    score: number;
    foundWordsCount: number;
    completionTime?: number;
    isFinished: boolean;
  }> = [];
  
  // UI state
  loading: boolean = true;
  error: string = '';
  message: string = '';
  showCreateForm: boolean = false;
  isHost: boolean = false;
  showNamePrompt: boolean = false;
  tempUserName: string = '';
  showPodium: boolean = false;
  
  // Found words history with cell positions
  foundWordsHistory: Array<{
    word: string;
    cells: { row: number; col: number }[];
    timestamp: Date;
  }> = [];
  
  // Create game form
  newGameWords: string = '';
  newGameGridSize: number = 15;
  newGameTimeLimit: number = 300;
  useSharedGrid: boolean = true; // Default to shared grid
  
  // Join game form
  joinRoomCode: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameService: GameService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit(): void {
    // Get room code from URL
    this.roomCode = this.route.snapshot.paramMap.get('roomCode') || '';
    
    // Check if we're in join mode
    this.isJoinMode = this.router.url.includes('/join');
    
    // Get current userName to check if it's valid
    const currentUserName = localStorage.getItem('userName');
    const hostRoom = localStorage.getItem('hostRoom');
    
    // Don't ask for name if you're the host of this room (already created it)
    const isReturningHost = this.roomCode && hostRoom === this.roomCode;
    
    // Show name prompt ONLY for players joining a game, NOT for creators
    // Show if: (joining a room OR in join mode) AND not the host AND no valid userName
    if (!isReturningHost && (this.roomCode || this.isJoinMode) && (!currentUserName || currentUserName === 'Jugador Anónimo')) {
      this.showNamePrompt = true;
      this.loading = false;
      return;
    }
    
    // Get or set userName - for creators, use default if not set
    this.userName = currentUserName || 'Administrador';
    this.userId = localStorage.getItem('userId') || this.generateGuestId();
    
    // Save userId for future use
    localStorage.setItem('userId', this.userId);
    localStorage.setItem('userName', this.userName);
    
    // Add global mouseup event listener for word selection
    document.addEventListener('mouseup', () => this.onMouseUp());
    
    if (this.roomCode) {
      // Check if this user is the host of this room
      const hostRoom = localStorage.getItem('hostRoom');
      console.log('[DEBUG] ngOnInit - roomCode:', this.roomCode, 'hostRoom:', hostRoom, 'match:', hostRoom === this.roomCode);
      if (hostRoom === this.roomCode) {
        this.isHost = true;
        console.log('[DEBUG] isHost set to TRUE, loading game data...');
        // Host loads data and sets up websocket without joining as player
        this.loadGameData();
        this.setupWebSocketAsHost();
      } else {
        // Regular player joins the game
        this.joinGame();
      }
    } else if (this.isJoinMode) {
      // Show join form only
      this.showCreateForm = true;
      this.loading = false;
    } else {
      // Creating a new game - show form directly, admin doesn't need to enter name first
      this.showCreateForm = true;
      this.loading = false;
    }
  }

  clearLocalStorage(): void {
    localStorage.clear();
    window.location.href = '/game/wordsearch';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTimer();
    
    // Remove global mouseup listener
    document.removeEventListener('mouseup', () => this.onMouseUp());
    
    if (this.roomCode && this.websocketService.isConnected()) {
      this.websocketService.leaveRoom(this.roomCode);
      this.websocketService.disconnect();
    }
  }

  // ==================== GAME CREATION ====================

  createGame(): void {
    if (!this.newGameWords.trim()) {
      this.error = 'Ingresa al menos una palabra';
      return;
    }

    const words = this.newGameWords
      .split(',')
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length > 0);

    if (words.length < 3) {
      this.error = 'Ingresa al menos 3 palabras';
      return;
    }

    this.loading = true;
    this.error = '';

    this.gameService.createWordSearchGame({
      name: `Sopa de Letras - ${this.userName}`,
      words,
      gridSize: this.newGameGridSize,
      timeLimit: this.newGameTimeLimit,
      useSharedGrid: this.useSharedGrid
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data.game.roomCode) {
            this.roomCode = response.data.game.roomCode;
            this.isHost = true;
            // Mark this user as host of this room
            localStorage.setItem('hostRoom', this.roomCode);
            this.router.navigate(['/game/wordsearch', this.roomCode]);
            // Host doesn't join as player, just loads game data
            this.loadGameData();
            this.setupWebSocketAsHost();
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al crear el juego';
          this.loading = false;
        }
      });
  }

  // ==================== GAME JOIN ====================

  joinGame(): void {
    this.loading = true;
    this.error = '';

    this.gameService.joinWordSearchGame(this.roomCode, this.userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data.participant) {
            this.participantId = response.data.participant.id;
            console.log('Joined successfully:', this.userName, this.participantId);
            this.setupWebSocket();
            this.loadGameData();
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al unirse al juego';
          this.loading = false;
        }
      });
  }

  // ==================== LOAD GAME DATA ====================

  loadGameData(): void {
    // Load game details
    this.gameService.getWordSearchGame(this.roomCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Game data received:', response);
          if (response.success) {
            this.words = response.data.game.words;
            this.targetWordsCount = this.words.length;
            this.gameStatus = (response.data.game.status as string).toUpperCase() as any;
            this.timeLimit = response.data.game.timeLimit;
            this.timeRemaining = response.data.game.timeLimit;
            this.participants = response.data.participantsList || [];
            this.totalParticipants = response.data.participants;
            
            console.log('[DEBUG] Game state - status:', this.gameStatus, 'isHost:', this.isHost, 'participants:', this.participants);
            
            if (this.gameStatus === 'IN_PROGRESS') {
              this.loadPlayerGrid();
            }
          }
          this.loading = false;
          console.log('[DEBUG] loading set to false, showCreateForm:', this.showCreateForm, 'isHost:', this.isHost);
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al cargar el juego';
          this.loading = false;
        }
      });

    // Load leaderboard
    this.loadLeaderboard();
  }

  loadPlayerGrid(): void {
    this.gameService.getPlayerGrid(this.roomCode, this.participantId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.buildGridFromArray(response.data.grid);
            
            // Try to restore from localStorage first
            const storageKey = `wordsearch_${this.roomCode}_${this.participantId}`;
            const savedProgress = localStorage.getItem(storageKey);
            
            if (savedProgress) {
              try {
                const progress = JSON.parse(savedProgress);
                this.foundWords = new Set(progress.foundWords || []);
                this.foundWordsHistory = progress.foundWordsHistory || [];
                this.myScore = progress.myScore || 0;
                this.myFoundWordsCount = progress.myFoundWordsCount || 0;
                
                // Remark cells as found
                this.foundWordsHistory.forEach((item, wordIndex) => {
                  item.cells.forEach(cellPos => {
                    const cell = this.grid[cellPos.row]?.[cellPos.col];
                    if (cell) {
                      cell.isFound = true;
                      cell.wordIndex = wordIndex;
                    }
                  });
                });
                
                console.log('[RESTORE] Restored progress from localStorage:', this.foundWords.size, 'words');
              } catch (e) {
                console.error('[RESTORE] Error parsing saved progress:', e);
                // Fallback to server data
                this.foundWords = new Set(response.data.foundWords);
                this.myFoundWordsCount = this.foundWords.size;
              }
            } else {
              // Use server data if no local storage
              this.foundWords = new Set(response.data.foundWords);
              this.myFoundWordsCount = this.foundWords.size;
            }
            
            this.startTimer();
          }
        },
        error: (err) => {
          console.error('Error loading grid:', err);
        }
      });
  }

  buildGridFromArray(gridArray: string[][]): void {
    this.grid = gridArray.map((row, rowIndex) => 
      row.map((letter, colIndex) => ({
        letter,
        row: rowIndex,
        col: colIndex,
        isSelected: false,
        isFound: false
      }))
    );
  }

  loadLeaderboard(): void {
    this.gameService.getWordSearchLeaderboard(this.roomCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.leaderboard = response.data.leaderboard;
            
            // Update my stats
            const myEntry = this.leaderboard.find(e => e.participantId === this.participantId);
            if (myEntry) {
              this.myScore = myEntry.score;
              this.myFoundWordsCount = myEntry.foundWordsCount;
              this.isFinished = myEntry.isFinished;
              if (myEntry.completionTime) {
                this.completionTime = myEntry.completionTime;
              }
            }
          }
        },
        error: (err) => {
          console.error('Error loading leaderboard:', err);
        }
      });
  }

  // ==================== WEBSOCKET ====================

  setupWebSocketAsHost(): void {
    // Host connects to WebSocket but doesn't join as player (autoJoin = false)
    this.websocketService.connect(this.roomCode, 'host', this.userName, 'WORDSEARCH', false);

    // Admin must join the Socket.IO room to receive events
    setTimeout(() => {
      this.websocketService.joinRoom(this.roomCode);
      console.log('[DEBUG] Admin joined Socket.IO room:', this.roomCode);
    }, 500);

    // Listen to all events for admin view
    this.websocketService.on('participant-joined')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('[ADMIN] participant-joined event:', data);
        this.message = `${data.userName} se unió al juego`;
        this.totalParticipants = data.totalParticipants;
        this.loadGameData();
        this.loadLeaderboard();
        setTimeout(() => this.message = '', 3000);
      });

    this.websocketService.on('game-started')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.message = 'Juego iniciado';
        this.gameStatus = 'IN_PROGRESS';
        this.timeRemaining = data.timeLimit || 300; // Set initial time from backend
        this.loadLeaderboard();
        setTimeout(() => this.message = '', 3000);
      });

    this.websocketService.on('word-found')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        console.log('[ADMIN] Word found event received:', data);
        this.message = `${data.userName} encontró "${data.word}" (${data.foundCount}/${data.totalWords})`;
        this.loadGameData(); // Reload game data to update participants list
        this.loadLeaderboard(); // Reload leaderboard
        setTimeout(() => this.message = '', 3000);
      });

    // Listen to timer updates
    this.websocketService.on('timer-tick')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.timeRemaining = data.timeRemaining;
      });
  }

  setupWebSocket(): void {
    // Connect to WebSocket first
    this.websocketService.connect(this.roomCode, this.participantId, this.userName, 'WORDSEARCH');

    // Wait for connection then join room
    setTimeout(() => {
      this.websocketService.joinRoom(this.roomCode);
    }, 500);

    // Participant joined
    this.websocketService.on('participant-joined')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.message = `${data.userName} se unió al juego`;
        this.totalParticipants = data.totalParticipants;
        this.loadGameData(); // Refresh participants list
        setTimeout(() => this.message = '', 3000);
      });

    // Game started
    this.websocketService.on('game-started')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.message = '¡El juego ha comenzado!';
        this.gameStatus = 'IN_PROGRESS';
        this.timeRemaining = data.timeLimit || 300; // Set initial time from backend
        this.loadPlayerGrid();
        setTimeout(() => this.message = '', 3000);
      });

    // Word found by any player
    this.websocketService.on('word-found')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        if (data.participantId !== this.participantId) {
          this.message = `${data.userName} encontró "${data.word}" (${data.foundWordsCount}/${this.targetWordsCount})`;
          setTimeout(() => this.message = '', 3000);
        }
        this.loadLeaderboard(); // Update real-time leaderboard
      });

    // Leaderboard updated
    this.websocketService.on('leaderboard-updated')
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: any) => {
        this.leaderboard = data.leaderboard;
        
        // Update my stats
        const myEntry = this.leaderboard.find(e => e.participantId === this.participantId);
        if (myEntry) {
          this.myScore = myEntry.score;
          this.myFoundWordsCount = myEntry.foundWordsCount;
          this.isFinished = myEntry.isFinished;
          if (myEntry.completionTime) {
            this.completionTime = myEntry.completionTime;
            this.stopTimer();
          }
        }
      });

    // Game ended
    this.websocketService.on('game-ended')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.gameStatus = 'FINISHED';
        this.isGridLocked = true; // Lock grid when game ends
        this.message = '¡Juego terminado!';
      });
  }

  // ==================== GAME START ====================

  startGame(): void {
    if (!this.isHost) {
      this.error = 'Solo el anfitrión puede iniciar el juego';
      return;
    }

    this.loading = true;
    this.gameService.startWordSearchGame(this.roomCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.gameStatus = 'IN_PROGRESS';
            // Timer is now managed by backend, no need to start local timer
            this.loadLeaderboard(); // Load leaderboard for admin
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = err.error?.message || 'Error al iniciar el juego';
          this.loading = false;
        }
      });
  }

  // ==================== TIMER ====================

  startTimer(): void {
    // Timer is now fully managed by backend via WebSocket
    // This method is kept for compatibility but does nothing
    // Time updates come from 'timer-tick' events
  }

  stopTimer(): void {
    // Timer is managed by backend, no local interval to clear
    // This method is kept for compatibility
  }
  
  // Finish game manually (admin only)
  finishGame(): void {
    if (!this.isHost) return;
    
    this.gameService.finishWordSearchGame(this.roomCode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.gameStatus = 'FINISHED';
            this.isGridLocked = true;
            this.stopTimer();
            this.message = 'Juego finalizado por el administrador';
            this.loadLeaderboard();
          }
        },
        error: (err) => {
          console.error('Error finishing game:', err);
        }
      });
  }
  
  // Start new game (clear localStorage and redirect)
  newGame(): void {
    // Clear localStorage for this room
    const storageKey = `wordsearch_${this.roomCode}_${this.participantId}`;
    localStorage.removeItem(storageKey);
    localStorage.removeItem('hostRoom');
    
    // Reset state
    this.foundWords.clear();
    this.foundWordsHistory = [];
    this.myScore = 0;
    this.myFoundWordsCount = 0;
    this.isFinished = false;
    this.isGridLocked = false;
    this.gameStatus = 'WAITING';
    
    // Redirect to wordsearch game selection
    this.router.navigate(['/game/wordsearch']);
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // ==================== WORD SELECTION ====================

  onMouseDown(cell: Cell): void {
    console.log('[MOUSE] onMouseDown - gameStatus:', this.gameStatus, 'isFinished:', this.isFinished, 'isHost:', this.isHost);
    if (this.isGridLocked || this.gameStatus !== 'IN_PROGRESS' || this.isFinished || this.isHost) return;
    if (cell.isFound) return; // Can't select already found cells
    
    this.isSelecting = true;
    this.clearSelection(); // Always clear previous selection
    cell.isSelected = true;
    this.selectedCells = [cell];
    console.log('[MOUSE] Selection started, cell:', cell.row, cell.col, cell.letter);
  }

  onMouseEnter(cell: Cell): void {
    if (!this.isSelecting || this.gameStatus !== 'IN_PROGRESS' || this.isFinished) return;
    
    // Don't do anything if we haven't started a selection
    if (this.selectedCells.length === 0) return;
    
    // Check if selection is valid (straight line in any direction)
    const firstCell = this.selectedCells[0];
    
    // If hovering over the first cell, do nothing
    if (firstCell.row === cell.row && firstCell.col === cell.col) return;
    
    const isValidSelection = this.isValidLineSelection(firstCell, cell);
    
    if (isValidSelection) {
      // Clear previous selection highlighting
      this.clearSelection();
      
      // Add all cells in the line
      this.selectedCells = this.getCellsInLine(firstCell, cell);
      this.selectedCells.forEach(c => c.isSelected = true);
    }
  }

  onMouseUp(): void {
    console.log('[MOUSE] onMouseUp - isSelecting:', this.isSelecting, 'selectedCells:', this.selectedCells.length);
    if (!this.isSelecting || this.gameStatus !== 'IN_PROGRESS' || this.isFinished) return;
    
    this.isSelecting = false;
    
    // Only check if we have more than one cell selected
    if (this.selectedCells.length > 1) {
      console.log('[MOUSE] Checking word...');
      this.checkSelectedWord();
    } else {
      console.log('[MOUSE] Too few cells, clearing selection');
      this.clearSelection();
    }
  }

  isValidLineSelection(start: Cell, end: Cell): boolean {
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;
    
    // Same cell
    if (rowDiff === 0 && colDiff === 0) return true;
    
    // Horizontal
    if (rowDiff === 0) return true;
    
    // Vertical
    if (colDiff === 0) return true;
    
    // Diagonal
    if (Math.abs(rowDiff) === Math.abs(colDiff)) return true;
    
    return false;
  }

  getCellsInLine(start: Cell, end: Cell): Cell[] {
    const cells: Cell[] = [];
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;
    const distance = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
    
    const rowStep = distance > 0 ? rowDiff / distance : 0;
    const colStep = distance > 0 ? colDiff / distance : 0;
    
    for (let i = 0; i <= distance; i++) {
      const row = Math.round(start.row + rowStep * i);
      const col = Math.round(start.col + colStep * i);
      cells.push(this.grid[row][col]);
    }
    
    return cells;
  }

  clearSelection(): void {
    this.grid.forEach(row => 
      row.forEach(cell => {
        // Only clear selection, don't touch found words
        if (!cell.isFound) {
          cell.isSelected = false;
        }
      })
    );
    this.selectedCells = [];
  }

  checkSelectedWord(): void {
    if (this.selectedCells.length < 2) {
      this.clearSelection();
      return;
    }
    
    const selectedWord = this.selectedCells.map(c => c.letter).join('').toUpperCase();
    const reversedWord = selectedWord.split('').reverse().join('');
    
    console.log('Selected word:', selectedWord, 'Available words:', this.words);
    
    // Check if word matches any target word (forward or backward)
    const matchedWord = this.words.find(w => 
      w.toUpperCase() === selectedWord || w.toUpperCase() === reversedWord
    );
    
    if (matchedWord && !this.foundWords.has(matchedWord)) {
      this.submitWord(matchedWord);
    } else {
      console.log('Word not found or already found');
      this.clearSelection();
    }
  }

  submitWord(word: string): void {
    this.gameService.submitFoundWord(this.roomCode, this.participantId, word)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data.isValid) {
            this.foundWords.add(word);
            this.myScore = response.data.participant.score;
            this.myFoundWordsCount = response.data.participant.foundWordsCount;
            
            // Save to history
            this.foundWordsHistory.push({
              word: word,
              cells: this.selectedCells.map(c => ({ row: c.row, col: c.col })),
              timestamp: new Date()
            });
            
            // Mark cells as found with word index
            const wordIndex = this.foundWordsHistory.length - 1;
            this.selectedCells.forEach(cell => {
              cell.isFound = true;
              cell.foundWordIndex = wordIndex;
              cell.wordIndex = wordIndex;
            });
            
            // Save progress to localStorage
            const storageKey = `wordsearch_${this.roomCode}_${this.participantId}`;
            localStorage.setItem(storageKey, JSON.stringify({
              foundWords: Array.from(this.foundWords),
              foundWordsHistory: this.foundWordsHistory,
              myScore: this.myScore,
              myFoundWordsCount: this.myFoundWordsCount
            }));
            console.log('[SAVE] Saved progress to localStorage:', word);
            
            this.message = `Palabra encontrada: ${word} (+${response.data.points} puntos)`;
            setTimeout(() => this.message = '', 3000);
            
            // Check if finished
            if (this.myFoundWordsCount === this.targetWordsCount) {
              this.isFinished = true;
              this.completionTime = response.data.participant.completionTime || null;
              this.stopTimer();
              this.message = '¡Completaste todas las palabras!';
            }
          }
          this.clearSelection();
        },
        error: (err) => {
          console.error('Error submitting word:', err);
          this.clearSelection();
        }
      });
  }

  // ==================== UTILITIES ====================

  generateGuestId(): string {
    const userName = this.userName || 'Guest';
    return `guest_${userName.replace(/\s+/g, '_')}_${Date.now()}`;
  }

  isWordFound(word: string): boolean {
    return this.foundWords.has(word);
  }

  getRankColor(rank: number): string {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-600';
      default: return 'text-gray-300';
    }
  }

  getRankIcon(rank: number): string {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  }

  getProgressPercentage(foundCount: number): number {
    return (foundCount / this.targetWordsCount) * 100;
  }

  copyRoomCode(): void {
    navigator.clipboard.writeText(this.roomCode);
    this.message = 'Código copiado al portapapeles';
    setTimeout(() => this.message = '', 2000);
  }

  showQR: boolean = false;

  toggleQR(): void {
    this.showQR = !this.showQR;
  }

  getGameJoinUrl(): string {
    return `${window.location.origin}/game/wordsearch/${this.roomCode}`;
  }

  shareGame(): void {
    const url = `${window.location.origin}/game/wordsearch/${this.roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Únete a mi Sopa de Letras',
        text: `Código de sala: ${this.roomCode}`,
        url
      });
    } else {
      navigator.clipboard.writeText(url);
      this.message = '¡Link copiado al portapapeles!';
      setTimeout(() => this.message = '', 3000);
    }
  }

  confirmUserName(): void {
    if (!this.tempUserName.trim()) {
      this.error = 'Por favor ingresa tu nombre';
      setTimeout(() => this.error = '', 3000);
      return;
    }
    
    this.userName = this.tempUserName.trim();
    localStorage.setItem('userName', this.userName);
    
    // Generate userId with the name
    this.userId = this.generateGuestId();
    localStorage.setItem('userId', this.userId);
    
    this.showNamePrompt = false;
    
    if (this.roomCode) {
      // Joining an existing game
      this.loading = true;
      const hostRoom = localStorage.getItem('hostRoom');
      if (hostRoom === this.roomCode) {
        this.isHost = true;
        this.loadGameData();
        this.setupWebSocketAsHost();
      } else {
        this.joinGame();
      }
    } else {
      // Creating a new game - show form
      this.showCreateForm = true;
      this.loading = false;
    }
  }

  joinWithCode(): void {
    if (!this.joinRoomCode.trim()) {
      this.error = 'Ingresa un código de sala';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    if (!this.tempUserName.trim()) {
      this.error = 'Ingresa tu nombre';
      setTimeout(() => this.error = '', 3000);
      return;
    }

    // Save user name
    this.userName = this.tempUserName.trim();
    localStorage.setItem('userName', this.userName);

    // Navigate to game room
    const code = this.joinRoomCode.trim().toUpperCase();
    this.router.navigate(['/game/wordsearch', code]);
  }
  
  // ==================== TOUCH SUPPORT FOR MOBILE ====================
  
  onTouchStart(event: TouchEvent, cell: Cell): void {
    event.preventDefault();
    if (this.isGridLocked || this.gameStatus !== 'IN_PROGRESS' || this.isFinished || this.isHost) return;
    if (cell.isFound) return;
    
    this.touchStartCell = cell;
    this.isSelecting = true;
    this.clearSelection();
    cell.isSelected = true;
    this.selectedCells = [cell];
    console.log('[TOUCH] Selection started:', cell.row, cell.col);
  }
  
  onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isSelecting || !this.touchStartCell) return;
    
    // Get the element under the touch point
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (!element) return;
    
    // Extract row and col from data attributes
    const row = parseInt(element.getAttribute('data-row') || '-1');
    const col = parseInt(element.getAttribute('data-col') || '-1');
    
    if (row === -1 || col === -1) return;
    
    const cell = this.grid[row]?.[col];
    if (!cell || cell.isFound) return;
    
    // Check if this is a valid line selection
    const isValidSelection = this.isValidLineSelection(this.touchStartCell, cell);
    
    if (isValidSelection) {
      this.clearSelection();
      const cells = this.getCellsInLine(this.touchStartCell, cell);
      cells.forEach(c => {
        c.isSelected = true;
        this.selectedCells.push(c);
      });
    }
  }
  
  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isSelecting) return;
    
    this.isSelecting = false;
    this.touchStartCell = null;
    
    if (this.selectedCells.length > 1) {
      console.log('[TOUCH] Checking word...');
      this.checkSelectedWord();
    } else {
      this.clearSelection();
    }
  }
}

