/**
 * Authentication Middleware
 * Optional authentication based on feature flags
 */

import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      customer?: {
        id: string;
      };
    }
  }
}

/**
 * Optional authentication middleware
 * Checks auth only if REQUIRE_AUTH is enabled
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  // Skip auth in demo mode
  if (CONFIG.DEMO_MODE) {
    req.customer = { id: CONFIG.DEFAULT_CUSTOMER_ID };
    return next();
  }

  // Skip auth if not required
  if (!CONFIG.REQUIRE_AUTH) {
    req.customer = { id: CONFIG.DEFAULT_CUSTOMER_ID };
    return next();
  }

  // Auth is required - validate write key
  const writeKey = req.body?.writeKey || req.headers['x-api-key'] as string;

  if (!writeKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Write key must be provided in request body or X-API-Key header',
    });
  }

  // Validate against configured write key
  if (writeKey !== CONFIG.WRITE_KEY) {
    return res.status(401).json({
      error: 'Invalid write key',
      message: 'The provided write key is not valid',
    });
  }

  // Auth successful
  req.customer = { id: CONFIG.DEFAULT_CUSTOMER_ID };
  next();
}

/**
 * Validate that site_id belongs to customer
 * (For now, just ensures it's provided)
 */
export function validateSiteAccess(req: Request, res: Response, next: NextFunction) {
  const siteId = req.body?.site_id || req.query.siteId;

  if (!siteId) {
    return res.status(400).json({
      error: 'Bad request',
      message: 'site_id is required',
    });
  }

  // In future, validate site belongs to customer
  // For now, just pass through
  next();
}

