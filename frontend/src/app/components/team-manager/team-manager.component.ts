import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';

interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  eventId?: string;
  event?: {
    id: string;
    name: string;
  };
  createdAt?: string;
}

interface Event {
  id: string;
  name: string;
  description?: string;
  status: string;
}

@Component({
  selector: 'app-team-manager',
  templateUrl: './team-manager.component.html',
  styleUrls: ['./team-manager.component.css']
})
export class TeamManagerComponent implements OnInit {
  teams: Team[] = [];
  events: Event[] = [];
  filteredTeams: Team[] = [];
  
  selectedEventId: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Form variables
  showCreateForm: boolean = false;
  showEditForm: boolean = false;
  editingTeam: Team | null = null;
  
  newTeam: Partial<Team> = {
    name: '',
    icon: '🎮',
    color: '#3B82F6',
    eventId: ''
  };
  
  availableIcons = ['🔴', '🔵', '🟢', '🟡', '🟣', '🟠', '⚫', '⚪', '🎮', '⚽', '🏀', '🎯', '🎲', '🎪'];
  availableColors = [
    '#FF0000', '#0000FF', '#00FF00', '#FFFF00', 
    '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444'
  ];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadTeams();
  }

  loadEvents(): void {
    this.adminService.getEvents(1, 100).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.events = response.data.events || response.data;
        }
      },
      error: (error: any) => {
        console.error('Error loading events:', error);
        this.errorMessage = 'Error al cargar eventos';
      }
    });
  }

  loadTeams(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.adminService.getTeams(this.selectedEventId || undefined).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success && response.data) {
          this.teams = response.data.teams || response.data;
          this.filterTeams();
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error loading teams:', error);
        this.errorMessage = 'Error al cargar equipos';
      }
    });
  }

  filterTeams(): void {
    if (!this.selectedEventId) {
      this.filteredTeams = this.teams;
    } else {
      this.filteredTeams = this.teams.filter(team => team.eventId === this.selectedEventId);
    }
  }

  onEventFilterChange(): void {
    this.filterTeams();
  }

  openCreateForm(): void {
    this.showCreateForm = true;
    this.showEditForm = false;
    this.newTeam = {
      name: '',
      icon: '🎮',
      color: '#3B82F6',
      eventId: this.selectedEventId || ''
    };
  }

  closeCreateForm(): void {
    this.showCreateForm = false;
    this.newTeam = {
      name: '',
      icon: '🎮',
      color: '#3B82F6',
      eventId: ''
    };
  }

  createTeam(): void {
    if (!this.newTeam.name || !this.newTeam.icon || !this.newTeam.color) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Crear el equipo usando el endpoint /api/teams
    this.adminService.createTeam(this.newTeam).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = '¡Equipo creado exitosamente!';
        this.closeCreateForm();
        this.loadTeams();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error creating team:', error);
        this.errorMessage = 'Error al crear equipo';
      }
    });
  }

  openEditForm(team: Team): void {
    this.editingTeam = { ...team };
    this.showEditForm = true;
    this.showCreateForm = false;
  }

  closeEditForm(): void {
    this.showEditForm = false;
    this.editingTeam = null;
  }

  updateTeam(): void {
    if (!this.editingTeam || !this.editingTeam.id) return;

    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.updateTeam(this.editingTeam.id, this.editingTeam).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = '¡Equipo actualizado exitosamente!';
        this.closeEditForm();
        this.loadTeams();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error updating team:', error);
        this.errorMessage = 'Error al actualizar equipo';
      }
    });
  }

  deleteTeam(teamId: string): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este equipo?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.adminService.deleteTeam(teamId).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.successMessage = '¡Equipo eliminado exitosamente!';
        this.loadTeams();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error deleting team:', error);
        this.errorMessage = 'Error al eliminar equipo';
      }
    });
  }

  getEventName(eventId?: string): string {
    if (!eventId) return 'Sin evento';
    const event = this.events.find(e => e.id === eventId);
    return event ? event.name : 'Evento no encontrado';
  }
}
