import { z } from 'zod';
import { ModeDetector } from './core/mode-detector';
import { AIService } from './services/ai';
import { NotificationService } from './services/notifications';

// @ts-ignore isolatedModules
console.log('🚀 FCC Helper userscript loaded');

// Initialize services
const modeDetector = new ModeDetector();
const notifications = NotificationService.getInstance();

// Show welcome notification
notifications.info('FCC Helper Loaded!', 'Press Ctrl+P to auto-solve quizzes and labs');

// Global keyboard event listener for Ctrl+P
document.addEventListener('keydown', async function(event) {
  if (event.ctrlKey && event.key === 'p') {
    event.preventDefault(); // Prevent default print dialog
    
    console.log('🎯 FCC Helper activated (Ctrl+P)');
    notifications.info('FCC Helper Activated!', 'Detecting page type...');
    
    const success = await modeDetector.executeCurrentMode();
    if (!success) {
      notifications.warning('No Mode Detected', 'This page type is not supported yet');
    }
  }
});

// Example function for testing AI service
async function exampleFn(): Promise<void> {
  try {
    console.log('🧪 Testing Gemini connection...');
    notifications.info('Testing AI', 'Connecting to Gemma...');
    
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
    notifications.success('AI Test Successful!', `Confidence: ${response.confidence}%`);
  } catch (error) {
    console.error('❌ Error testing Gemini:', error);
    notifications.error('AI Test Failed', 'Could not connect to AI service');
  }
}

// Expose functions globally for console access
window.exampleFn = exampleFn;

// Add some helpful console commands
(window as any).fccHelper = {
  detectMode: () => {
    const mode = modeDetector.detectCurrentMode();
    console.log('Current mode:', mode?.name || 'None detected');
    notifications.info('Mode Detection', mode?.name || 'No mode detected');
    return mode;
  },
  listModes: () => {
    const modes = modeDetector.listAvailableModes();
    console.log('Available modes:', modes);
    notifications.info('Available Modes', modes.join(', '));
    return modes;
  },
  executeMode: () => modeDetector.executeCurrentMode(),
  clearApiKey: () => {
    AIService.getInstance().clearApiKey();
    notifications.info('API Key Cleared', 'Enter new key on next AI request');
  }
};

console.log('💡 Available commands:');
console.log('  - Ctrl+P: Auto-detect and execute current mode');
console.log('  - exampleFn(): Test Gemini connection');
console.log('  - fccHelper.detectMode(): Check current page mode');
console.log('  - fccHelper.listModes(): List all available modes');
console.log('  - fccHelper.executeMode(): Manually execute current mode');
console.log('  - fccHelper.clearApiKey(): Clear stored API key');
