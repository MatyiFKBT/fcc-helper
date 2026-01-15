import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

export class AIService {
  private static instance: AIService;
  private google: any;
  private apiKey: string | null = null;

  private constructor() {}

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private async ensureApiKey(): Promise<string> {
    if (!this.apiKey) {
      this.apiKey = localStorage.getItem('GOOGLE_API_KEY');
      
      if (!this.apiKey) {
        this.apiKey = prompt('Please enter your Google API key (it will be saved in localStorage):');
        if (!this.apiKey) {
          throw new Error('API key is required');
        }
        localStorage.setItem('GOOGLE_API_KEY', this.apiKey);
      }

      this.google = createGoogleGenerativeAI({ apiKey: this.apiKey });
    }
    
    return this.apiKey;
  }

  public async generateStructuredResponse<T>(
    schema: z.ZodSchema<T>, 
    prompt: string, 
    model: string = 'gemini-2.5-flash-lite'
  ): Promise<T> {
    try {
      await this.ensureApiKey();

      const { object } = await generateObject({
        model: this.google(model),
        schema,
        prompt
      });

      return object;
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Clear API key if there's an auth error
      if (error instanceof Error && error.message.includes('API key')) {
        this.clearApiKey();
        throw new Error('Invalid API key. Please try again with a new key.');
      }
      
      throw error;
    }
  }

  public clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('GOOGLE_API_KEY');
    console.log('API key cleared');
  }
}