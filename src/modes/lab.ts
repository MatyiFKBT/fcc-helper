import { ModeHandler, LabTask, LabSolution, LabSolutionSchema } from '../types';
import { AIService } from '../services/ai';

export class LabModeHandler implements ModeHandler {
  name = 'LAB';

  detect(): boolean {
    // TODO: Add detection logic for lab pages
    // Look for common lab indicators like code editors, task lists, etc.
    return document.querySelector('.lab-container') !== null ||
           document.querySelector('[data-testid="lab"]') !== null ||
           document.querySelector('.code-editor') !== null;
  }

  async execute(): Promise<void> {
    console.log(`🧪 ${this.name} mode detected`);
    
    const tasks = this.extractTasks();
    
    if (tasks.length === 0) {
      console.log('❌ No lab tasks found');
      return;
    }

    console.log(`🔍 Found ${tasks.length} lab task(s)`);
    window.labData = tasks;

    await this.analyzeAndExecuteTasks(tasks);
  }

  private extractTasks(): LabTask[] {
    // TODO: Implement task extraction based on lab page structure
    // This is a placeholder for future implementation
    const tasks: LabTask[] = [];
    
    // Example: Look for task descriptions, code requirements, etc.
    const taskElements = document.querySelectorAll('.task-item, .lab-instruction');
    
    taskElements.forEach((element, index) => {
      const description = element.textContent?.trim();
      if (description) {
        tasks.push({
          id: `task-${index}`,
          description,
          type: 'code', // Default to code task
        });
      }
    });

    return tasks;
  }

  private async analyzeAndExecuteTasks(tasks: LabTask[]): Promise<void> {
    try {
      console.log('🧠 Analyzing lab tasks with Gemini...');
      
      const tasksText = tasks.map((task, idx) => 
        `Task ${idx} (${task.id}): ${task.description}`
      ).join('\n\n');

      const prompt = `Analyze these coding lab tasks and provide solutions. For each task, provide the code solution and explanation.

${tasksText}

Return the results in the specified JSON format with task id, solution code, and explanation.`;

      const aiService = AIService.getInstance();
      const solutions = await aiService.generateStructuredResponse(LabSolutionSchema, prompt);

      console.log('📝 Lab analysis complete:', solutions);
      window.labSolution = solutions;

      this.applySolutions(solutions);

      console.log('🎯 Lab tasks completed automatically!');
    } catch (error) {
      console.error('Error analyzing lab tasks:', error);
    }
  }

  private applySolutions(solutions: LabSolution): void {
    solutions.tasks.forEach(solution => {
      console.log(`🔧 Applying solution for ${solution.id}: ${solution.explanation}`);
      
      // TODO: Implement solution application based on task type
      // This could involve:
      // - Filling code editors
      // - Creating files
      // - Running commands
      // - etc.
      
      console.log(`💡 Solution: ${solution.solution}`);
    });
  }
}