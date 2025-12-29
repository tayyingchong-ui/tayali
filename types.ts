
export interface Question {
  id: number;
  text: string;
  options: string[];
  answer: string; // 'A', 'B', 'C', or 'D'
}

export enum GameStatus {
  START = 'START',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface QuizResult {
  score: number;
  correctCount: number;
  incorrectCount: number;
  totalAnswered: number;
}
