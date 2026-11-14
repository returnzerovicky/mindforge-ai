export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type StudyView =
  | 'overview'
  | 'composer'
  | 'sets'
  | 'flashcards'
  | 'quiz'
  | 'progress';

export type CardStatus = 'unseen' | 'review' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  conceptTag: string;
  hint: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  mode: 'full' | 'retest';
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  incorrectQuestionIds: string[];
}

export interface StudySet {
  id: string;
  title: string;
  summary: string;
  difficulty: DifficultyLevel;
  keyConcepts: string[];
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  cardStatuses: Record<string, CardStatus>;
  quizHistory: QuizAttempt[];
  createdAt: string;
  model: string;
  isSample?: boolean;
}

export type StudyActivityType = 'deck_created' | 'card_reviewed' | 'quiz_completed';

export interface StudyActivityItem {
  id: string;
  type: StudyActivityType;
  deckId: string;
  deckTitle: string;
  detail: string;
  timestamp: string;
}

export interface GenerateStudyInput {
  content: string;
  difficulty: DifficultyLevel;
  flashcardCount: number;
  quizCount: number;
}

export interface ApiErrorInfo {
  code: string;
  message: string;
  retryable: boolean;
  statusCode?: number;
}

export interface StudySetApiPayload {
  title: string;
  summary: string;
  difficulty: DifficultyLevel;
  keyConcepts: string[];
  flashcards: Flashcard[];
  quizQuestions: QuizQuestion[];
  model: string;
  generatedAt: string;
}
