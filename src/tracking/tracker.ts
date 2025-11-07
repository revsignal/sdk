/**
 * Event Tracker
 * Handles manual tracking (page, track, identify)
 */

import { Identity } from './identity';
import { TrackedEvent } from '../types';

export class Tracker {
  private identity: Identity;
  private endpoint: string;
  private siteId: string;
  private writeKey: string;

  constructor(identity: Identity, endpoint: string, siteId: string, writeKey: string) {
    this.identity = identity;
    this.endpoint = endpoint;
    this.siteId = siteId;
    this.writeKey = writeKey;
  }

  /**
   * Track page view
   */
  page(name?: string, properties?: Record<string, any>): void {
    const ids = this.identity.getIds();
    
    const event: TrackedEvent = {
      event: 'page',
      ts: new Date().toISOString(),
      site_id: this.siteId,
      session_id: ids.sessionId,
      pageview_id: ids.pageviewId,
      user: {
        anonymous_id: ids.anonymousId,
        user_id: ids.userId,
      },
      context: this.buildContext(),
      properties: {
        name: name || document.title,
        ...properties,
      },
    };

    this.send(event);
  }

  /**
   * Track custom event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    const ids = this.identity.getIds();
    
    const event: TrackedEvent = {
      event: eventName,
      ts: new Date().toISOString(),
      site_id: this.siteId,
      session_id: ids.sessionId,
      pageview_id: ids.pageviewId,
      user: {
        anonymous_id: ids.anonymousId,
        user_id: ids.userId,
      },
      context: this.buildContext(),
      properties,
    };

    this.send(event);
  }

  /**
   * Identify user
   */
  identify(userId: string, traits?: Record<string, any>): void {
    this.identity.identify(userId);
    
    const ids = this.identity.getIds();
    const event: TrackedEvent = {
      event: 'identify',
      ts: new Date().toISOString(),
      site_id: this.siteId,
      session_id: ids.sessionId,
      pageview_id: ids.pageviewId,
      user: {
        anonymous_id: ids.anonymousId,
        user_id: userId,
      },
      context: this.buildContext(),
      properties: traits,
    };

    this.send(event);
  }

  /**
   * Extract UTM parameters from URL
   */
  private extractUtmParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    const utmParams: Record<string, string> = {};
    
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
    utmKeys.forEach(key => {
      const value = params.get(key);
      if (value) {
        utmParams[key] = value;
      }
    });
    
    return utmParams;
  }

  /**
   * Build event context
   */
  private buildContext() {
    const utmParams = this.extractUtmParams();
    
    return {
      url: window.location.href,
      referrer: document.referrer,
      title: document.title,
      screen: {
        w: window.innerWidth,
        h: window.innerHeight,
        dpr: window.devicePixelRatio,
      },
      device: {
        ua: navigator.userAgent,
      },
      locale: navigator.language,
      ...(Object.keys(utmParams).length > 0 && { campaign: utmParams }),
    };
  }

  /**
   * Send event to server
   */
  private send(event: TrackedEvent): void {
    // Add writeKey to event payload for authentication
    const payload = {
      ...event,
      writeKey: this.writeKey,
    };

    fetch(`${this.endpoint}/track`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-API-Key': this.writeKey,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch((error) => {
      console.error('[Agent] Failed to send event:', error);
    });
  }
}

