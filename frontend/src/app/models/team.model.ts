export interface Team {
  id: string;
  name: string;
  icon: string;
  color: string;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  streak: number;
  accuracy?: number;
}

export interface GameSession {
  id: string;
  teams: Team[];
  currentQuestionIndex: number;
  usedQuestions: number[];
  createdAt: Date;
}

export interface LeaderboardEntry extends Team {
  rank?: number;
}
