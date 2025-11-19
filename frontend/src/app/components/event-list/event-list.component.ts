import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EventService } from '../../services/event.service';

interface Event {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  teams?: any[];
  questions?: any[];
  createdAt: Date;
}

@Component({
  selector: 'app-event-list',
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css']
})
export class EventListComponent implements OnInit {
  events: Event[] = [];
  isLoading = false;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  total = 0;

  constructor(
    private eventService: EventService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.eventService.getEvents(this.currentPage, this.limit).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.events = response.data.events;
          this.total = response.data.pagination.total;
          this.currentPage = response.data.pagination.page;
          this.totalPages = response.data.pagination.totalPages;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load events';
        console.error('Error loading events:', error);
        this.isLoading = false;
      }
    });
  }

  createEvent(): void {
    this.router.navigate(['/admin/events/new']);
  }

  editEvent(eventId: string): void {
    this.router.navigate(['/admin/events/edit', eventId]);
  }

  deleteEvent(eventId: string): void {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    this.eventService.deleteEvent(eventId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.loadEvents();
        }
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to delete event';
        console.error('Error deleting event:', error);
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: { [key: string]: string } = {
      'UPCOMING': 'bg-blue-100 text-blue-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'COMPLETED': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadEvents();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadEvents();
    }
  }

  getStartRecord(): number {
    return (this.currentPage - 1) * this.limit + 1;
  }

  getEndRecord(): number {
    const end = this.currentPage * this.limit;
    return end > this.total ? this.total : end;
  }
}
