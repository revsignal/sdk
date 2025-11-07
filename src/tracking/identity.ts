/**
 * Identity Management
 * Handles anonymous ID, session ID, and user identification
 */

export class Identity {
  private anonymousId: string;
  private sessionId: string;
  private pageviewId: string;
  private userId?: string;

  constructor() {
    this.anonymousId = this.getOrCreateAnonymousId();
    this.sessionId = this.getOrCreateSessionId();
    this.pageviewId = this.generateId();
  }

  /**
   * Get or create anonymous ID (1 year cookie)
   */
  private getOrCreateAnonymousId(): string {
    const key = '_agent_aid';
    let id = this.getCookie(key);
    if (!id) {
      id = this.generateId();
      this.setCookie(key, id, 365);
    }
    return id;
  }

  /**
   * Get or create session ID (session storage)
   */
  private getOrCreateSessionId(): string {
    const key = '_agent_sid';
    try {
      let id = sessionStorage.getItem(key);
      if (!id) {
        id = this.generateId();
        sessionStorage.setItem(key, id);
      }
      return id;
    } catch (error) {
      // Fallback for private browsing mode or storage errors
      console.warn('[Identity] sessionStorage not available, using in-memory session ID');
      return this.generateId();
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Get cookie value
   */
  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  /**
   * Set cookie
   */
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${secure}`;
  }

  /**
   * Get all IDs
   */
  getIds() {
    return {
      anonymousId: this.anonymousId,
      sessionId: this.sessionId,
      pageviewId: this.pageviewId,
      userId: this.userId,
    };
  }

  /**
   * Identify user
   */
  identify(userId: string): void {
    this.userId = userId;
  }

  /**
   * Reset identity (clear user ID)
   */
  reset(): void {
    this.userId = undefined;
  }

  /**
   * Generate new pageview ID (call on page navigation)
   */
  newPageview(): void {
    this.pageviewId = this.generateId();
  }
}

