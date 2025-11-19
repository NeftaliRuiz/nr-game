import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminService, Question } from '../../services/admin.service';

@Component({
  selector: 'app-question-form',
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.css']
})
export class QuestionFormComponent implements OnInit {
  questionForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  isEditMode = false;
  questionId: string | null = null;

  categories = [
    'Geography',
    'Science',
    'History',
    'Sports',
    'Entertainment',
    'Technology',
    'Art',
    'Literature',
    'Music',
    'General Knowledge'
  ];

  difficulties = [
    { value: 'easy', label: 'Easy', points: 100 },
    { value: 'medium', label: 'Medium', points: 200 },
    { value: 'hard', label: 'Hard', points: 300 }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.questionId = this.route.snapshot.params['id'];
    this.isEditMode = !!this.questionId;

    this.questionForm = this.formBuilder.group({
      category: ['', Validators.required],
      difficulty: ['', Validators.required],
      question: ['', [Validators.required, Validators.minLength(10)]],
      options: this.formBuilder.array([
        this.createOption(),
        this.createOption(),
        this.createOption(),
        this.createOption()
      ]),
      correctAnswer: [0, [Validators.required, Validators.min(0), Validators.max(3)]],
      points: [100, [Validators.required, Validators.min(50), Validators.max(500)]],
      timeLimit: [30, [Validators.required, Validators.min(10), Validators.max(120)]],
      eventId: [null]
    });

    // Auto-set points based on difficulty
    this.questionForm.get('difficulty')?.valueChanges.subscribe(difficulty => {
      const difficultyObj = this.difficulties.find(d => d.value === difficulty);
      if (difficultyObj) {
        this.questionForm.patchValue({ points: difficultyObj.points });
      }
    });

    if (this.isEditMode && this.questionId) {
      this.loadQuestion(this.questionId);
    }
  }

  createOption(): FormGroup {
    return this.formBuilder.group({
      value: ['', Validators.required]
    });
  }

  get options(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  get f() {
    return this.questionForm.controls;
  }

  loadQuestion(id: string): void {
    this.loading = true;
    this.adminService.getQuestionById(id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const question = response.data;
          
          // Clear existing options
          while (this.options.length > 0) {
            this.options.removeAt(0);
          }
          
          // Add options from loaded question
          question.options.forEach((optionValue: string) => {
            this.options.push(this.formBuilder.group({
              value: [optionValue, Validators.required]
            }));
          });
          
          // Patch form values
          this.questionForm.patchValue({
            category: question.category,
            difficulty: question.difficulty,
            question: question.question,
            correctAnswer: question.correctAnswer,
            points: question.points,
            timeLimit: question.timeLimit,
            eventId: question.eventId
          });
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la pregunta';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.questionForm.invalid) {
      return;
    }

    this.loading = true;

    const questionData: Partial<Question> = {
      category: this.f['category'].value,
      difficulty: this.f['difficulty'].value,
      question: this.f['question'].value,
      options: this.options.controls.map(option => option.get('value')?.value),
      correctAnswer: parseInt(this.f['correctAnswer'].value),
      points: parseInt(this.f['points'].value),
      timeLimit: parseInt(this.f['timeLimit'].value),
      eventId: this.f['eventId'].value || null
    };

    const request = this.isEditMode && this.questionId
      ? this.adminService.updateQuestion(this.questionId, questionData)
      : this.adminService.createQuestion(questionData);

    request.subscribe({
      next: (response) => {
        if (response.success) {
          this.success = this.isEditMode ? '¡Pregunta actualizada exitosamente!' : '¡Pregunta creada exitosamente!';
          setTimeout(() => {
            this.router.navigate(['/admin/questions']);
          }, 1500);
        } else {
          this.error = response.message || 'Operación fallida';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Error al guardar la pregunta';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/questions']);
  }
}
