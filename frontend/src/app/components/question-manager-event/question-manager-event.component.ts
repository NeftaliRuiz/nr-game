import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { EventService } from '../../services/event.service';

interface Question {
  id?: string;
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  eventId: string;
  round: number;
  gameMode: 'KAHOOT' | 'GEOPARTY' | '';
}

interface Event {
  id: string;
  name: string;
  description: string;
  startDate?: string;
  endDate?: string;
  date?: string; // Legacy support
  status: 'UPCOMING' | 'ACTIVE' | 'COMPLETED';
  isActive?: boolean; // Legacy support
}

@Component({
  selector: 'app-question-manager-event',
  templateUrl: './question-manager-event.component.html',
  styleUrls: ['./question-manager-event.component.css']
})
export class QuestionManagerEventComponent implements OnInit {
  events: Event[] = [];
  questions: Question[] = [];
  filteredQuestions: Question[] = [];

  // Filters
  selectedEventId: string = '';
  selectedGameMode: string = '';
  selectedRound: number | null = null;
  searchTerm: string = '';

  // Form state
  showForm: boolean = false;
  isEditing: boolean = false;
  currentQuestion: Question | null = null;

  // Form fields
  questionText: string = '';
  questionCategory: string = '';
  questionDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  questionPoints: number = 100;
  questionOptions: string[] = ['', '', '', ''];
  questionCorrectAnswer: number = 0;
  questionTimeLimit: number = 30;
  questionEventId: string = '';
  questionRound: number = 1;
  questionGameMode: 'KAHOOT' | 'GEOPARTY' | '' = '';

  // UI state
  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  // Predefined categories
  categories: string[] = [
    'Geografía',
    'Historia',
    'Ciencia',
    'Arte y Cultura',
    'Deportes',
    'Entretenimiento',
    'Tecnología',
    'Música',
    'Cine y TV',
    'Literatura',
    'Naturaleza',
    'Matemáticas',
    'Personalizado'
  ];

  constructor(
    private adminService: AdminService,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    this.loadEvents();
    this.loadQuestions();
  }

  loadEvents(): void {
    this.eventService.getAllEvents().subscribe({
      next: (response: any) => {
        console.log('Backend response for events:', response);
        if (response.success) {
          // Backend returns data.events (not data directly)
          const allEvents = response.data.events || response.data || [];
          console.log('All events before filtering:', allEvents);
          // Filter active events (status === 'ACTIVE' or 'UPCOMING')
          this.events = allEvents.filter((e: Event) => 
            e.status === 'ACTIVE' || e.status === 'UPCOMING'
          );
          console.log('Events loaded for questions (filtered):', this.events);
        }
      },
      error: (error: any) => {
        console.error('Error loading events:', error);
      }
    });
  }

