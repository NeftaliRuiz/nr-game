import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Event {
  id?: string;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  teamIds?: string[];
  questionIds?: string[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private apiUrl = `${environment.apiUrl}/events`;
  private adminUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getEvents(page: number = 1, limit: number = 100): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get(`${this.apiUrl}`, { params });
  }

  // Get all events without pagination (for dropdowns)
  getAllEvents(): Observable<any> {
    return this.http.get(`${this.apiUrl}?page=1&limit=1000`);
  }

  getEventById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  createEvent(event: Event): Observable<any> {
    return this.http.post(`${this.apiUrl}`, event);
  }

  updateEvent(id: string, event: Partial<Event>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, event);
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Get all teams for selection
  getAllTeams(): Observable<any> {
    return this.http.get(`${this.adminUrl}/teams`);
  }

  // Get all questions for selection
  getAllQuestions(limit: number = 100): Observable<any> {
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', limit.toString());
    return this.http.get(`${this.adminUrl}/questions`, { params });
  }
}
