import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Team {
  id?: string;
  name: string;
  icon: string;
  color: string;
  eventId?: string;
  event?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private apiUrl = `${environment.apiUrl}/teams`;

  constructor(private http: HttpClient) {}

  // Get all teams with optional event filter
  getTeams(eventId?: string, page: number = 1, limit: number = 100): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (eventId) {
      params = params.set('eventId', eventId);
    }

    return this.http.get(`${this.apiUrl}`, { params });
  }

  // Get single team by ID
  getTeamById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  // Create new team
  createTeam(team: Team): Observable<any> {
    return this.http.post(`${this.apiUrl}`, team);
  }

  // Update team
  updateTeam(id: string, team: Partial<Team>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, team);
  }

  // Delete team
  deleteTeam(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
