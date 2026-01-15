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
    labData?: LabTask[];
    labSolution?: LabSolution;
  }
}