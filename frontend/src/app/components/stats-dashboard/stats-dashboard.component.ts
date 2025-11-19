import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { interval, Subscription } from 'rxjs';

interface Statistics {
  overview: {
    totalUsers: number;
    totalQuestions: number;
    totalEvents: number;
    totalGames: number;
    totalTeams: number;
    activeGames: number;
  };
  recentActivity: {
    newUsersThisWeek: number;
    gamesPlayedThisWeek: number;
  };
  charts: {
    questionsByDifficulty: Array<{ difficulty: string; count: number }>;
    questionsByCategory: Array<{ category: string; count: number }>;
  };
  games: Array<{
    id: string;
    name: string;
    status: string;
    mode: string;
    createdAt: string;
    event?: { id: string; name: string };
  }>;
}

@Component({
  selector: 'app-stats-dashboard',
  templateUrl: './stats-dashboard.component.html',
  styleUrls: ['./stats-dashboard.component.css']
})
export class StatsDashboardComponent implements OnInit, OnDestroy {
  statistics: Statistics | null = null;
  isLoading = true;
  errorMessage = '';
  private refreshSubscription?: Subscription;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStatistics();
    
    // Auto-refresh every 30 seconds
    this.refreshSubscription = interval(30000).subscribe(() => {
      this.loadStatistics(true);
    });
  }

  ngOnDestroy(): void {
    this.refreshSubscription?.unsubscribe();
  }

  loadStatistics(silent = false): void {
    if (!silent) {
      this.isLoading = true;
      this.errorMessage = '';
    }

    this.adminService.getStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics = response.data;
        } else {
          this.errorMessage = response.message || 'Error al cargar estadísticas';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading statistics:', err);
        this.errorMessage = 'Error al conectar con el servidor';
        this.isLoading = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'waiting': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-green-100 text-green-800',
      'finished': 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getModeBadgeClass(mode: string): string {
    const modeClasses: { [key: string]: string } = {
      'kahoot': 'bg-purple-100 text-purple-800',
      'geoparty': 'bg-blue-100 text-blue-800'
    };
    return modeClasses[mode] || 'bg-gray-100 text-gray-800';
  }

  getDifficultyColor(difficulty: string): string {
    const colors: { [key: string]: string } = {
      'easy': '#10b981',
      'medium': '#f59e0b',
      'hard': '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    
    if (diffInMinutes < 1) return 'Hace menos de 1 minuto';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`;
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'waiting': 'Esperando',
      'in_progress': 'En Progreso',
      'finished': 'Finalizado'
    };
    return labels[status] || status;
  }

  getModeLabel(mode: string): string {
    const labels: { [key: string]: string } = {
      'kahoot': 'Kahoot',
      'geoparty': 'Geoparty'
    };
    return labels[mode] || mode;
  }
}
