/**
 * Interaction Listener
 * Captures all user interactions on the page
 */

import { Interaction, PatternData } from '../types';

export class InteractionListener {
  private observations: Interaction[] = [];
  private patterns: Map<string, PatternData> = new Map();
  private lastInteraction?: string;
  private pageLoadTime: number;
  private siteId: string;
  private endpoint: string;
  private businessObjective: string;
  private sessionId: string;
  private writeKey: string;
  private getIdentity: () => { anonymousId: string; sessionId: string; pageviewId: string; userId?: string };
  private flushInterval?: number;
  private clickHandler?: EventListener;
  private submitHandler?: EventListener;
  private changeHandler?: EventListener;
  private visibilityHandler?: EventListener;
  private beforeUnloadHandler?: EventListener;
  private scrollHandler?: EventListener;
  private scrollMilestones: Set<number> = new Set([25, 50, 75, 100]);
  private reachedMilestones: Set<number> = new Set();

  constructor(config: {
    siteId: string;
    endpoint: string;
    businessObjective: string;
    sessionId: string;
    writeKey: string;
    getIdentity: () => { anonymousId: string; sessionId: string; pageviewId: string; userId?: string };
  }) {
    this.siteId = config.siteId;
    this.endpoint = config.endpoint;
    this.businessObjective = config.businessObjective;
    this.sessionId = config.sessionId;
    this.writeKey = config.writeKey;
    this.getIdentity = config.getIdentity;
    this.pageLoadTime = Date.now();
  }

  /**
   * Start observing interactions
   */
  start(): void {
    // Create handler functions and store references
    this.clickHandler = (e) => this.recordInteraction(e, 'click');
    this.submitHandler = (e) => this.recordInteraction(e, 'submit');
    this.changeHandler = (e) => this.recordInteraction(e, 'change');
    this.visibilityHandler = () => {
      if (document.hidden) {
        this.flushObservations(); // Flush before tab hide
      }
    };
    this.beforeUnloadHandler = () => {
      this.flushObservations();
    };
    this.scrollHandler = () => this.trackScrollMilestones();

    // Capture phase to catch events early
    document.addEventListener('click', this.clickHandler, true);
    document.addEventListener('submit', this.submitHandler, true);
    document.addEventListener('change', this.changeHandler, true);

    // Track page visibility changes
    document.addEventListener('visibilitychange', this.visibilityHandler);

    // Track scroll milestones
    window.addEventListener('scroll', this.scrollHandler, { passive: true });

    // Periodic flush (reduced to 10s for demo)
    this.flushInterval = window.setInterval(() => this.flushObservations(), 10000); // Every 10s

    // Flush on unload
    window.addEventListener('beforeunload', this.beforeUnloadHandler);

    console.log('[Agent] InteractionListener started');
  }

