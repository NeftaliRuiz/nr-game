import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { AdminService } from '../../services/admin.service';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
}

@Component({
  selector: 'app-game-join',
  templateUrl: './game-join.component.html',
  styleUrls: ['./game-join.component.css']
})
export class GameJoinComponent implements OnInit {
  // Form data
  roomCode: string = '';
  selectedUserId: string = '';
  selectedTeamId: string = '';
  
  // Game info
  gameInfo: any = null;
  
  // Lists
  users: User[] = [];
  teams: Team[] = [];
  
  // State
  loading: boolean = false;
  verifying: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private gameService: GameService,
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.users = response.data.users || response.data || [];
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
      }
    });
  }

  onRoomCodeChange(): void {
    this.errorMessage = '';
    this.gameInfo = null;
    this.teams = [];
    
    // Auto uppercase and limit to 6 characters
    this.roomCode = this.roomCode.toUpperCase().substring(0, 6);
    
    // Verify room code when it has 6 characters
    if (this.roomCode.length === 6) {
      this.verifyRoomCode();
    }
  }

  verifyRoomCode(): void {
    if (this.roomCode.length !== 6) {
      this.errorMessage = 'El código debe tener 6 caracteres';
      return;
    }

    this.verifying = true;
    this.errorMessage = '';

    // Get room info
    this.gameService.getGameRoom(this.roomCode).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.gameInfo = response.data.room;
          console.log('Game info:', this.gameInfo);

          // If it's Kahoot, load teams
          if (this.gameInfo.mode === 'KAHOOT') {
            this.loadTeamsForEvent(this.gameInfo.eventName);
          }

          this.successMessage = `¡Juego encontrado! ${this.gameInfo.name} (${this.gameInfo.mode})`;
        }
        this.verifying = false;
      },
      error: (error) => {
        console.error('Error verifying room code:', error);
        this.errorMessage = 'Código inválido o juego no encontrado';
        this.gameInfo = null;
        this.verifying = false;
      }
    });
  }

  loadTeamsForEvent(eventName: string): void {
    // Get all teams and filter by event if possible
    this.adminService.getTeams().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.teams = response.data || [];
          console.log('Teams loaded:', this.teams);
        }
      },
      error: (error) => {
        console.error('Error loading teams:', error);
        // If teams endpoint doesn't exist, use dummy teams
        this.teams = [
          { id: '1', name: 'Equipo Rojo' },
          { id: '2', name: 'Equipo Azul' },
          { id: '3', name: 'Equipo Verde' },
          { id: '4', name: 'Equipo Amarillo' }
        ];
      }
    });
  }

  joinGame(): void {
    // Validate
    if (!this.roomCode || this.roomCode.length !== 6) {
      this.errorMessage = 'Por favor ingresa un código válido de 6 caracteres';
      return;
    }

    if (!this.selectedUserId) {
      this.errorMessage = 'Por favor selecciona un usuario';
      return;
    }

    if (this.gameInfo?.mode === 'KAHOOT' && !this.selectedTeamId) {
      this.errorMessage = 'Por favor selecciona un equipo';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const joinData: any = {
      userId: this.selectedUserId
    };

    if (this.gameInfo.mode === 'KAHOOT') {
      joinData.teamId = this.selectedTeamId;
    }

    // Call appropriate join method
    const joinObservable = this.gameInfo.mode === 'KAHOOT'
      ? this.gameService.joinKahootGame(this.roomCode, joinData)
      : this.gameService.joinGeopartyGame(this.roomCode, joinData);

    joinObservable.subscribe({
      next: (response: any) => {
        if (response.success) {
          this.successMessage = '¡Te has unido al juego exitosamente!';
          
          // Navigate to game screen after 1 second
          setTimeout(() => {
            const route = this.gameInfo.mode === 'KAHOOT'
              ? `/game/kahoot/${this.roomCode}`
              : `/game/geoparty/${this.roomCode}`;
            
            this.router.navigate([route]);
          }, 1000);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error joining game:', error);
        this.errorMessage = error.error?.message || 'Error al unirse al juego. Por favor intenta de nuevo.';
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.roomCode = '';
    this.selectedUserId = '';
    this.selectedTeamId = '';
    this.gameInfo = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  getModeIcon(mode: string): string {
    return mode === 'KAHOOT' ? '🎯' : '🌍';
  }

  getModeColor(mode: string): string {
    return mode === 'KAHOOT' ? 'bg-purple-500' : 'bg-blue-500';
  }
}
