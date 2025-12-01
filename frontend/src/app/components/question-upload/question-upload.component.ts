import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ParsedQuestion {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: number;
  category: string;
  difficulty: string;
  points: number;
  timeLimit: number;
  rowNumber: number;
  isValid: boolean;
  errors: string[];
}

interface PreviewResponse {
  success: boolean;
  data: {
    totalRows: number;
    validQuestions: number;
    invalidQuestions: number;
    questions: ParsedQuestion[];
    expectedFormat: any;
  };
  message: string;
}

interface Event {
  id: string;
  name: string;
}

@Component({
  selector: 'app-question-upload',
  templateUrl: './question-upload.component.html',
  styleUrls: ['./question-upload.component.css']
})
export class QuestionUploadComponent implements OnInit {
  @Output() questionsUploaded = new EventEmitter<number>();
  
  // UI State
  currentStep: 'select' | 'preview' | 'result' = 'select';
  isLoading = false;
  uploadProgress = 0;
  errorMessage = '';
  
  // File
  selectedFile: File | null = null;
  dragOver = false;
  
  // Preview data
  previewData: ParsedQuestion[] = [];
  totalRows = 0;
  validCount = 0;
  invalidCount = 0;
  expectedFormat: any = null;
  
  // Options
  events: Event[] = [];
  selectedEventId = '';
  selectedGameMode = 'KAHOOT';
  
  // Result
  savedCount = 0;
  saveErrors: { row: number; error: string }[] = [];

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.http.get<any>(`${this.apiUrl}/api/events`).subscribe({
      next: (response) => {
        if (response.success) {
          this.events = response.data.events || [];
        }
      },
      error: (error) => {
        console.error('Error loading events:', error);
      }
    });
  }

  // ==================== FILE HANDLING ====================
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];
    
    const isValidType = validTypes.includes(file.type) || 
                        file.name.endsWith('.xlsx') || 
                        file.name.endsWith('.xls') ||
                        file.name.endsWith('.csv');
    
    if (!isValidType) {
      this.errorMessage = 'Solo se permiten archivos Excel (.xlsx, .xls) o CSV';
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'El archivo no debe superar los 5MB';
      return;
    }
    
    this.selectedFile = file;
    this.errorMessage = '';
    this.previewFile();
  }

  // ==================== PREVIEW ====================

  previewFile(): void {
    if (!this.selectedFile) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    
    this.http.post<PreviewResponse>(`${this.apiUrl}/api/questions/upload/preview`, formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          const response = event.body;
          if (response?.success) {
            this.previewData = response.data.questions;
            this.totalRows = response.data.totalRows;
            this.validCount = response.data.validQuestions;
            this.invalidCount = response.data.invalidQuestions;
            this.expectedFormat = response.data.expectedFormat;
            this.currentStep = 'preview';
          } else {
            this.errorMessage = response?.message || 'Error al procesar el archivo';
          }
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Preview error:', error);
        this.errorMessage = error.error?.message || 'Error al procesar el archivo';
        this.isLoading = false;
      }
    });
  }

  // ==================== SAVE ====================

  saveQuestions(): void {
    if (!this.selectedFile || this.validCount === 0) return;
    
    this.isLoading = true;
    this.errorMessage = '';
    
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    if (this.selectedEventId) {
      formData.append('eventId', this.selectedEventId);
    }
    formData.append('gameMode', this.selectedGameMode);
    
    this.http.post<any>(`${this.apiUrl}/api/questions/upload/save`, formData).subscribe({
      next: (response) => {
        if (response.success) {
          this.savedCount = response.data.savedCount;
          this.saveErrors = response.data.errors || [];
          this.currentStep = 'result';
          this.questionsUploaded.emit(this.savedCount);
        } else {
          this.errorMessage = response.message || 'Error al guardar las preguntas';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Save error:', error);
        this.errorMessage = error.error?.message || 'Error al guardar las preguntas';
        this.isLoading = false;
      }
    });
  }

  // ==================== UTILITIES ====================

  downloadTemplate(): void {
    window.open(`${this.apiUrl}/api/questions/template`, '_blank');
  }

  reset(): void {
    this.currentStep = 'select';
    this.selectedFile = null;
    this.previewData = [];
    this.totalRows = 0;
    this.validCount = 0;
    this.invalidCount = 0;
    this.errorMessage = '';
    this.uploadProgress = 0;
    this.savedCount = 0;
    this.saveErrors = [];
  }

  goBack(): void {
    if (this.currentStep === 'preview') {
      this.currentStep = 'select';
      this.previewData = [];
    } else if (this.currentStep === 'result') {
      this.reset();
    }
  }

  getValidQuestions(): ParsedQuestion[] {
    return this.previewData.filter(q => q.isValid);
  }

  getInvalidQuestions(): ParsedQuestion[] {
    return this.previewData.filter(q => !q.isValid);
  }

  getDifficultyColor(difficulty: string): string {
    const d = difficulty.toLowerCase();
    if (d === 'facil' || d === 'fácil' || d === 'easy') return 'bg-green-100 text-green-800';
    if (d === 'dificil' || d === 'difícil' || d === 'hard') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  }
}
