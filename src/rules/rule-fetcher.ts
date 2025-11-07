/**
 * Rule Fetcher
 * Fetches approved rules from server
 */

import { Rule } from '../types';

export class RuleFetcher {
  private endpoint: string;
  private siteId: string;
  private pollInterval?: number;

  constructor(endpoint: string, siteId: string) {
    this.endpoint = endpoint;
    this.siteId = siteId;
  }

  /**
   * Fetch rules from server
   */
  async fetchRules(): Promise<Rule[]> {
    try {
      const response = await fetch(`${this.endpoint}/agent/rules?siteId=${this.siteId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.rules || [];
    } catch (error) {
      console.error('[Agent] Failed to fetch rules:', error);
      return [];
    }
  }

  /**
   * Start polling for rule updates
   */
  startPolling(callback: (rules: Rule[]) => void, intervalMs: number = 60000): void {
    this.pollInterval = window.setInterval(async () => {
      const rules = await this.fetchRules();
      callback(rules);
    }, intervalMs);
  }

  /**
   * Stop polling
   */
  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

