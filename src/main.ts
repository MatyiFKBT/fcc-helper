import { z } from 'zod';
import { ModeDetector } from './core/mode-detector';
import { AIService } from './services/ai';

// @ts-ignore isolatedModules
console.log('🚀 FCC Helper userscript loaded');

// Initialize the mode detector
const modeDetector = new ModeDetector();

// Global keyboard event listener for Ctrl+P
document.addEventListener('keydown', async function(event) {
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault(); // Prevent default print dialog
    
    console.log('🎯 FCC Helper activated (Ctrl+P)');
    await modeDetector.executeCurrentMode();
  }
});

// Example function for testing AI service
async function exampleFn(): Promise<void> {
  try {
    console.log('🧪 Testing Gemini connection...');
    
    const aiService = AIService.getInstance();
    
    const response = await aiService.generateStructuredResponse(
      z.object({
        greeting: z.string(),
        fact: z.string(),
        confidence: z.number().min(0).max(100)
      }),
      'Hello! Please respond with a friendly greeting and tell me something interesting about AI. Also rate your confidence in the fact from 0-100.'
    );

    console.log('✅ Gemini response:', response);
  } catch (error) {
    console.error('❌ Error testing Gemini:', error);
  }
}

// Expose functions globally for console access
window.exampleFn = exampleFn;

// Add some helpful console commands
(window as any).fccHelper = {
  detectMode: () => {
    const mode = modeDetector.detectCurrentMode();
    console.log('Current mode:', mode?.name || 'None detected');
    return mode;
  },
  listModes: () => {
    const modes = modeDetector.listAvailableModes();
    console.log('Available modes:', modes);
    return modes;
  },
  executeMode: () => modeDetector.executeCurrentMode(),
  clearApiKey: () => AIService.getInstance().clearApiKey()
};

console.log('💡 Available commands:');
console.log('  - Ctrl+P: Auto-detect and execute current mode');
console.log('  - exampleFn(): Test Gemini connection');
console.log('  - fccHelper.detectMode(): Check current page mode');
console.log('  - fccHelper.listModes(): List all available modes');
console.log('  - fccHelper.executeMode(): Manually execute current mode');
console.log('  - fccHelper.clearApiKey(): Clear stored API key');
