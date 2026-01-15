import { ModeHandler, QuizQuestion, QuizAnswers, QuizAnswersSchema } from '../types';
import { AIService } from '../services/ai';

export class QuizModeHandler implements ModeHandler {
  name = 'QUIZ';

  detect(): boolean {
    return document.querySelectorAll('fieldset .mcq-question-text').length > 0;
  }

  async execute(): Promise<void> {
    console.log(`🎯 ${this.name} mode detected`);
    
    const questions = this.extractQuestions();
    
    if (questions.length === 0) {
      console.log('❌ No quiz questions found');
      return;
    }

    console.log(`🔍 Found ${questions.length} quiz question(s)`);
    window.quizData = questions;

    await this.analyzeAndSelectAnswers(questions);
  }

  private extractQuestions(): QuizQuestion[] {
    const fieldsets = document.querySelectorAll('fieldset');
    const questions: QuizQuestion[] = [];
    let questionIndex = 0;

    fieldsets.forEach(fieldset => {
      const legendElement = fieldset.querySelector('.mcq-question-text');
      if (!legendElement) return;

      const questionText = legendElement.textContent?.trim() || '';
      if (!questionText) return;

      const optionElements = fieldset.querySelectorAll('.video-quiz-option');
      const options: string[] = [];

      optionElements.forEach(option => {
        const optionText = option.textContent?.trim();
        if (optionText) {
          options.push(optionText);
        }
      });

      if (options.length > 0) {
        questions.push({
          question: questionText,
          options: options,
          questionIndex: questionIndex
        });
        questionIndex++;
      }
    });

    return questions;
  }

  private async analyzeAndSelectAnswers(questions: QuizQuestion[]): Promise<void> {
    try {
      console.log('🧠 Analyzing quiz questions with Gemini...');
      
      const questionsText = questions.map((q, idx) => 
        `Question ${idx}: ${q.question}\nOptions: ${q.options.map((opt, i) => `${i}. ${opt}`).join(', ')}`
      ).join('\n\n');

      const prompt = `Analyze these coding/web development quiz questions and provide the correct answers. For each question, identify the correct answer index (0-based) and provide a brief explanation.

${questionsText}

Return the results in the specified JSON format with questionIndex (matching the question number), correctAnswerIndex (0-based index of the correct option), and explanation.`;

      const aiService = AIService.getInstance();
      const answers = await aiService.generateStructuredResponse(QuizAnswersSchema, prompt);

      console.log('📝 Quiz analysis complete:', answers);
      window.quizAnswers = answers;

      this.selectAnswers(answers);
      this.submitQuiz();

      console.log('🎯 Quiz completed automatically!');
    } catch (error) {
      console.error('Error analyzing quiz:', error);
    }
  }

  private selectAnswers(answers: QuizAnswers): void {
    answers.answers.forEach(answer => {
      console.log(`🎯 Selecting answer ${answer.correctAnswerIndex} for question ${answer.questionIndex}`);
      
      const labelElement = document.querySelector(`label[for="mc-question-${answer.questionIndex}-answer-${answer.correctAnswerIndex}"]`) as HTMLLabelElement;
      
      if (labelElement) {
        labelElement.click();
        console.log(`✅ Selected: ${answer.explanation}`);
      } else {
        console.warn(`❌ Could not find label for question ${answer.questionIndex}, answer ${answer.correctAnswerIndex}`);
      }
    });
  }

  private submitQuiz(): void {
    setTimeout(() => {
      const firstButton = document.querySelector('button[type="button"]') as HTMLButtonElement;
      if (firstButton) {
        firstButton.click();
        console.log('🚀 Submitted quiz');
      } else {
        console.warn('❌ Could not find submit button');
      }
    }, 500);
  }
}