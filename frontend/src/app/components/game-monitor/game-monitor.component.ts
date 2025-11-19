import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameService } from '../../services/game.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface ActiveGame {
  gameId: string;
  mode: string;
  participants: number;
  hasCurrentQuestion: boolean;
  hasActiveTimer: boolean;
}

interface GameDetails {
  id: string;
  name: string;
  mode: string;
  status: string;
  questionsAnswered: number;
  totalQuestions: number;
  participants: number;
  participantsList: any[];
  leaderboard: any[];
}

@Component({
  selector: 'app-game-monitor',
  templateUrl: './game-monitor.component.html',
  styleUrls: ['./game-monitor.component.css']
})
export class GameMonitorComponent implements OnInit, OnDestroy {
  activeGames: ActiveGame[] = [];
  selectedGame: GameDetails | null = null;
  
  isLoading: boolean = false;
  autoRefresh: boolean = true;
  
  private refreshSubscription?: Subscription;

  constructor(private gameService: GameService) {}

  ngOnInit(): void {
    this.loadActiveGames();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  loadActiveGames(): void {
    this.gameService.getActiveRooms().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.activeGames = response.data.rooms;
        }
      },
      error: (error) => {
        console.error('Error loading active games:', error);
      }
    });
  }

  selectGame(gameId: string, mode: string): void {
    this.isLoading = true;
    
    const detailsObservable = mode === 'KAHOOT'
      ? this.gameService.getKahootGame(gameId)
      : this.gameService.getGeopartyGame(gameId);
    
    const leaderboardObservable = mode === 'KAHOOT'
      ? this.gameService.getKahootLeaderboard(gameId)
      : this.gameService.getGeopartyLeaderboard(gameId);

    detailsObservable.subscribe({
      next: (response) => {
        if (response.success) {
          this.selectedGame = response.data.game as GameDetails;
          this.selectedGame.participantsList = response.data.participantsList;
          
          // Load leaderboard
          leaderboardObservable.subscribe({
            next: (leaderboardResponse) => {
              if (leaderboardResponse.success && this.selectedGame) {
                this.selectedGame.leaderboard = leaderboardResponse.data.leaderboard;
              }
              this.isLoading = false;
            },
            error: () => {
              this.isLoading = false;
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading game details:', error);
        this.isLoading = false;
      }
    });
  }

  refreshGameDetails(): void {
    if (this.selectedGame) {
      this.selectGame(this.selectedGame.id, this.selectedGame.mode);
    }
  }

  closeGameDetails(): void {
    this.selectedGame = null;
  }

  startAutoRefresh(): void {
    if (this.autoRefresh) {
      this.refreshSubscription = interval(3000).pipe(
        switchMap(() => this.gameService.getActiveRooms())
      ).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.activeGames = response.data.rooms;
            
            // Refresh selected game if exists
            if (this.selectedGame) {
              this.refreshGameDetails();
            }
          }
        },
        error: (error) => {
          console.error('Auto-refresh error:', error);
        }
      });
    }
  }

  stopAutoRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'WAITING':
        return 'bg-yellow-500';
      case 'IN_PROGRESS':
        return 'bg-green-500';
      case 'FINISHED':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'WAITING':
        return 'Esperando';
      case 'IN_PROGRESS':
        return 'En Progreso';
      case 'FINISHED':
        return 'Finalizado';
      default:
        return status;
    }
  }

  getProgressPercentage(game: GameDetails): number {
    if (game.totalQuestions === 0) return 0;
    return (game.questionsAnswered / game.totalQuestions) * 100;
  }

  getModeIcon(mode: string): string {
    return mode === 'KAHOOT' ? '🎯' : '🌎';
  }

  getModeColor(mode: string): string {
    return mode === 'KAHOOT' ? 'from-purple-600 to-blue-600' : 'from-teal-500 to-cyan-600';
  }

  getRankMedal(rank: number): string {
    return this.gameService.getRankMedal(rank);
  }

  formatGameCode(gameId: string): string {
    return gameId.substring(0, 6).toUpperCase();
  }
}
