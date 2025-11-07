/**
 * Server Entry Point - V1
 * Express server with optional authentication
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';
import { CONFIG, logConfig } from './config';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const app = express();

// Middleware
app.use(cors({
  origin: CONFIG.ALLOWED_ORIGINS[0] === '*' ? '*' : CONFIG.ALLOWED_ORIGINS,
  credentials: CONFIG.ALLOWED_ORIGINS[0] !== '*',
}));

app.use(express.json({ limit: '5mb' }));

// Request logging (only in development/demo)
if (CONFIG.NODE_ENV === 'development' || CONFIG.DEMO_MODE) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/', routes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: CONFIG.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

// Start server
app.listen(CONFIG.PORT, () => {
  console.log('');
  console.log('🚀 Agentic Tagging Server - V1');
  console.log('━'.repeat(50));
  console.log(`✓ Server running on http://localhost:${CONFIG.PORT}`);
  console.log(`✓ Environment: ${CONFIG.NODE_ENV}`);
  console.log(`✓ Database: PostgreSQL`);
  logConfig();
  console.log('━'.repeat(50));
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST /track           - Track events');
  console.log('  POST /agent/observe   - Receive automatic interactions');
  console.log('  GET  /events          - Get events (debug)');
  console.log('  GET  /session/:id     - Get session events (debug)');
  console.log('  GET  /stats           - Get stats (debug)');
  console.log('  GET  /health          - Health check');
  console.log('');
  
  if (CONFIG.DEMO_MODE) {
    console.log('⚠️  WARNING: Running in DEMO mode');
    console.log('   - Authentication disabled');
    console.log('   - All events use customer_id: ' + CONFIG.DEFAULT_CUSTOMER_ID);
    console.log('');
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully');
  process.exit(0);
});

