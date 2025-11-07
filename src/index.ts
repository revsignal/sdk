/**
 * SDK Entry Point
 * Exports the Agent SDK to window.Agent
 */

import { Agent } from './core/agent';

// Attach to window for browser usage
if (typeof window !== 'undefined') {
  (window as any).Agent = Agent;
  
  // Fix for esbuild IIFE: if window.Agent is a module wrapper, unwrap it
  // This can happen when esbuild creates a module wrapper around the IIFE
  if (window.Agent && typeof window.Agent === 'object' && window.Agent.__esModule) {
    // If it's a module wrapper, use the default export
    if (window.Agent.default) {
      (window as any).Agent = window.Agent.default;
    }
  }
}

// Export as default for IIFE to work properly
export default Agent;

