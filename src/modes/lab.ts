import { ModeHandler, LabSolution, LabSolutionSchema } from '../types';
import { AIService } from '../services/ai';
import { NotificationService } from '../services/notifications';

export class LabModeHandler implements ModeHandler {
  name = 'LAB';
  private notifications = NotificationService.getInstance();
  private hasClipboardPermission = false;

  detect(): boolean {
    // Detect lab pages by checking for the specific FCC lab structure
    return document.querySelector('h1#content-start') !== null &&
           document.querySelector('section#description') !== null &&
           document.querySelector('ul.challenge-test-suite') !== null;
  }

  async execute(): Promise<void> {
    console.log(`🧪 ${this.name} mode detected`);
    this.notifications.info('Lab Detected!', 'Starting automatic lab solver...');
    
    const labData = this.extractLabData();
    
    if (!labData.title && !labData.description && labData.testCases.length === 0) {
      console.log('❌ No lab data found');
      this.notifications.error('No Lab Data Found', 'Could not extract lab information from this page');
      return;
    }

    console.log(`🔍 Found lab: "${labData.title}"`);
    console.log(`📝 Description length: ${labData.description.length} chars`);
    console.log(`🧪 Test cases: ${labData.testCases.length}`);

    this.notifications.success(`Lab Found: ${labData.title}`, `Found ${labData.testCases.length} test cases...`);

    // Store in global for debugging
    (window as any).labData = labData;

    // Request clipboard permissions before proceeding
    this.hasClipboardPermission = await this.requestClipboardPermission();
    if (!this.hasClipboardPermission) {
      this.notifications.warning('Clipboard Permission Denied', 'Solution will be shown in console only');
    }

    await this.analyzeAndExecuteLab(labData);
  }

  private async requestClipboardPermission(): Promise<boolean> {
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard) {
        console.warn('Clipboard API not available');
        return false;
      }

      // Try to access clipboard directly first
      try {
        await navigator.clipboard.writeText('');
        console.log('✅ Clipboard permission already granted');
        return true;
      } catch (error) {
        // If direct access fails, ask user for permission
        console.log('Clipboard access denied, asking user for permission');
        
        const userConsent = await this.notifications.confirm(
          'Clipboard Permission',
          'Allow FCC Helper to copy the solution to your clipboard?',
          'Allow'
        );

        if (!userConsent) {
          return false;
        }

        // Test clipboard access again after user consent
        await navigator.clipboard.writeText('');
        console.log('✅ Clipboard permission granted after user consent');
        return true;
      }
    } catch (error) {
      console.warn('Could not get clipboard permission:', error);
      return false;
    }
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
    this.notifications.loading('Analyzing Lab', 'AI is solving the coding challenge...');
    
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

      const successMessage = this.hasClipboardPermission ? 'Code copied to clipboard' : 'Solution ready in console';
      this.notifications.closeLoading(true, 'Solution Ready!', successMessage);

      this.displaySolution(solution);

      console.log('🎯 Lab solution ready!');
    } catch (error) {
      console.error('Error analyzing lab:', error);
      this.notifications.closeLoading(false, 'Analysis Failed', 'Could not generate lab solution');
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
    
    // Only try to copy to clipboard if permission was granted
    if (this.hasClipboardPermission && navigator.clipboard) {
      navigator.clipboard.writeText(solution.solution).then(() => {
        console.log('📎 Solution copied to clipboard!');
        this.notifications.success('Copied!', 'Solution copied to clipboard');
      }).catch((error) => {
        console.log('❌ Could not copy to clipboard:', error);
        this.notifications.warning('Copy Failed', 'Could not copy to clipboard');
      });
    } else if (!this.hasClipboardPermission) {
      console.log('ℹ️ Clipboard access not granted - copy manually from console');
    }
  }
}