/**
 * API Routes - V1
 * Event tracking with optional authentication
 */

import express from 'express';
import { Storage } from './storage';
import { optionalAuth } from './middleware/auth';
import { CONFIG } from './config';

const router = express.Router();

// Lazy initialization
let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage();
  }
  return storage;
}

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const storage = getStorage();
    const dbHealthy = await storage.healthCheck();

    if (!dbHealthy) {
      return res.status(503).json({
        status: 'unhealthy',
        database: 'error',
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      status: 'healthy',
      version: '1.0.0',
      database: 'ok',
      mode: CONFIG.DEMO_MODE ? 'demo' : 'production',
      auth: CONFIG.REQUIRE_AUTH ? 'enabled' : 'disabled',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Track events endpoint
 * Accepts single event or batch of events
 */
router.post('/track', optionalAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const customerId = req.customer!.id;
    const body = req.body;

    // Validate request body
    if (!body) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Request body is required',
      });
    }

    // Handle single event or batch
    const events = Array.isArray(body) ? body : [body];

    // Validate events
    for (const event of events) {
      if (!event.event) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'event field is required',
          field: 'event',
        });
      }
      if (!event.site_id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'site_id field is required',
          field: 'site_id',
        });
      }
      if (!event.ts) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'ts (timestamp) field is required',
          field: 'ts',
        });
      }
      if (!event.user || !event.user.anonymous_id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'user.anonymous_id is required',
          field: 'user.anonymous_id',
        });
      }
      if (!event.session_id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'session_id field is required',
          field: 'session_id',
        });
      }
      if (!event.pageview_id) {
        return res.status(400).json({
          error: 'Validation failed',
          message: 'pageview_id field is required',
          field: 'pageview_id',
        });
      }
    }

    // Save events with customer isolation
    if (events.length === 1) {
      await storage.saveEvent(customerId, events[0]);
    } else {
      await storage.saveEvents(customerId, events);
    }

    if (CONFIG.DEMO_MODE || CONFIG.NODE_ENV === 'development') {
      console.log(`[API] Saved ${events.length} event(s) for customer ${customerId}, site ${events[0].site_id}`);
    }

    res.json({
      success: true,
      count: events.length,
    });
  } catch (error: any) {
    console.error('[API] Error saving events:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: CONFIG.NODE_ENV === 'development' ? error.message : 'An error occurred while processing your request',
    });
  }
});

/**
 * Get events endpoint (for debugging)
 * Query params: siteId, limit
 */
router.get('/events', optionalAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const customerId = req.customer!.id;
    const siteId = req.query.siteId as string;
    const limit = parseInt(req.query.limit as string) || 100;

    if (!siteId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'siteId query parameter is required',
      });
    }

    // Get events with customer isolation
    const events = await storage.getEventsBySite(customerId, siteId, limit);
    const total = await storage.getEventCount(customerId, siteId);

    res.json({
      events,
      count: events.length,
      total,
      customer_id: customerId,
    });
  } catch (error: any) {
    console.error('[API] Error fetching events:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: CONFIG.NODE_ENV === 'development' ? error.message : 'An error occurred while fetching events',
    });
  }
});

/**
 * Get session events endpoint (for debugging)
 */
router.get('/session/:sessionId', optionalAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const customerId = req.customer!.id;
    const sessionId = req.params.sessionId;

    // Get events with customer isolation
    const events = await storage.getEventsBySession(customerId, sessionId);

    res.json({
      sessionId,
      events,
      count: events.length,
      customer_id: customerId,
    });
  } catch (error: any) {
    console.error('[API] Error fetching session events:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: CONFIG.NODE_ENV === 'development' ? error.message : 'An error occurred while fetching session events',
    });
  }
});

/**
 * Get stats endpoint (for debugging)
 */
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const customerId = req.customer!.id;
    const siteId = req.query.siteId as string;

    const totalEvents = await storage.getEventCount(customerId, siteId);

    res.json({
      totalEvents,
      siteId: siteId || 'all',
      customer_id: customerId,
    });
  } catch (error: any) {
    console.error('[API] Error fetching stats:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: CONFIG.NODE_ENV === 'development' ? error.message : 'An error occurred while fetching stats',
    });
  }
});

/**
 * Agent observations endpoint
 * Receives automatic interaction tracking data
 */
router.post('/agent/observe', optionalAuth, async (req, res) => {
  try {
    const storage = getStorage();
    const customerId = req.customer!.id;
    const { siteId, sessionId, anonymousId, userId, pageviewId, interactions, patterns, businessObjective } = req.body;

    if (!siteId || !sessionId || !interactions || !anonymousId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'siteId, sessionId, anonymousId, and interactions are required',
      });
    }

    // Convert interactions to tracked events
    const events = interactions.map((interaction: any) => ({
      event: `interaction_${interaction.type}`,
      ts: new Date(interaction.timestamp).toISOString(),
      site_id: siteId,
      session_id: sessionId,
      pageview_id: pageviewId || 'unknown',
      user: {
        anonymous_id: anonymousId,
        user_id: userId,
      },
      context: {
        url: interaction.context?.url,
        referrer: interaction.context?.referrer,
        title: interaction.context?.pageTitle,
        screen: {
          w: interaction.context?.viewport?.width,
          h: interaction.context?.viewport?.height,
          dpr: 1,
        },
        device: {
          ua: req.headers['user-agent'] || '',
        },
        locale: req.headers['accept-language']?.split(',')[0] || 'en',
      },
      properties: {
        selector: interaction.selector,
        element: interaction.element,
        position: interaction.position,
        scrollDepth: interaction.context?.scrollDepth,
        timeOnPage: interaction.context?.timeOnPage,
        previousAction: interaction.context?.previousAction,
      },
    }));

    // Save events
    await storage.saveEvents(customerId, events);

    if (CONFIG.DEMO_MODE || CONFIG.NODE_ENV === 'development') {
      console.log(`[API] Saved ${events.length} interaction(s) for customer ${customerId}, site ${siteId}`);
    }

    res.json({
      success: true,
      received: interactions.length,
    });
  } catch (error: any) {
    console.error('[API] Error saving observations:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: CONFIG.NODE_ENV === 'development' ? error.message : 'An error occurred while processing observations',
    });
  }
});

export default router;