  /**
   * Stop observing
   */
  stop(): void {
    // Clear interval
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    // Remove all event listeners
    if (this.clickHandler) {
      document.removeEventListener('click', this.clickHandler, true);
    }
    if (this.submitHandler) {
      document.removeEventListener('submit', this.submitHandler, true);
    }
    if (this.changeHandler) {
      document.removeEventListener('change', this.changeHandler, true);
    }
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
    }
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }

    console.log('[Agent] InteractionListener stopped');
  }

  /**
   * Check if link is outbound (external domain)
   */
  private isOutboundLink(element: HTMLElement): boolean {
    if (element.tagName.toLowerCase() !== 'a') {
      // Check if parent is an anchor
      const anchor = element.closest('a');
      if (anchor) {
        element = anchor as HTMLElement;
      } else {
        return false;
      }
    }
    
    const href = element.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return false;
    }
    
    try {
      const linkUrl = new URL(href, window.location.href);
      return linkUrl.hostname !== window.location.hostname;
    } catch {
      return false;
    }
  }

  /**
   * Check if link is a file download
   */
  private isFileDownload(element: HTMLElement): boolean {
    if (element.tagName.toLowerCase() !== 'a') {
      const anchor = element.closest('a');
      if (anchor) {
        element = anchor as HTMLElement;
      } else {
        return false;
      }
    }
    
    const href = element.getAttribute('href');
    if (!href) return false;
    
    const fileExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.tar', '.gz', '.csv', '.txt'];
    return fileExtensions.some(ext => href.toLowerCase().endsWith(ext));
  }

  /**
   * Record an interaction
   */
  private recordInteraction(event: Event, type: string): void {
    const target = event.target as HTMLElement;
    if (!target || !target.tagName) return;

    const selector = this.generateSelector(target);
    
    // Detect outbound links and file downloads on click events
    if (type === 'click') {
      if (this.isOutboundLink(target)) {
        const anchor = target.tagName.toLowerCase() === 'a' ? target : target.closest('a');
        const href = anchor?.getAttribute('href') || '';
        console.log(`[Agent] Outbound link clicked: ${href}`);
      }
      
      if (this.isFileDownload(target)) {
        const anchor = target.tagName.toLowerCase() === 'a' ? target : target.closest('a');
        const href = anchor?.getAttribute('href') || '';
        console.log(`[Agent] File download clicked: ${href}`);
      }
    }

    // Update pattern frequency
    const patternKey = selector;
    const existing = this.patterns.get(patternKey) || {
      selector,
      count: 0,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      element: {
        tag: target.tagName.toLowerCase(),
        text: this.getElementText(target),
        attributes: this.getAttributes(target),
      },
    };
    existing.count++;
    existing.lastSeen = Date.now();
    this.patterns.set(patternKey, existing);

    // Record full interaction
    const attributes = this.getAttributes(target);
    
    // Add metadata for outbound links and file downloads
    if (type === 'click') {
      if (this.isOutboundLink(target)) {
        attributes['data-outbound'] = 'true';
      }
      if (this.isFileDownload(target)) {
        attributes['data-file-download'] = 'true';
      }
    }
    
    const interaction: Interaction = {
      type: type as any,
      selector,
      element: {
        tag: target.tagName.toLowerCase(),
        text: this.getElementText(target),
        attributes,
        xpath: this.generateXPath(target),
      },
      timestamp: Date.now(),
      sessionId: this.sessionId,
      context: {
        url: window.location.href,
        pageTitle: document.title,
        referrer: document.referrer,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        scrollDepth: this.getScrollDepth(),
        previousAction: this.lastInteraction,
        timeOnPage: Date.now() - this.pageLoadTime,
      },
    };

    // Add click coordinates for heatmap
    if (type === 'click' && event instanceof MouseEvent) {
      interaction.position = {
        x: event.clientX,
        y: event.clientY,
      };
    }

    this.observations.push(interaction);
    this.lastInteraction = selector;

    // Auto-flush if buffer is large (lowered threshold for demo)
    if (this.observations.length >= 10) {
      this.flushObservations();
    }

    // Safety: Drop oldest observations if buffer grows too large (prevents memory leak)
    if (this.observations.length > 100) {
      console.warn('[Agent] Observation buffer exceeded 100 items, dropping oldest observations');
      this.observations = this.observations.slice(-50); // Keep last 50
    }
  }

  /**
   * Flush observations to server (public for manual triggering)
   */
  async flushObservations(): Promise<void> {
    if (this.observations.length === 0) return;

    // Move observations to local variable and clear immediately to prevent race condition
    const observationsToSend = this.observations;
    this.observations = [];

    // Get current identity
    const identity = this.getIdentity();

    const payload = {
      siteId: this.siteId,
      sessionId: this.sessionId,
      anonymousId: identity.anonymousId,
      userId: identity.userId,
      pageviewId: identity.pageviewId,
      writeKey: this.writeKey,
      interactions: observationsToSend,
      patterns: this.serializePatterns(),
      businessObjective: this.businessObjective,
      timestamp: Date.now(),
    };

    try {
      const response = await fetch(`${this.endpoint}/agent/observe`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': this.writeKey,
        },
        body: JSON.stringify(payload),
        keepalive: true,
      });

      if (!response.ok) {
        console.warn(`[Agent] Failed to send observations: HTTP ${response.status}`);
        // Re-add observations to the front of the buffer for retry
        this.observations = [...observationsToSend, ...this.observations];
      }
    } catch (error) {
      console.error('[Agent] Failed to send observations:', error);
      // Re-add observations to the front of the buffer for retry
      this.observations = [...observationsToSend, ...this.observations];
    }
  }

  /**
   * Generate stable selector
   */
  private generateSelector(el: HTMLElement): string {
    // Priority 1: ID
    if (el.id) return `#${el.id}`;

    // Priority 2: data-testid or data-action
    if (el.getAttribute('data-testid')) {
      return `[data-testid="${el.getAttribute('data-testid')}"]`;
    }
    if (el.getAttribute('data-action')) {
      return `[data-action="${el.getAttribute('data-action')}"]`;
    }

    // Priority 3: Class-based selector (for grouping similar elements)
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(' ').filter((c) => c);
      if (classes.length > 0) {
        // Use class selector for pattern grouping (e.g., all "add-to-cart" buttons)
        return `.${classes.join('.')}`;
      }
    }

    // Priority 4: Build path
    const path: string[] = [];
    let current: HTMLElement | null = el;
    let depth = 0;

    while (current && current !== document.body && depth < 5) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${current.id}`;
        path.unshift(selector);
        break;
      }

      if (current.className && typeof current.className === 'string') {
        const classes = current.className
          .split(' ')
          .filter((c) => c)
          .slice(0, 2)
          .join('.');
        if (classes) selector += `.${classes}`;
      }

      // Add nth-child for specificity
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((c) => c.tagName === current!.tagName);
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
      depth++;
    }

    return path.join(' > ');
  }

  /**
   * Generate XPath
   */
  private generateXPath(el: HTMLElement): string {
    if (el.id) return `//*[@id="${el.id}"]`;

    const path: string[] = [];
    let current: HTMLElement | null = el;

    while (current && current !== document.body) {
      let index = 1;
      let sibling = current.previousElementSibling;

      while (sibling) {
        if (sibling.tagName === current.tagName) index++;
        sibling = sibling.previousElementSibling;
      }

      const tagName = current.tagName.toLowerCase();
      path.unshift(`${tagName}[${index}]`);
      current = current.parentElement;
    }

    return '/' + path.join('/');
  }

  /**
   * Get element text
   */
  private getElementText(el: HTMLElement): string {
    let text = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || '';
      }
    }
    return text.trim().slice(0, 100);
  }

  /**
   * Get element attributes
   */
  private getAttributes(el: HTMLElement): Record<string, string> {
    const attrs: Record<string, string> = {};
    const relevantAttrs = [
      'id',
      'class',
      'name',
      'type',
      'href',
      'data-action',
      'data-testid',
      'aria-label',
      'title',
      'role',
      'placeholder',
    ];

    relevantAttrs.forEach((attr) => {
      const value = el.getAttribute(attr);
      if (value) attrs[attr] = value.slice(0, 200);
    });

    return attrs;
  }

  /**
   * Get scroll depth
   */
  private getScrollDepth(): number {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return Math.round(((scrollTop + windowHeight) / documentHeight) * 100);
  }

  /**
   * Track scroll milestones (25%, 50%, 75%, 100%)
   */
  private trackScrollMilestones(): void {
    const scrollDepth = this.getScrollDepth();
    
    // Check if any milestone has been reached
    this.scrollMilestones.forEach(milestone => {
      if (scrollDepth >= milestone && !this.reachedMilestones.has(milestone)) {
        this.reachedMilestones.add(milestone);
        
        // Create a synthetic interaction for the scroll milestone
        const interaction: Interaction = {
          type: 'navigate' as any, // Using 'navigate' type for scroll events
          selector: 'document',
          element: {
            tag: 'body',
            text: `Scroll ${milestone}%`,
            attributes: { 'data-scroll-milestone': milestone.toString() },
          },
          timestamp: Date.now(),
          sessionId: this.sessionId,
          context: {
            url: window.location.href,
            pageTitle: document.title,
            referrer: document.referrer,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight,
            },
            scrollDepth: milestone,
            previousAction: this.lastInteraction,
            timeOnPage: Date.now() - this.pageLoadTime,
          },
        };
        
        this.observations.push(interaction);
        console.log(`[Agent] Scroll milestone reached: ${milestone}%`);
        
        // Auto-flush if buffer is large
        if (this.observations.length >= 10) {
          this.flushObservations();
        }
      }
    });
  }

  /**
   * Serialize patterns for sending
   */
  private serializePatterns(): Record<string, any> {
    const serialized: Record<string, any> = {};
    this.patterns.forEach((data, selector) => {
      serialized[selector] = {
        count: data.count,
        firstSeen: data.firstSeen,
        lastSeen: data.lastSeen,
        element: data.element,
      };
    });
    return serialized;
  }

  /**
   * Get stats for debugging
   */
  getStats() {
    return {
      observationsBuffered: this.observations.length,
      patternsDetected: this.patterns.size,
      topPatterns: Array.from(this.patterns.entries())
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([selector, data]) => ({
          selector,
          count: data.count,
          element: data.element.text || data.element.tag,
        })),
    };
  }
}