  loadQuestions(): void {
    this.loading = true;
    const params: any = { limit: 1000 };

    if (this.selectedEventId) params.eventId = this.selectedEventId;
    if (this.selectedGameMode) params.gameMode = this.selectedGameMode;
    if (this.selectedRound) params.round = this.selectedRound;

    this.adminService.getQuestions(params).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.questions = response.data.questions;
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading questions:', error);
        this.showError('Error al cargar las preguntas');
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.questions];

    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(q =>
        q.question.toLowerCase().includes(search) ||
        q.category.toLowerCase().includes(search)
      );
    }

    this.filteredQuestions = filtered;
  }

  onFilterChange(): void {
    this.loadQuestions();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  openCreateForm(): void {
    if (!this.selectedEventId) {
      this.showError('Por favor selecciona un evento primero');
      return;
    }

    this.resetForm();
    this.questionEventId = this.selectedEventId;
    this.questionGameMode = this.selectedGameMode as any || '';
    this.questionRound = this.selectedRound || 1;
    this.showForm = true;
    this.isEditing = false;
  }

  openEditForm(question: Question): void {
    this.currentQuestion = question;
    this.questionText = question.question;
    this.questionCategory = question.category;
    this.questionDifficulty = question.difficulty;
    this.questionPoints = question.points;
    this.questionOptions = [...question.options];
    this.questionCorrectAnswer = question.correctAnswer;
    this.questionTimeLimit = question.timeLimit;
    this.questionEventId = question.eventId;
    this.questionRound = question.round || 1;
    this.questionGameMode = question.gameMode || '';
    this.showForm = true;
    this.isEditing = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.resetForm();
  }

  resetForm(): void {
    this.currentQuestion = null;
    this.questionText = '';
    this.questionCategory = '';
    this.questionDifficulty = 'medium';
    this.questionPoints = 100;
    this.questionOptions = ['', '', '', ''];
    this.questionCorrectAnswer = 0;
    this.questionTimeLimit = 30;
    this.questionEventId = '';
    this.questionRound = 1;
    this.questionGameMode = '';
    this.isEditing = false;
  }

  saveQuestion(): void {
    // Validation
    if (!this.questionText.trim()) {
      this.showError('La pregunta es requerida');
      return;
    }

    if (!this.questionCategory.trim()) {
      this.showError('La categoría es requerida');
      return;
    }

    if (!this.questionEventId) {
      this.showError('Debes seleccionar un evento');
      return;
    }

    if (!this.questionGameMode) {
      this.showError('Debes seleccionar un modo de juego');
      return;
    }

    // Validate options
    const validOptions = this.questionOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) {
      this.showError('Debes proporcionar al menos 2 opciones');
      return;
    }

    if (this.questionCorrectAnswer >= validOptions.length) {
      this.showError('La respuesta correcta seleccionada no es válida');
      return;
    }

    this.loading = true;

    const questionData: Question = {
      question: this.questionText.trim(),
      category: this.questionCategory.trim(),
      difficulty: this.questionDifficulty,
      points: this.questionPoints,
      options: validOptions,
      correctAnswer: this.questionCorrectAnswer,
      timeLimit: this.questionTimeLimit,
      eventId: this.questionEventId,
      round: this.questionRound,
      gameMode: this.questionGameMode as 'KAHOOT' | 'GEOPARTY'
    };

    if (this.isEditing && this.currentQuestion) {
      // Update existing question
      this.adminService.updateQuestion(this.currentQuestion.id!, questionData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Pregunta actualizada exitosamente');
            this.loadQuestions();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error updating question:', error);
          this.showError('Error al actualizar la pregunta');
          this.loading = false;
        }
      });
    } else {
      // Create new question
      this.adminService.createQuestion(questionData).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Pregunta creada exitosamente');
            this.loadQuestions();
            this.closeForm();
          }
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error creating question:', error);
          this.showError('Error al crear la pregunta');
          this.loading = false;
        }
      });
    }
  }

  deleteQuestion(question: Question): void {
    const confirmed = confirm(
      `¿Estás seguro de que deseas eliminar esta pregunta?\n\n"${question.question}"`
    );

    if (!confirmed) return;

    this.loading = true;
    this.adminService.deleteQuestion(question.id!).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess('Pregunta eliminada exitosamente');
          this.loadQuestions();
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error deleting question:', error);
        this.showError('Error al eliminar la pregunta');
        this.loading = false;
      }
    });
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getDifficultyLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Media';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  }

  getGameModeIcon(mode: string): string {
    return mode === 'KAHOOT' ? '🎯' : '🌎';
  }

  getGameModeColor(mode: string): string {
    return mode === 'KAHOOT' ? 'bg-purple-100 text-purple-800' : 'bg-cyan-100 text-cyan-800';
  }

  addOption(): void {
    if (this.questionOptions.length < 6) {
      this.questionOptions.push('');
    }
  }

  removeOption(index: number): void {
    if (this.questionOptions.length > 2) {
      this.questionOptions.splice(index, 1);
      if (this.questionCorrectAnswer >= this.questionOptions.length) {
        this.questionCorrectAnswer = this.questionOptions.length - 1;
      }
    }
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

  getEventName(eventId: string): string {
    const event = this.events.find(e => e.id === eventId);
    return event ? event.name : 'Sin evento';
  }

  getAvailableRounds(): number[] {
    return Array.from({ length: 10 }, (_, i) => i + 1);
  }

  // Get option letter (A, B, C, D, etc.)
  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // 65 is 'A' in ASCII
  }
}
