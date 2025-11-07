/**
 * Rule Executor
 * Executes approved tracking rules by attaching event listeners
 */

import { Rule } from '../types';
import { Tracker } from '../tracking/tracker';

export class RuleExecutor {
  private tracker: Tracker;
  private attachedRules: Map<string, Array<{ element: Element; handler: EventListener; trigger: string }>> = new Map();
  private delegatedRules: Map<string, { handler: EventListener; trigger: string }> = new Map();

  constructor(tracker: Tracker) {
    this.tracker = tracker;
  }

  /**
   * Execute rules using event delegation for dynamic content support
   */
  executeRules(rules: Rule[]): void {
    console.log(`[Agent] Executing ${rules.length} rules`);

    rules.forEach((rule) => {
      if (rule.status !== 'active') return;
      
      // Remove old listeners if rule already exists
      if (this.delegatedRules.has(rule.id)) {
        this.removeRuleListeners(rule.id);
      }

      // Use event delegation on document for dynamic content support
      const handler = this.createDelegatedHandler(rule);
      document.addEventListener(rule.trigger, handler, true);
      
      this.delegatedRules.set(rule.id, { handler, trigger: rule.trigger });
    });
  }

  /**
   * Create delegated event handler for a rule (supports dynamic content)
   */
  private createDelegatedHandler(rule: Rule): EventListener {
    return (event: Event) => {
      const target = event.target as Element;
      if (!target) return;

      try {
        // Check if the target or any parent matches the selector
        const matchedElement = target.closest(rule.selector);
        if (!matchedElement) return;

        // Extract properties from DOM
        const properties = this.extractProperties(matchedElement, rule.properties);

        // Track event
        this.tracker.track(rule.eventName, properties);

        console.log(`[Agent] Rule fired: ${rule.eventName}`, properties);
      } catch (error) {
        // Invalid selector or other DOM error
        console.error(`[Agent] Error executing rule ${rule.id}:`, error);
      }
    };
  }

  /**
   * Create event handler for a rule (legacy, kept for reference)
   */
  private createHandler(element: Element, rule: Rule): EventListener {
    return (event: Event) => {
      // Extract properties from DOM
      const properties = this.extractProperties(element, rule.properties);

      // Track event
      this.tracker.track(rule.eventName, properties);

      console.log(`[Agent] Rule fired: ${rule.eventName}`, properties);
    };
  }

  /**
   * Remove all listeners for a specific rule
   */
  private removeRuleListeners(ruleId: string): void {
    // Remove delegated listeners
    const delegatedListener = this.delegatedRules.get(ruleId);
    if (delegatedListener) {
      document.removeEventListener(delegatedListener.trigger, delegatedListener.handler, true);
      this.delegatedRules.delete(ruleId);
    }

    // Remove old-style listeners (for backward compatibility)
    const listeners = this.attachedRules.get(ruleId);
    if (listeners) {
      listeners.forEach(({ element, handler, trigger }) => {
        element.removeEventListener(trigger, handler);
      });
      this.attachedRules.delete(ruleId);
    }
  }

  /**
   * Extract properties from DOM based on rule configuration
   */
  private extractProperties(
    element: Element,
    propertyConfig: Record<string, any>
  ): Record<string, any> {
    const properties: Record<string, any> = {};

    for (const [key, value] of Object.entries(propertyConfig)) {
      if (typeof value === 'string') {
        // Check if it's a DOM query expression
        if (value.startsWith('[') && value.endsWith(']')) {
          // Extract attribute: [data-product-id]
          const attr = value.slice(1, -1);
          properties[key] = element.getAttribute(attr) || value;
        } else if (value.startsWith('closest(')) {
          // Extract from closest parent
          const match = value.match(/closest\('(.+)'\)/);
          if (match) {
            try {
              const closestEl = element.closest(match[1]);
              properties[key] = closestEl?.textContent?.trim() || value;
            } catch (error) {
              // Invalid selector in closest()
              console.warn(`[Agent] Invalid selector in closest(): ${match[1]}`);
              properties[key] = value;
            }
          }
        } else {
          // Static value
          properties[key] = value;
        }
      } else {
        // Static value
        properties[key] = value;
      }
    }

    // Add element text as fallback
    if (!properties.element_text && element.textContent) {
      properties.element_text = element.textContent.trim().slice(0, 100);
    }

    return properties;
  }

  /**
   * Remove rule and clean up listeners
   */
  removeRule(ruleId: string): void {
    this.removeRuleListeners(ruleId);
  }

  /**
   * Clean up all rule listeners (for SDK cleanup/re-initialization)
   */
  cleanup(): void {
    // Remove all delegated listeners
    for (const [ruleId, { handler, trigger }] of this.delegatedRules) {
      document.removeEventListener(trigger, handler, true);
    }
    this.delegatedRules.clear();

    // Remove all old-style listeners (for backward compatibility)
    for (const [ruleId, listeners] of this.attachedRules) {
      listeners.forEach(({ element, handler, trigger }) => {
        element.removeEventListener(trigger, handler);
      });
    }
    this.attachedRules.clear();

    console.log('[RuleExecutor] All rule listeners cleaned up');
  }
}

