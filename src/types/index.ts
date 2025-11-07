/**
 * TypeScript types for Agentic Tagging SDK
 */

/**
 * User interaction captured by the SDK
 */
export interface Interaction {
  type: 'click' | 'submit' | 'change' | 'navigate';
  selector: string;
  element: {
    tag: string;
    text: string;
    attributes: Record<string, string>;
    xpath?: string;
  };
  timestamp: number;
  sessionId: string;
  context: {
    url: string;
    pageTitle: string;
    referrer: string;
    viewport: { width: number; height: number };
    scrollDepth: number;
    previousAction?: string;
    timeOnPage: number;
  };
  position?: { x: number; y: number }; // Click coordinates for heatmap
}

/**
 * Pattern data tracked client-side
 */
export interface PatternData {
  selector: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  element: {
    tag: string;
    text: string;
    attributes: Record<string, string>;
  };
}

/**
 * Approved tracking rule
 */
export interface Rule {
  id: string;
  siteId: string;
  selector: string;
  eventName: string;
  trigger: 'click' | 'submit' | 'change';
  properties: Record<string, any>;
  status: 'active' | 'retired' | 'needs_review';
  createdAt: number;
  updatedAt?: number;
}

/**
 * Tracked event sent to server
 */
export interface TrackedEvent {
  event: string;
  ts: string; // ISO 8601
  write_key?: string;
  site_id: string;
  session_id: string;
  pageview_id: string;
  user: {
    user_id?: string;
    anonymous_id: string;
  };
  context: {
    url: string;
    referrer: string;
    title: string;
    screen: { w: number; h: number; dpr: number };
    device: { ua: string; os?: string; browser?: string };
    locale: string;
  };
  properties?: Record<string, any>;
  agent?: {
    rule_id?: string;
    selector?: string;
    confidence?: number;
    version?: string;
  };
}

/**
 * SDK Configuration
 */
export interface AgentConfig {
  writeKey: string;
  siteId: string;
  endpoint?: string;
  businessObjective?: string; // Optional for V1, will be used in V2 for AI
  env?: 'prod' | 'stage' | 'dev';
  debug?: boolean;
}

