import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {
  eventForm: FormGroup;
  isEditMode = false;
  eventId: string | null = null;
  successMessage = '';
  errorMessage = '';
  isLoading = false;

  statuses = [
    { value: 'UPCOMING', label: 'Upcoming' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'COMPLETED', label: 'Completed' }
  ];

  allTeams: any[] = [];
  allQuestions: any[] = [];
  selectedTeamIds: string[] = [];
  selectedQuestionIds: string[] = [];

  constructor(
    private fb: FormBuilder,
    private eventService: EventService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: ['UPCOMING', Validators.required]
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    
    this.loadTeams();
    this.loadQuestions();

    if (this.eventId) {
      this.isEditMode = true;
      this.loadEvent();
    }
  }

  loadTeams(): void {
    this.eventService.getAllTeams().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.allTeams = response.data.teams || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading teams:', error);
      }
    });
  }

  loadQuestions(): void {
    this.eventService.getAllQuestions(100).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.allQuestions = response.data.questions || [];
        }
      },
      error: (error: any) => {
        console.error('Error loading questions:', error);
      }
    });
  }

  loadEvent(): void {
    if (!this.eventId) return;

    this.isLoading = true;
    this.eventService.getEventById(this.eventId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const event = response.data.event;
          
          // Format dates for input[type="datetime-local"]
          const startDate = new Date(event.startDate).toISOString().slice(0, 16);
          const endDate = new Date(event.endDate).toISOString().slice(0, 16);

          this.eventForm.patchValue({
            name: event.name,
            description: event.description,
            startDate: startDate,
            endDate: endDate,
            status: event.status
          });

          // Set selected teams and questions
          this.selectedTeamIds = event.teams?.map((t: any) => t.id) || [];
          this.selectedQuestionIds = event.questions?.map((q: any) => q.id) || [];
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Failed to load event data';
        console.error('Error loading event:', error);
        this.isLoading = false;
      }
    });
  }

  toggleTeamSelection(teamId: string): void {
    const index = this.selectedTeamIds.indexOf(teamId);
    if (index > -1) {
      this.selectedTeamIds.splice(index, 1);
    } else {
      this.selectedTeamIds.push(teamId);
    }
  }

  isTeamSelected(teamId: string): boolean {
    return this.selectedTeamIds.includes(teamId);
  }

  toggleQuestionSelection(questionId: string): void {
    const index = this.selectedQuestionIds.indexOf(questionId);
    if (index > -1) {
      this.selectedQuestionIds.splice(index, 1);
    } else {
      this.selectedQuestionIds.push(questionId);
    }
  }

  isQuestionSelected(questionId: string): boolean {
    return this.selectedQuestionIds.includes(questionId);
  }

  onSubmit(): void {
    if (this.eventForm.invalid) {
      Object.keys(this.eventForm.controls).forEach(key => {
        this.eventForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = {
      ...this.eventForm.value,
      teamIds: this.selectedTeamIds,
      questionIds: this.selectedQuestionIds
    };

    if (this.isEditMode && this.eventId) {
      this.eventService.updateEvent(this.eventId, formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Event updated successfully!';
            setTimeout(() => {
              this.router.navigate(['/admin/events']);
            }, 1500);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Failed to update event';
          this.isLoading = false;
        }
      });
    } else {
      this.eventService.createEvent(formData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = 'Event created successfully!';
            setTimeout(() => {
              this.router.navigate(['/admin/events']);
            }, 1500);
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Failed to create event';
          this.isLoading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/events']);
  }

  getFieldError(fieldName: string): string {
    const control = this.eventForm.get(fieldName);
    if (control?.touched && control.errors) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
    }
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Event Name',
      description: 'Description',
      startDate: 'Start Date',
      endDate: 'End Date',
      status: 'Status'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.eventForm.get(fieldName);
    return !!(control?.touched && control.invalid);
  }
}
