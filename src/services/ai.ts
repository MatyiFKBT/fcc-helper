import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
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
    model: string = 'gemma-3-27b-it'
  ): Promise<T> {
    try {
      await this.ensureApiKey();

      const enhancedPrompt = `${prompt}

IMPORTANT: You must respond with valid JSON only, no additional text or explanation. Format your response as JSON matching this structure:
${this.generateJsonExample(schema)}`;

      const { text } = await generateText({
        model: this.google(model),
        prompt: enhancedPrompt
      });

      // Extract JSON from response (handle cases where model adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response: ' + text);
      }

      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      // Validate against schema
      return schema.parse(jsonResponse);
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

  private generateJsonExample(schema: z.ZodSchema<any>): string {
    // Generate a basic JSON structure example based on schema
    // This is a simplified version - you could make it more sophisticated
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const example: any = {};
      
      for (const [key, value] of Object.entries(shape)) {
        if (value instanceof z.ZodString) {
          example[key] = `"string"`;
        } else if (value instanceof z.ZodNumber) {
          example[key] = 0;
        } else if (value instanceof z.ZodArray) {
          example[key] = [];
        } else if (value instanceof z.ZodObject) {
          example[key] = {};
        } else {
          example[key] = `"value"`;
        }
      }
      
      return JSON.stringify(example, null, 2);
    }
    
    return '{}';
  }

  public clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('GOOGLE_API_KEY');
    console.log('API key cleared');
  }
}