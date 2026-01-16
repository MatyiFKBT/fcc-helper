import { ModeHandler, BigQuizQuestion, BigQuizAnswers, BigQuizAnswersSchema } from '../types';
import { AIService } from '../services/ai';
import { NotificationService } from '../services/notifications';

export class BigQuizModeHandler implements ModeHandler {
  name = 'BIGQUIZ';
  private notifications = NotificationService.getInstance();

  detect(): boolean {
    return document.querySelector('.quiz-challenge-container') !== null &&
           document.querySelectorAll('.quiz-challenge-container ul li [role="radiogroup"]').length > 0;
  }

  async execute(): Promise<void> {
    console.log(`📝 ${this.name} mode detected`);
    this.notifications.info('Big Quiz Detected!', 'Starting automatic quiz solver...');
    
    const questions = this.extractQuestions();
    
    if (questions.length === 0) {
      console.log('❌ No big quiz questions found');
      this.notifications.error('No Questions Found', 'Could not find any big quiz questions on this page');
      return;
    }

    console.log(`🔍 Found ${questions.length} big quiz question(s)`);
    this.notifications.success(`Found ${questions.length} Questions`, 'Analyzing with AI...');
    window.bigQuizData = questions;

    await this.analyzeAndSelectAnswers(questions);
  }

  private extractQuestions(): BigQuizQuestion[] {
    const questions: BigQuizQuestion[] = [];
    const listItems = document.querySelectorAll('.quiz-challenge-container ul li');

    listItems.forEach(li => {
      const radioGroup = li.querySelector('[role="radiogroup"]');
      if (!radioGroup) return;

      // Extract question number and text
      const questionLabel = radioGroup.querySelector('.quiz-question-label p');
      const questionText = questionLabel?.textContent?.trim() || '';
      
      // Extract question number from the span before the question
      const questionNumberSpan = radioGroup.querySelector('span[role="none"]:first-child');
      const questionNumberText = questionNumberSpan?.textContent?.trim() || '';
      const questionNumber = parseInt(questionNumberText.replace('.', '')) || 0;

      if (!questionText) return;

      // Extract answer options
      const options: Array<{ value: string; text: string }> = [];
      const radioOptions = radioGroup.querySelectorAll('[role="radio"]');

      radioOptions.forEach(option => {
        const value = option.getAttribute('data-value') || '';
        const answerLabel = option.querySelector('.quiz-answer-label');
        const text = answerLabel?.textContent?.trim() || '';
        
        if (value && text) {
          options.push({ value, text });
        }
      });

      if (options.length > 0) {
        questions.push({
          questionNumber,
          question: questionText,
          options
        });
      }
    });

    return questions;
  }

  private async analyzeAndSelectAnswers(questions: BigQuizQuestion[]): Promise<void> {
    this.notifications.loading('Analyzing Questions', 'AI is solving the big quiz...');
    
    try {
      console.log('🧠 Analyzing big quiz questions with Gemma...');
      
      const questionsText = questions.map((q) => 
        `Question ${q.questionNumber}: ${q.question}\nOptions: ${q.options.map(opt => `${opt.value}. ${opt.text}`).join(' | ')}`
      ).join('\n\n');

      const prompt = `Analyze these quiz questions and provide the correct answers. For each question, identify the correct answer value and provide a brief explanation.

${questionsText}

Return the results in JSON format with questionNumber, correctValue (the data-value attribute), and explanation.

Respond with JSON in this exact format:
{
  "answers": [
    {
      "questionNumber": 1,
      "correctValue": "4",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}`;

      const aiService = AIService.getInstance();
      const answers = await aiService.generateStructuredResponse(BigQuizAnswersSchema, prompt);

      console.log('📝 Big quiz analysis complete:', answers);
      window.bigQuizAnswers = answers;

      this.notifications.closeLoading(true, 'Analysis Complete!', 'Selecting answers...');

      this.selectAnswers(answers);
      this.submitQuiz();

      console.log('🎯 Big quiz completed automatically!');
      this.notifications.success('Big Quiz Completed!', 'All answers selected and submitted automatically');
    } catch (error) {
      console.error('Error analyzing big quiz:', error);
      this.notifications.closeLoading(false, 'Analysis Failed', 'Could not analyze big quiz questions');
    }
  }

  private selectAnswers(answers: BigQuizAnswers): void {
    answers.answers.forEach(answer => {
      console.log(`🎯 Selecting answer with value "${answer.correctValue}" for question ${answer.questionNumber}`);
      
      // Find the specific li element for this question number
      const listItems = document.querySelectorAll('.quiz-challenge-container ul li');
      
      // Find the li that contains this question number
      for (let i = 0; i < listItems.length; i++) {
        const li = listItems[i];
        const questionNumberSpan = li.querySelector('[role="radiogroup"] span[role="none"]:first-child');
        const questionNumberText = questionNumberSpan?.textContent?.trim() || '';
        const questionNumber = parseInt(questionNumberText.replace('.', '')) || 0;
        
        if (questionNumber === answer.questionNumber) {
          // Found the correct li element
          const radioOption = li.querySelector(`[role="radio"][data-value="${answer.correctValue}"]`) as HTMLElement;
          
          if (radioOption) {
            radioOption.click();
            console.log(`✅ Selected: ${answer.explanation}`);
            return; // Exit early since we found and selected the answer
          } else {
            console.warn(`❌ Could not find radio option with value "${answer.correctValue}" for question ${answer.questionNumber}`);
            this.notifications.warning('Selection Warning', `Could not select answer for question ${answer.questionNumber}`);
            
            // Debug: Show available options in this specific li
            const availableRadios = Array.from(li.querySelectorAll('[role="radio"]'));
            console.log(`Available options in question ${answer.questionNumber}:`, availableRadios.map(radio => ({
              value: radio.getAttribute('data-value'),
              text: radio.querySelector('.quiz-answer-label')?.textContent?.trim()
            })));
            return;
          }
        }
      }
      
      console.warn(`❌ Could not find li element for question ${answer.questionNumber}`);
      this.notifications.warning('Question Not Found', `Could not locate question ${answer.questionNumber}`);
    });
  }

  private submitQuiz(): void {
    setTimeout(() => {
      // Look for submit button - might be different for big quizzes
      const submitButton = document.querySelector('button[type="submit"], .submit-btn, button:contains("Submit")') as HTMLButtonElement;
      if (submitButton) {
        submitButton.click();
        console.log('🚀 Submitted big quiz');
      } else {
        console.warn('❌ Could not find submit button');
        this.notifications.warning('Submit Warning', 'Could not auto-submit big quiz. Please submit manually.');
        
        // Debug: Show available buttons
        const allButtons = document.querySelectorAll('button');
        console.log('Available buttons:', Array.from(allButtons).map(btn => ({
          type: btn.getAttribute('type'),
          textContent: btn.textContent?.trim(),
          className: btn.className
        })));
      }
    }, 1000); // Longer delay for big quizzes
  }
}