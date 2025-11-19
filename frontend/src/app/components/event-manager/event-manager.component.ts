import { Component, OnInit } from '@angular/core';
import { EventService } from '../../services/event.service';

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  isActive: boolean;
  createdAt?: string;
  teams?: any[];
  questions?: any[];
}

@Component({
  selector: 'app-event-manager',
  templateUrl: './event-manager.component.html',
  styleUrls: ['./event-manager.component.css']
})
export class EventManagerComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  
  // Form state
  showForm: boolean = false;
  isEditing: boolean = false;
  currentEvent: Event | null = null;
  
  // Form fields
  eventName: string = '';
  eventDescription: string = '';
  eventStartDate: string = '';
  eventEndDate: string = '';
  eventStatus: 'UPCOMING' | 'ACTIVE' | 'COMPLETED' = 'UPCOMING';
  
  // UI state
  loading: boolean = false;
  searchTerm: string = '';
  filterActive: string = 'all'; // 'all', 'active', 'inactive'
  successMessage: string = '';
  errorMessage: string = '';

  constructor(private eventService: EventService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading = true;
    this.eventService.getEvents().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.events = response.data;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading events:', error);
        this.showError('Error al cargar los eventos');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.events];

    // Filter by search term
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(search) ||
        event.description.toLowerCase().includes(search)
      );
    }

    // Filter by active status
    if (this.filterActive === 'active') {
      filtered = filtered.filter(event => event.isActive);
    } else if (this.filterActive === 'inactive') {
      filtered = filtered.filter(event => !event.isActive);
    }

    this.filteredEvents = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  openCreateForm(): void {
    this.resetForm();
    this.showForm = true;
    this.isEditing = false;
  }

  openEditForm(event: Event): void {
    this.currentEvent = event;
    this.eventName = event.name;
    this.eventDescription = event.description;
    // Backend may have date as string, parse it properly
    if (event.date) {
      this.eventStartDate = event.date.split('T')[0];
    }
    this.eventStatus = event.isActive ? 'ACTIVE' : 'UPCOMING';
    this.showForm = true;
    this.isEditing = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.currentEvent = null;
    this.eventName = '';
    this.eventDescription = '';
    this.eventStartDate = '';
    this.eventEndDate = '';
    this.eventStatus = 'UPCOMING';
    this.isEditing = false;
  }

  saveEvent(): void {
    // Validation
    if (!this.eventName.trim()) {
      this.showError('El nombre del evento es requerido');
      return;
    }

    if (!this.eventDescription.trim()) {
      this.showError('La descripción del evento es requerida');
      return;
    }

    if (!this.eventStartDate) {
      this.showError('La fecha de inicio del evento es requerida');
      return;
    }

    this.loading = true;

    // Build event data with correct backend fields
    const eventData: any = {
      name: this.eventName.trim(),
      description: this.eventDescription.trim(),
      startDate: new Date(this.eventStartDate).toISOString(),
      status: this.eventStatus
    };

    // Add endDate if provided
    if (this.eventEndDate) {
      eventData.endDate = new Date(this.eventEndDate).toISOString();
    }

    if (this.isEditing && this.currentEvent) {
      // Update existing event
      this.eventService.updateEvent(this.currentEvent.id, eventData as any).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Evento actualizado exitosamente');
            this.loadEvents();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error updating event:', error);
          this.showError('Error al actualizar el evento');
          this.loading = false;
        }
      });
    } else {
      // Create new event
      this.eventService.createEvent(eventData as any).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Evento creado exitosamente');
            this.loadEvents();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error creating event:', error);
          this.showError('Error al crear el evento');
          this.loading = false;
        }
      });
    }
  }

  deleteEvent(event: Event): void {
    const confirmed = confirm(
      `¿Estás seguro de que deseas eliminar el evento "${event.name}"?\n\nEsto también eliminará todos los juegos, equipos y preguntas asociados.`
    );

    if (!confirmed) return;

    this.loading = true;
    this.eventService.deleteEvent(event.id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess('Evento eliminado exitosamente');
          this.loadEvents();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error deleting event:', error);
        this.showError('Error al eliminar el evento');
        this.loading = false;
      }
    });
  }

  toggleEventStatus(event: Event): void {
    this.loading = true;
    const updatedData = {
      name: event.name,
      description: event.description,
      date: event.date,
      isActive: !event.isActive
    };

    this.eventService.updateEvent(event.id, updatedData as any).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess(`Evento ${!event.isActive ? 'activado' : 'desactivado'} exitosamente`);
          this.loadEvents();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error updating event status:', error);
        this.showError('Error al actualizar el estado del evento');
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  getEventStats(event: Event): string {
    const teams = event.teams?.length || 0;
    const questions = event.questions?.length || 0;
    return `${teams} equipos • ${questions} preguntas`;
  }
}
