import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

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
}

function extractQuizQuestions(): QuizQuestion[] {
  const fieldsets = document.querySelectorAll('fieldset');
  const quizData: QuizQuestion[] = [];

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
        options: options
      });
    }
  });

  return quizData;
}

// Add keyboard event listener for Ctrl+P
document.addEventListener('keydown', function(event) {
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault(); // Prevent default print dialog
    
    const quizQuestions = extractQuizQuestions();
    
    if (quizQuestions.length > 0) {
      console.log('Quiz Questions Found:');
      console.log(JSON.stringify(quizQuestions, null, 2));
      
      // Store in a global variable for easy access
      (window as any).quizData = quizQuestions;
      console.log('Quiz data stored in window.quizData');
    } else {
      console.log('No quiz questions found on this page');
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
    
    const { text } = await generateText({
      model: google('gemini-2.5-flash-lite'),
      prompt: 'Hello! Please respond with a friendly greeting and tell me something interesting about AI.',
    });

    console.log('Gemini Flash response:', text);
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
