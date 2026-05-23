export interface Student {
  nisn: string;
  name: string;
  classRoom: string;
  password?: string;
}

export interface QuestionOption {
  key: string; // A, B, C, D, E (Multiple Choice)
  text: string;
  imageUrl?: string;
}

export interface Question {
  id: string;
  subject: string;
  text: string;
  imageUrl?: string;
  options: QuestionOption[];
  correctAnswer: string; // "A", "B", "C", "D", "E"
}

export interface ExamSession {
  id: string;
  subject: string;
  date: string;
  duration: number; // in minutes
  token: string;
  isClosed: boolean;
}

export interface StudentAttempt {
  id: string; // examSessionId + _ + nisn
  examSessionId: string;
  nisn: string;
  studentName: string;
  classRoom: string;
  startTime: string; // ISO string
  endTime?: string; // ISO string
  answers: Record<string, string>; // questionId -> optionKey ("A", "B", etc.)
  doubtfulAnswers?: string[]; // list of questionIds that are flagged as "ragu-ragu"
  isSubmitted: boolean;
  score: number; // 0 to 100
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  antiCheatWarnings: number;
}

export interface StudentStatus {
  nisn: string;
  studentName: string;
  classRoom: string;
  isLoggedIn: boolean;
  activeAttempt?: StudentAttempt;
  activeSession?: ExamSession;
}
