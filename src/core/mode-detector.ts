import { ModeHandler } from '../types';
import { QuizModeHandler } from '../modes/quiz';
import { BigQuizModeHandler } from '../modes/big-quiz';
import { LabModeHandler } from '../modes/lab';

export class ModeDetector {
  private handlers: ModeHandler[] = [
    new QuizModeHandler(),
    new BigQuizModeHandler(),
    new LabModeHandler(),
  ];

  public detectCurrentMode(): ModeHandler | null {
    for (const handler of this.handlers) {
      if (handler.detect()) {
        return handler;
      }
    }
    return null;
  }

  public async executeCurrentMode(): Promise<boolean> {
    const currentMode = this.detectCurrentMode();
    
    if (currentMode) {
      await currentMode.execute();
      return true;
    } else {
      console.log('❓ No supported mode detected on this page');
      console.log('Available modes:', this.handlers.map(h => h.name).join(', '));
      return false;
    }
  }

  public listAvailableModes(): string[] {
    return this.handlers.map(handler => handler.name);
  }

  public addHandler(handler: ModeHandler): void {
    this.handlers.push(handler);
  }

  public removeHandler(name: string): boolean {
    const index = this.handlers.findIndex(h => h.name === name);
    if (index > -1) {
      this.handlers.splice(index, 1);
      return true;
    }
    return false;
  }
}