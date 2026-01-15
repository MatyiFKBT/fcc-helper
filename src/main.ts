import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

// @ts-ignore isolatedModules
console.log('FCC Helper userscript loaded');

// Expose exampleFn to global scope for browser console access
declare global {
  interface Window {
    exampleFn: () => Promise<void>;
  }
}

interface QuizQuestion {
  question: string;
  options: string[];
  questionIndex: number;
}

// Zod schema for structured quiz answers
const QuizAnswersSchema = z.object({
  answers: z.array(z.object({
    questionIndex: z.number(),
    correctAnswerIndex: z.number(),
    explanation: z.string()
  }))
});

function extractQuizQuestions(): QuizQuestion[] {
  const fieldsets = document.querySelectorAll('fieldset');
  const quizData: QuizQuestion[] = [];
  let questionIndex = 0;

  fieldsets.forEach(fieldset => {
    // Extract question text from legend
    const legendElement = fieldset.querySelector('.mcq-question-text');
    if (!legendElement) return;

    const questionText = legendElement.textContent?.trim() || '';
    if (!questionText) return;

    // Extract answer options
    const optionElements = fieldset.querySelectorAll('.video-quiz-option');
    const options: string[] = [];

    optionElements.forEach(option => {
      const optionText = option.textContent?.trim();
      if (optionText) {
        options.push(optionText);
      }
    });

    if (options.length > 0) {
      quizData.push({
        question: questionText,
        options: options,
        questionIndex: questionIndex
      });
      questionIndex++;
    }
  });

  return quizData;
}

function selectAnswers(answers: z.infer<typeof QuizAnswersSchema>): void {
  answers.answers.forEach(answer => {
    // Find the radio input for the correct answer
    const radioInput = document.querySelector(`input[name="mc-question-${answer.questionIndex}"][value="${answer.correctAnswerIndex}"]`) as HTMLInputElement;
    
    if (radioInput) {
      radioInput.checked = true;
      radioInput.click(); // Trigger any event handlers
      console.log(`✅ Selected answer ${answer.correctAnswerIndex} for question ${answer.questionIndex}: ${answer.explanation}`);
    } else {
      console.warn(`❌ Could not find radio input for question ${answer.questionIndex}, answer ${answer.correctAnswerIndex}`);
    }
  });
}

async function analyzeQuizQuestions(questions: QuizQuestion[]): Promise<void> {
  try {
    console.log('🧠 Analyzing quiz questions with Gemini...');
    
    // Get API key
    let apiKey = localStorage.getItem('GOOGLE_API_KEY');
    
    if (!apiKey) {
      apiKey = prompt('Please enter your Google API key (it will be saved in localStorage):');
      if (!apiKey) {
        console.error('API key is required to analyze quiz questions');
        return;
      }
      localStorage.setItem('GOOGLE_API_KEY', apiKey);
    }

    const google = createGoogleGenerativeAI({ apiKey });
    
    // Format questions for Gemini
    const questionsText = questions.map((q, idx) => 
      `Question ${idx}: ${q.question}\nOptions: ${q.options.map((opt, i) => `${i}. ${opt}`).join(', ')}`
    ).join('\n\n');

    const { object: answers } = await generateObject({
      model: google('gemini-2.5-flash-lite'),
      schema: QuizAnswersSchema,
      prompt: `Analyze these coding/web development quiz questions and provide the correct answers. For each question, identify the correct answer index (0-based) and provide a brief explanation.

${questionsText}

Return the results in the specified JSON format with questionIndex (matching the question number), correctAnswerIndex (0-based index of the correct option), and explanation.`
    });

    console.log('📝 Quiz analysis complete:', answers);
    
    // Store in global variable
    (window as any).quizAnswers = answers;
    
    // Automatically select the correct answers
    selectAnswers(answers);
    
    console.log('🎯 All correct answers have been selected!');
    
  } catch (error) {
    console.error('Error analyzing quiz questions:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      localStorage.removeItem('GOOGLE_API_KEY');
      console.log('API key cleared. Press Ctrl+P again to enter a new key.');
    }
  }
}

// Add keyboard event listener for Ctrl+P
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault(); // Prevent default print dialog
    
    const quizQuestions = extractQuizQuestions();
    
    if (quizQuestions.length > 0) {
      console.log(`🔍 Found ${quizQuestions.length} quiz question(s)`);
      
      // Store in a global variable for easy access
      (window as any).quizData = quizQuestions;
      
      // Analyze questions with Gemini and auto-select answers
      analyzeQuizQuestions(quizQuestions);
    } else {
      console.log('❌ No quiz questions found on this page');
    }
  }
});

async function exampleFn(): Promise<void> {
  try {
    console.log('Calling Gemini Flash...');
    
    // Prompt user for API key since we're in a browser environment
    let apiKey = localStorage.getItem('GOOGLE_API_KEY');
    
    if (!apiKey) {
      apiKey = prompt('Please enter your Google API key (it will be saved in localStorage):');
      if (!apiKey) {
        console.error('API key is required to call Gemini Flash');
        return;
      }
      localStorage.setItem('GOOGLE_API_KEY', apiKey);
    }

    console.log('Making request to Gemini Flash...');
    
    const google = createGoogleGenerativeAI({ apiKey });
    
    const { object } = await generateObject({
      model: google('gemini-2.5-flash-lite'),
      schema: z.object({
        greeting: z.string(),
        fact: z.string(),
        confidence: z.number().min(0).max(100)
      }),
      prompt: 'Hello! Please respond with a friendly greeting and tell me something interesting about AI. Also rate your confidence in the fact from 0-100.',
    });

    console.log('Gemini Flash response:', object);
  } catch (error) {
    console.error('Error calling Gemini Flash:', error);
    // If there's an auth error, clear the stored key so user can enter a new one
    if (error instanceof Error && error.message.includes('API key')) {
      localStorage.removeItem('GOOGLE_API_KEY');
      console.log('API key cleared. Run exampleFn() again to enter a new key.');
    }
  }
}

// Make the function available globally for console access
window.exampleFn = exampleFn;
