export interface Question {
  id: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit: number;
  reference?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface AnswerValidation {
  success: boolean;
  isCorrect: boolean;
  points: number;
  correctAnswer: number;
}
