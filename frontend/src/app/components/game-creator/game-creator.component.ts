import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { EventService } from '../../services/event.service';

interface Event {
  id: string;
  name: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-game-creator',
  templateUrl: './game-creator.component.html',
  styleUrls: ['./game-creator.component.css']
})
export class GameCreatorComponent implements OnInit {
  // Game creation form
  selectedMode: 'KAHOOT' | 'GEOPARTY' | null = null;
  gameName: string = '';
  selectedEventId: string = '';
  totalQuestions: number = 10;
  
  // Events list
  events: Event[] = [];
  
  // Created games list (support multiple simultaneous games)
  createdGames: any[] = [];
  availableGames: any[] = []; // Lista de juegos disponibles para unirse
  showCreationForm: boolean = true;
  
  // Loading states
  isLoading: boolean = false;
  loadingMessage: string = '';
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private gameService: GameService,
    private eventService: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadAvailableGames(); // Cargar juegos disponibles al inicio
  }

  loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (response: any) => {
        // Support multiple response shapes: { success, data: { events: [...] } } or direct array
        const allEvents = (response && response.data && (response.data.events || response.data)) || response || [];
        console.log('Backend response for events (game-creator):', response);
        console.log('All events before filtering:', allEvents);

        // Normalize and filter by status (case-insensitive)
        const normalized = (allEvents || []).map((e: any) => ({
          ...e,
          status: (e.status || '').toString().toLowerCase()
        }));

        this.events = normalized.filter((e: any) => e.status === 'active' || e.status === 'upcoming');
        console.log('Events loaded for game creator (filtered):', this.events);
      },
      error: (error) => {
        console.error('Error loading events:', error);
      }
    });
  }

  selectMode(mode: 'KAHOOT' | 'GEOPARTY'): void {
    this.selectedMode = mode;
    this.resetMessages();
    
    // Set default values based on mode
    if (mode === 'KAHOOT') {
      this.totalQuestions = 10;
    } else {
      this.totalQuestions = 20;
    }
  }

  createGame(): void {
    if (!this.selectedMode) {
      this.errorMessage = 'Por favor selecciona un modo de juego';
      return;
    }

    if (!this.gameName.trim()) {
      this.errorMessage = 'Por favor ingresa un nombre para el juego';
      return;
    }

    if (this.selectedMode === 'KAHOOT' && !this.selectedEventId) {
      this.errorMessage = 'Selecciona un evento con preguntas cargadas para poder crear un Kahoot.';
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Creando juego...';
    this.resetMessages();

    const gameData = {
      name: this.gameName,
      eventId: this.selectedEventId || undefined,
      totalQuestions: this.totalQuestions
    };

    const createObservable = this.selectedMode === 'KAHOOT' 
      ? this.gameService.createKahootGame(gameData)
      : this.gameService.createGeopartyGame(gameData);

    createObservable.subscribe({
      next: (response) => {
        if (response.success) {
          const createdGame = response.data.game;
          // Use roomCode from backend (guaranteed to be unique and 6 characters)
          const gameCode = createdGame.roomCode || createdGame.id.substring(0, 6).toUpperCase();
          
          // Add game to the list with its code
          this.createdGames.push({
            ...createdGame,
            code: gameCode,
            roomCode: createdGame.roomCode, // Store roomCode separately for navigation
            mode: this.selectedMode
          });
          
          this.successMessage = `¡Juego ${this.selectedMode} creado exitosamente! Código: ${gameCode}`;
          this.isLoading = false;
          this.loadingMessage = '';
          
          // Reset form but keep showing it
          this.gameName = '';
          this.selectedEventId = '';
          this.selectedMode = null;
        }
      },
      error: (error) => {
        console.error('Error creating game:', error);
        this.errorMessage = 'Error al crear el juego. Por favor intenta de nuevo.';
        this.isLoading = false;
        this.loadingMessage = '';
      }
    });
  }

  copyGameCode(gameCode: string): void {
    if (gameCode) {
      navigator.clipboard.writeText(gameCode).then(() => {
        alert('¡Código copiado al portapapeles!');
      });
    }
  }

  showQR: Map<string, boolean> = new Map();

  toggleQR(gameId: string): void {
    this.showQR.set(gameId, !this.showQR.get(gameId));
  }

  getGameJoinUrl(code: string): string {
    return `${window.location.origin}/join?code=${code}`;
  }

  goToGame(game: any): void {
    if (game) {
      // Use roomCode for navigation if available (for Geoparty), otherwise use id
      const gameIdentifier = game.roomCode || game.code || game.id;
      const route = game.mode === 'KAHOOT' 
        ? `/game/kahoot/${gameIdentifier}`
        : `/game/geoparty/${gameIdentifier}`;
      
      this.router.navigate([route]);
    }
  }

  removeGame(gameId: string): void {
    this.createdGames = this.createdGames.filter(g => g.id !== gameId);
  }

  resetForm(): void {
    this.selectedMode = null;
    this.gameName = '';
    this.selectedEventId = '';
    this.totalQuestions = 10;
    this.createdGames = [];
    this.showCreationForm = true;
    this.resetMessages();
  }

  resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  getModeIcon(mode: 'KAHOOT' | 'GEOPARTY'): string {
    return mode === 'KAHOOT' ? '🎯' : '🌎';
  }

  getModeColor(mode: 'KAHOOT' | 'GEOPARTY'): string {
    return mode === 'KAHOOT' ? 'purple' : 'cyan';
  }

  // ==================== AVAILABLE GAMES ====================

  loadAvailableGames(): void {
    this.gameService.getActiveRooms().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableGames = response.data.rooms || [];
        }
      },
      error: (error) => {
        console.error('Error loading available games:', error);
      }
    });
  }

  joinAvailableGame(game: any): void {
    const route = game.mode === 'kahoot' 
      ? `/game/kahoot/${game.roomCode}`
      : `/game/geoparty/${game.roomCode}`;
    
    this.router.navigate([route]);
  }

  startGame(game: any): void {
    if (!game.roomCode) {
      this.errorMessage = 'Error: No se encontró el código del juego';
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Iniciando juego...';

    const startObservable = game.mode === 'KAHOOT'
      ? this.gameService.startKahootGame(game.roomCode)
      : this.gameService.startGeopartyGame(game.roomCode);

    startObservable.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = '¡Juego iniciado! Redirigiendo...';
          
          // Navigate to game
          setTimeout(() => {
            this.goToGame(game);
          }, 1000);
        }
        this.isLoading = false;
        this.loadingMessage = '';
      },
      error: (error: any) => {
        console.error('Error starting game:', error);
        this.errorMessage = error.error?.message || 'Error al iniciar el juego';
        this.isLoading = false;
        this.loadingMessage = '';
      }
    });
  }

  shareGame(game: any): void {
    const gameUrl = `${window.location.origin}/join`;
    const message = `🎮 ¡Únete al juego ${game.mode}!\n\nCódigo: ${game.code}\nNombre: ${game.name}\n\nEntra a: ${gameUrl}\nY usa el código: ${game.code}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      this.successMessage = '¡Información del juego copiada al portapapeles!';
      setTimeout(() => this.successMessage = '', 3000);
    }).catch(err => {
      console.error('Error copying to clipboard:', err);
      alert(message); // Fallback: show in alert
    });
  }
}
