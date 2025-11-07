/**
 * Storage Layer - PostgreSQL
 * Multi-tenant event storage with customer isolation
 */

import { Pool, PoolClient } from 'pg';
import { CONFIG } from './config';

export interface StoredEvent {
  id?: number;
  customer_id: string;
  event: string;
  ts: string;
  site_id: string;
  session_id: string;
  pageview_id: string;
  anonymous_id: string;
  user_id?: string;
  properties?: any;
  context?: any;
  created_at?: Date;
}

export class Storage {
  private pool: Pool;
  private initialized: boolean = false;

  constructor() {
    this.pool = new Pool({
      connectionString: CONFIG.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      console.error('[Storage] Unexpected database error:', err);
    });

    // Initialize asynchronously without blocking constructor
    this.init().catch(err => {
      console.error('[Storage] Failed to initialize:', err);
    });
  }

  /**
   * Initialize database schema
   */
  private async init(): Promise<void> {
    if (this.initialized) return;
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS events (
          id BIGSERIAL PRIMARY KEY,
          customer_id TEXT NOT NULL,
          event TEXT NOT NULL,
          ts TIMESTAMP NOT NULL,
          site_id TEXT NOT NULL,
          session_id TEXT NOT NULL,
          pageview_id TEXT NOT NULL,
          anonymous_id TEXT NOT NULL,
          user_id TEXT,
          properties JSONB,
          context JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Indexes for performance
      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_events_customer_site_ts 
        ON events(customer_id, site_id, ts DESC)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_events_customer_session 
        ON events(customer_id, session_id, ts ASC)
      `);

      await this.pool.query(`
        CREATE INDEX IF NOT EXISTS idx_events_customer_user 
        ON events(customer_id, user_id, ts DESC)
        WHERE user_id IS NOT NULL
      `);

      this.initialized = true;
      console.log('[Storage] Database initialized successfully');
    } catch (error) {
      console.error('[Storage] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  /**
   * Save a single event
   */
  async saveEvent(customerId: string, event: any): Promise<void> {
    await this.ensureInitialized();
    
    try {
      await this.pool.query(
        `INSERT INTO events (
          customer_id, event, ts, site_id, session_id, pageview_id,
          anonymous_id, user_id, properties, context
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          customerId,
          event.event,
          event.ts,
          event.site_id,
          event.session_id,
          event.pageview_id,
          event.user.anonymous_id,
          event.user.user_id || null,
          event.properties || null,
          event.context || null,
        ]
      );
    } catch (error) {
      console.error('[Storage] Failed to save event:', error);
      throw error;
    }
  }

  /**
   * Save multiple events (batch)
   */
  async saveEvents(customerId: string, events: any[]): Promise<void> {
    await this.ensureInitialized();
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      for (const event of events) {
        await client.query(
          `INSERT INTO events (
            customer_id, event, ts, site_id, session_id, pageview_id,
            anonymous_id, user_id, properties, context
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            customerId,
            event.event,
            event.ts,
            event.site_id,
            event.session_id,
            event.pageview_id,
            event.user.anonymous_id,
            event.user.user_id || null,
            event.properties || null,
            event.context || null,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Storage] Failed to save events:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get events by site (with customer isolation)
   */
  async getEventsBySite(customerId: string, siteId: string, limit: number = 100): Promise<StoredEvent[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM events 
         WHERE customer_id = $1 AND site_id = $2 
         ORDER BY ts DESC 
         LIMIT $3`,
        [customerId, siteId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error('[Storage] Failed to get events by site:', error);
      throw error;
    }
  }

  /**
   * Get events by session (with customer isolation)
   */
  async getEventsBySession(customerId: string, sessionId: string): Promise<StoredEvent[]> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM events 
         WHERE customer_id = $1 AND session_id = $2 
         ORDER BY ts ASC`,
        [customerId, sessionId]
      );
      return result.rows;
    } catch (error) {
      console.error('[Storage] Failed to get events by session:', error);
      throw error;
    }
  }

  /**
   * Get event count (with customer isolation)
   */
  async getEventCount(customerId: string, siteId?: string): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM events WHERE customer_id = $1';
      const params: any[] = [customerId];

      if (siteId) {
        query += ' AND site_id = $2';
        params.push(siteId);
      }

      const result = await this.pool.query(query, params);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('[Storage] Failed to get event count:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.pool.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('[Storage] Health check failed:', error);
      return false;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}
