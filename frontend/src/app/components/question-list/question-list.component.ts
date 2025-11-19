import { Component, OnInit } from '@angular/core';
import { AdminService, Question } from '../../services/admin.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.css']
})
export class QuestionListComponent implements OnInit {
  questions: Question[] = [];
  loading = false;
  error = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  limit = 10;
  total = 0;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loading = true;
    this.error = '';

    this.adminService.getQuestions(this.currentPage, this.limit).subscribe({
      next: (response) => {
        if (response.success) {
          this.questions = response.data.questions;
          this.total = response.data.total;
          this.totalPages = Math.ceil(this.total / this.limit);
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las preguntas';
        this.loading = false;
        console.error(err);
      }
    });
  }

  createQuestion(): void {
    this.router.navigate(['/admin/questions/new']);
  }

  editQuestion(id: string): void {
    this.router.navigate(['/admin/questions/edit', id]);
  }

  deleteQuestion(id: string, question: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar esta pregunta?\n\n"${question}"`)) {
      this.adminService.deleteQuestion(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadQuestions();
          }
        },
        error: (err) => {
          alert('Error al eliminar la pregunta');
          console.error(err);
        }
      });
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadQuestions();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadQuestions();
    }
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getEndRecord(): number {
    return Math.min(this.currentPage * this.limit, this.total);
  }
}
