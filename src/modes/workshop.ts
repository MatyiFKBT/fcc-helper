import { ModeHandler, WorkshopData, WorkshopSolution, WorkshopSolutionSchema } from '../types';
import { AIService } from '../services/ai';
import { NotificationService } from '../services/notifications';

export class WorkshopModeHandler implements ModeHandler {
  name = 'WORKSHOP';
  private notifications = NotificationService.getInstance();
  private hasClipboardPermission = false;

  detect(): boolean {
    // Detect workshop pages by checking for the specific elements
    return document.querySelector('li.breadcrumb-left') !== null &&
           document.querySelector('li.breadcrumb-right') !== null &&
           document.querySelector('div.instructions-panel') !== null &&
           document.querySelector('div.view-lines.monaco-mouse-cursor-text') !== null;
  }

  async execute(): Promise<void> {
    console.log(`🛠️ ${this.name} mode detected`);
    this.notifications.info('Workshop Detected!', 'Starting workshop solver...');
    
    const workshopData = this.extractWorkshopData();
    
    if (!workshopData.title || !workshopData.task) {
      console.log('❌ No workshop data found');
      this.notifications.error('No Workshop Data', 'Could not extract workshop information');
      return;
    }

    console.log(`🔍 Found workshop: "${workshopData.title}"`);
    console.log(`📝 Task length: ${workshopData.task.length} chars`);
    console.log(`💻 Current code length: ${workshopData.currentCode.length} chars`);

    this.notifications.success(`Workshop: ${workshopData.title}`, 'Extracted task and current code');

    // Store in global for debugging
    window.workshopData = workshopData;

    // Request clipboard permissions before proceeding
    this.hasClipboardPermission = await this.requestClipboardPermission();
    if (!this.hasClipboardPermission) {
      this.notifications.warning('Clipboard Permission Denied', 'Solution will be shown in console only');
    }

    await this.analyzeAndSolveWorkshop(workshopData);
  }

  private extractWorkshopData(): WorkshopData {
    // Extract title from breadcrumbs
    const breadcrumbLeft = document.querySelector('li.breadcrumb-left')?.textContent?.trim() || '';
    const breadcrumbRight = document.querySelector('li.breadcrumb-right')?.textContent?.trim() || '';
    const title = breadcrumbLeft && breadcrumbRight ? `${breadcrumbLeft}/${breadcrumbRight}` : breadcrumbLeft || breadcrumbRight;

    // Extract task from instructions panel
    const instructionsPanel = document.querySelector('div.instructions-panel');
    const task = instructionsPanel?.textContent?.trim() || '';

    // Extract current code from Monaco editor
    const monacoLines = document.querySelector('div.view-lines.monaco-mouse-cursor-text');
    const currentCode = monacoLines?.textContent?.trim() || '';

    return {
      title,
      task,
      currentCode
    };
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

  private async analyzeAndSolveWorkshop(workshopData: WorkshopData): Promise<void> {
    this.notifications.loading('Solving Workshop', 'AI is analyzing the task...');
    
    try {
      console.log('🧠 Analyzing workshop with Gemma...');
      
      const prompt = `Analyze this FreeCodeCamp workshop task and provide a complete solution.

Workshop: ${workshopData.title}

Task Instructions:
${workshopData.task}

Current Code:
${workshopData.currentCode}

IMPORTANT: Please don't edit code that should not be edited. Only do the modifications that are specified in the task instructions. Preserve any existing code structure, comments, or setup code that is not meant to be changed according to the task requirements.

Based on the workshop title, task instructions, and current code, provide a complete working solution that fulfills all requirements.
Build upon the existing code if it's useful, or provide a completely new solution if needed.
Return the complete code that can be copy-pasted directly into the Monaco editor.

Respond with JSON in this exact format:
{
  "solution": "// Complete working code here that fulfills the task requirements",
  "explanation": "Brief explanation of the solution and what changes were made"
}`;

      const aiService = AIService.getInstance();
      const solution = await aiService.generateStructuredResponse(WorkshopSolutionSchema, prompt);

      console.log('📝 Workshop analysis complete:', solution);
      window.workshopSolution = solution;

      const successMessage = this.hasClipboardPermission ? 'Code copied to clipboard' : 'Solution ready in console';
      this.notifications.closeLoading(true, 'Solution Ready!', successMessage);

      this.displaySolution(solution);

      console.log('🎯 Workshop solution ready!');
    } catch (error) {
      console.error('Error analyzing workshop:', error);
      this.notifications.closeLoading(false, 'Analysis Failed', 'Could not generate workshop solution');
    }
  }

  private displaySolution(solution: WorkshopSolution): void {
    console.log('🛠️ WORKSHOP SOLUTION:');
    console.log('=====================================');
    console.log(solution.solution);
    console.log('=====================================');
    console.log(`💡 Explanation: ${solution.explanation}`);
    console.log('');
    console.log('📋 Copy the code above and paste it into the Monaco editor!');
    console.log('💾 Solution also stored in window.workshopSolution.solution');
    
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