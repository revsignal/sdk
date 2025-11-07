/**
 * Configuration - Feature Flags
 * Control security features via environment variables
 */

export const CONFIG = {
  // Security features (toggle on/off)
  DEMO_MODE: process.env.DEMO_MODE === 'true',
  REQUIRE_AUTH: process.env.REQUIRE_AUTH === 'true',
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING === 'true',
  
  // Default customer (for demo/single client mode)
  DEFAULT_CUSTOMER_ID: process.env.DEFAULT_CUSTOMER_ID || 'demo-customer',
  
  // Authentication
  WRITE_KEY: process.env.WRITE_KEY,
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/agentic_tagging',
  
  // Server
  PORT: parseInt(process.env.PORT || '3000'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
};

// Log configuration on startup
export function logConfig() {
  console.log('[Config] Mode:', CONFIG.DEMO_MODE ? 'DEMO' : 'PRODUCTION');
  console.log('[Config] Auth Required:', CONFIG.REQUIRE_AUTH);
  console.log('[Config] Rate Limiting:', CONFIG.ENABLE_RATE_LIMITING);
  if (CONFIG.DEMO_MODE) {
    console.log('[Config] ⚠️  DEMO MODE - Security features disabled');
  }
}

