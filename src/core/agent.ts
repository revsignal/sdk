/**
 * Main Agent Class - V1
 * Event tracking SDK with automatic interaction capture
 */

import { Identity } from '../tracking/identity';
import { Tracker } from '../tracking/tracker';
import { InteractionListener } from '../observation/interaction-listener';
import { AgentConfig } from '../types';

class AgentSDK {
  private config?: AgentConfig;
  private identity?: Identity;
  private tracker?: Tracker;
  private listener?: InteractionListener;
  private initialized: boolean = false;

  /**
   * Initialize the Agent SDK
   */
  async init(config: AgentConfig): Promise<void> {
    // Validate config
    if (!config.writeKey) throw new Error('writeKey is required');
    if (!config.siteId) throw new Error('siteId is required');

    this.config = {
      endpoint: 'http://localhost:3000',
      env: 'dev',
      debug: false,
      ...config,
    };

    if (this.config.debug) {
      console.log('[Agent] Initializing...', {
        siteId: this.config.siteId,
        endpoint: this.config.endpoint,
      });
    }

    // Initialize identity
    this.identity = new Identity();

    // Initialize tracker
    this.tracker = new Tracker(
      this.identity, 
      this.config.endpoint!, 
      this.config.siteId,
      this.config.writeKey
    );

    // Initialize interaction listener for automatic tracking
    const ids = this.identity.getIds();
    this.listener = new InteractionListener({
      siteId: this.config.siteId,
      endpoint: this.config.endpoint!,
      businessObjective: this.config.businessObjective || 'Track user interactions',
      sessionId: ids.sessionId,
      writeKey: this.config.writeKey,
      getIdentity: () => this.identity!.getIds(),
    });

    this.initialized = true;

    // Auto-track initial page view
    this.tracker!.page();

    // Start automatic interaction tracking
    this.listener!.start();

    // Expose debug interface
    if (this.config.debug) {
      (window as any).__Agent = {
        version: '1.0.0',
        config: this.config,
        getIds: () => this.identity?.getIds(),
        getStats: () => this.listener?.getStats(),
      };
      console.log('[Agent] Initialized successfully');
      console.log('[Agent] Automatic tracking enabled: clicks, forms, scroll');
    }
  }

  /**
   * Track page view
   */
  page(name?: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('[Agent] Not initialized. Call Agent.init() first');
      return;
    }
    this.tracker!.page(name, properties);
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('[Agent] Not initialized. Call Agent.init() first');
      return;
    }
    this.tracker!.track(eventName, properties);
  }

  /**
   * Identify user
   */
  identify(userId: string, traits?: Record<string, any>): void {
    if (!this.initialized) {
      console.warn('[Agent] Not initialized. Call Agent.init() first');
      return;
    }
    this.tracker!.identify(userId, traits);
  }

  /**
   * Reset identity
   */
  reset(): void {
    this.identity?.reset();
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Stop automatic tracking (cleanup)
   */
  stop(): void {
    if (this.listener) {
      this.listener.stop();
    }
  }

}

// Export singleton instance
export const Agent = new AgentSDK();

