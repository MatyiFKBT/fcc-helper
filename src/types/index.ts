import { z } from 'zod';

// Base interface for all mode handlers
export interface ModeHandler {
  name: string;
  detect(): boolean;
  execute(): Promise<void>;
}

// Quiz-specific types
export interface QuizQuestion {
  question: string;
  options: string[];
  questionIndex: number;
}

export const QuizAnswersSchema = z.object({
  answers: z.array(z.object({
    questionIndex: z.number(),
    correctAnswerIndex: z.number(),
    explanation: z.string()
  }))
});

export type QuizAnswers = z.infer<typeof QuizAnswersSchema>;

// BigQuiz-specific types
export interface BigQuizQuestion {
  questionNumber: number;
  question: string;
  options: Array<{
    value: string;
    text: string;
  }>;
}

export const BigQuizAnswersSchema = z.object({
  answers: z.array(z.object({
    questionNumber: z.number(),
    correctValue: z.string(),
    explanation: z.string()
  }))
});

export type BigQuizAnswers = z.infer<typeof BigQuizAnswersSchema>;

// Lab-specific types (for future implementation)
export interface LabTask {
  id: string;
  description: string;
  type: 'code' | 'file' | 'command';
  target?: string;
}

export const LabSolutionSchema = z.object({
  solution: z.string(),
  explanation: z.string()
});

export type LabSolution = z.infer<typeof LabSolutionSchema>;

// Global window extensions
declare global {
  interface Window {
    exampleFn: () => Promise<void>;
    quizData?: QuizQuestion[];
    quizAnswers?: QuizAnswers;
    bigQuizData?: BigQuizQuestion[];
    bigQuizAnswers?: BigQuizAnswers;
    labData?: LabTask[];
    labSolution?: LabSolution;
  }
}