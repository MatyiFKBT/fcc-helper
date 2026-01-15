import { ModeHandler, LabSolution, LabSolutionSchema } from '../types';
import { AIService } from '../services/ai';

export class LabModeHandler implements ModeHandler {
  name = 'LAB';

  detect(): boolean {
    // Detect lab pages by checking for the specific FCC lab structure
    return document.querySelector('h1#content-start') !== null &&
           document.querySelector('section#description') !== null &&
           document.querySelector('ul.challenge-test-suite') !== null;
  }

  async execute(): Promise<void> {
    console.log(`🧪 ${this.name} mode detected`);
    
    const labData = this.extractLabData();
    
    if (!labData.title && !labData.description && labData.testCases.length === 0) {
      console.log('❌ No lab data found');
      return;
    }

    console.log(`🔍 Found lab: "${labData.title}"`);
    console.log(`📝 Description length: ${labData.description.length} chars`);
    console.log(`🧪 Test cases: ${labData.testCases.length}`);

    // Store in global for debugging
    (window as any).labData = labData;

    await this.analyzeAndExecuteLab(labData);
  }

  private extractLabData(): { title: string; description: string; testCases: string[] } {
    // Extract lab title from h1#content-start
    const titleElement = document.querySelector('h1#content-start');
    const title = titleElement?.textContent?.trim() || '';

    // Extract description from section#description
    const descriptionElement = document.querySelector('section#description');
    const description = descriptionElement?.textContent?.trim() || '';

    // Extract test cases from ul.challenge-test-suite
    const testSuiteElement = document.querySelector('ul.challenge-test-suite');
    const testCases: string[] = [];

    if (testSuiteElement) {
      const testItems = testSuiteElement.querySelectorAll('li');
      testItems.forEach(item => {
        const testText = item.textContent?.trim();
        if (testText) {
          testCases.push(testText);
        }
      });
    }

    return {
      title,
      description,
      testCases
    };
  }

  private async analyzeAndExecuteLab(labData: { title: string; description: string; testCases: string[] }): Promise<void> {
    try {
      console.log('🧠 Analyzing lab with Gemma...');
      
      const prompt = `Analyze this FreeCodeCamp coding lab and provide a complete solution.

Lab Title: ${labData.title}

Description:
${labData.description}

Test Cases:
${labData.testCases.map((test, i) => `${i + 1}. ${test}`).join('\n')}

Based on the lab title, description, and test cases, provide a complete working solution that passes all tests.
Return the complete code that can be copy-pasted directly into the code editor.

Respond with JSON in this exact format:
{
  "solution": "// Complete working code here that passes all test cases",
  "explanation": "Brief explanation of how the solution works"
}`;

      const aiService = AIService.getInstance();
      const solution = await aiService.generateStructuredResponse(LabSolutionSchema, prompt);

      console.log('📝 Lab analysis complete:', solution);
      window.labSolution = solution;

      this.displaySolution(solution);

      console.log('🎯 Lab solution ready!');
    } catch (error) {
      console.error('Error analyzing lab:', error);
    }
  }

  private displaySolution(solution: LabSolution): void {
    console.log('🔧 COMPLETE SOLUTION:');
    console.log('=====================================');
    console.log(solution.solution);
    console.log('=====================================');
    console.log(`💡 Explanation: ${solution.explanation}`);
    console.log('');
    console.log('📋 Copy the code above and paste it into the code editor!');
    console.log('💾 Solution also stored in window.labSolution.solution');
    
    // Try to automatically copy to clipboard if possible
    if (navigator.clipboard) {
      navigator.clipboard.writeText(solution.solution).then(() => {
        console.log('📎 Solution copied to clipboard!');
      }).catch(() => {
        console.log('❌ Could not copy to clipboard automatically');
      });
    }
  }
}