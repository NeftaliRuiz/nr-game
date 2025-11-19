import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Question } from '../../models/question.model';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-question-card',
  template: `
    <div class="card max-w-4xl mx-auto" @fadeIn *ngIf="question">
      <!-- Category badge (hidden when empty) -->
      <div class="flex items-center justify-between mb-6">
        <ng-container *ngIf="categoryName">
          <span 
            class="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 text-white"
            [style.background-color]="categoryColor + '30'"
            [style.border]="'2px solid ' + categoryColor"
          >
            <span class="text-2xl">{{ categoryIcon }}</span>
            {{ categoryName }}
          </span>
        </ng-container>
        <span class="px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white">
          {{ question.points }} puntos
        </span>
      </div>

      <!-- Question -->
      <h2 class="text-2xl md:text-3xl font-bold mb-8 text-center">
        {{ question.question }}
      </h2>

      <!-- Options -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          *ngFor="let option of question.options; let i = index"
          (click)="selectAnswer(i)"
          [disabled]="answered"
          [ngClass]="{
            'option-btn': true,
            'selected': selectedAnswer === i && !answered,
            'correct': answered && i === question.correctAnswer,
            'incorrect': answered && selectedAnswer === i && i !== question.correctAnswer
          }"
          class="group"
        >
          <div class="flex items-center gap-3">
            <span class="text-xl font-bold text-white">
              {{ ['A', 'B', 'C', 'D'][i] }}
            </span>
            <span class="text-lg text-white">{{ option }}</span>
          </div>
        </button>
      </div>

      <!-- Feedback -->
  <div *ngIf="showFeedback" class="mt-6 p-4 rounded-xl text-center" @fadeIn>
        <div *ngIf="isCorrect" class="text-success text-xl font-bold">
          ✅ ¡Correcto! +{{ earnedPoints }} puntos
          <span *ngIf="streak > 1" class="text-sm ml-2">🔥 Racha: {{ streak }}</span>
          <div *ngIf="question?.reference" class="text-sm text-white/80 mt-2">Referencia: {{ question?.reference }}</div>
        </div>
        <div *ngIf="!isCorrect" class="text-danger text-xl font-bold">
          ❌ Incorrecto. La respuesta correcta era: {{ question.options[question.correctAnswer] }}
          <div *ngIf="question?.reference" class="text-sm text-white/80 mt-2">Referencia: {{ question?.reference }}</div>
        </div>
        <div class="mt-4">
          <button (click)="onNext()" class="mt-2 px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition">Siguiente pregunta</button>
        </div>
      </div>

      <!-- Submit button -->
      <button
        *ngIf="selectedAnswer !== null && !answered"
        (click)="submitAnswer()"
        class="btn-primary w-full mt-6"
      >
        Confirmar respuesta
      </button>
    </div>
  `,
  styles: [],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class QuestionCardComponent {
  @Input() question: Question | null = null;
  @Input() categoryName: string = '';
  @Input() categoryIcon: string = '';
  @Input() categoryColor: string = '#0d2b5cff';
  @Input() streak: number = 0;
  @Output() answerSubmitted = new EventEmitter<number>();
  @Output() next = new EventEmitter<void>();

  selectedAnswer: number | null = null;
  answered: boolean = false;
  showFeedback: boolean = false;
  isCorrect: boolean = false;
  earnedPoints: number = 0;

  selectAnswer(index: number): void {
    if (!this.answered) {
      this.selectedAnswer = index;
    }
  }

  submitAnswer(): void {
    if (this.selectedAnswer !== null) {
      this.answerSubmitted.emit(this.selectedAnswer);
    }
  }

  showResult(isCorrect: boolean, points: number): void {
    this.answered = true;
    this.isCorrect = isCorrect;
    this.earnedPoints = points;
    this.showFeedback = true;
  }

  onNext(): void {
    this.next.emit();
  }

  reset(): void {
    this.selectedAnswer = null;
    this.answered = false;
    this.showFeedback = false;
    this.isCorrect = false;
    this.earnedPoints = 0;
  }
}
