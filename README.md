# Agentic Tagging SDK

Client-side SDK for First-Party Web Data Collection. This SDK automatically captures user interactions and sends them to your backend for storage and analysis.

**By RevSignal.IO**

## What's Included

This repository contains:
- **Client SDK** (`/src`) - Browser-side event tracking
- **Backend Server** (`/server`) - Simple Node.js server for data collection (V1)

## Quick Start

### 1. Start the Backend Server

```bash
# Install backend dependencies
cd server
npm install

# Create .env file (optional, uses defaults)
cp .env.example .env

# Start server
npm run dev
```

Server will run on `http://localhost:3000`

### 2. Build the SDK

```bash
# From project root
npm install
npm run build
```

The built file will be available at `dist/agent.js`.

### 3. Add SDK to Your Website

**Via script tag:**
```html
<script src="dist/agent.js"></script>
<script>
  Agent.init({
    writeKey: 'your-write-key',
    siteId: 'your-site-id',
    endpoint: 'http://localhost:3000', // Your backend URL
    debug: true // Optional, enables debug logging
  });
</script>
```

**Via npm:**
```javascript
import Agent from '@agentic-tagging/sdk';

Agent.init({
  writeKey: 'your-write-key',
  siteId: 'your-site-id',
  endpoint: 'http://localhost:3000'
});
```

### 4. Start Tracking

The SDK automatically captures:
- ✅ Page views (automatic on init)
- ✅ All click events
- ✅ Form submissions
- ✅ Input changes
- ✅ Scroll depth milestones (25%, 50%, 75%, 100%)
- ✅ Outbound link clicks
- ✅ File downloads

**No additional code needed!** The SDK works automatically in the background.

**Manual tracking methods:**

```javascript
// Track page view
Agent.page('Homepage');

// Track custom event
Agent.track('button_clicked', {
  button_name: 'Sign Up',
  location: 'header'
});

// Identify user
Agent.identify('user-123', {
  email: 'user@example.com',
  name: 'John Doe'
});
```

## Backend Server

The included backend server (`/server`) provides:
- **POST /track** - Receive and store events
- **GET /events** - Query events by site (debug)
- **GET /session/:id** - Get events by session (debug)
- **GET /stats** - Get event statistics (debug)
- **GET /health** - Health check

### Backend Configuration

**Prerequisites:**
- PostgreSQL database (local or hosted)
  - Local: `brew install postgresql` (Mac) or [download](https://www.postgresql.org/download/)
  - Hosted: [Railway](https://railway.app), [Supabase](https://supabase.com), [Neon](https://neon.tech) (free tiers available)

**Setup:**

1. Create database:
   ```bash
   createdb agentic_tagging
   ```

2. Create `.env` file in `/server` directory:
   ```bash
   # Database (PostgreSQL required)
   DATABASE_URL=postgresql://localhost:5432/agentic_tagging
   
   # Security (toggle features)
   DEMO_MODE=true              # Set to false for production
   REQUIRE_AUTH=false          # Set to true to require API keys
   
   # Optional: Authentication
   WRITE_KEY=your-secret-key   # Only needed if REQUIRE_AUTH=true
   
   PORT=3000
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000
   ```

3. Install and start:
   ```bash
   cd server
   npm install
   npm run dev
   ```

The database schema will be created automatically on first run.

### Deploy Backend

The backend can be deployed to any Node.js hosting platform:
- Heroku
- Railway
- Render
- AWS/GCP/Azure
- Your own server

## SDK Configuration

### Required Parameters

- `writeKey` (string): Your API write key
- `siteId` (string): Unique identifier for your website

### Optional Parameters

- `businessObjective` (string): Description of your business goal (reserved for V2)
- `endpoint` (string): Backend API endpoint (default: `http://localhost:3000`)
- `env` (string): Environment - `'prod'` | `'stage'` | `'dev'` (default: `'dev'`)
- `debug` (boolean): Enable debug logging (default: `false`)

## Features

### Automatic Event Capture (V1)

The SDK automatically captures user interactions without any manual tracking code:

**User Actions (Automatic):**
- ✅ Click events (all page clicks)
- ✅ Form submissions
- ✅ Input changes
- ✅ Page views (automatic on init)
- ✅ Scroll milestones (25%, 50%, 75%, 100% depth)
- ✅ Outbound link clicks (external domains)
- ✅ File downloads (PDF, DOC, ZIP, XLS, PPT, etc.)

**Manual Tracking Methods:**
- ✅ `page()` - Track page views
- ✅ `track()` - Track custom events
- ✅ `identify()` - Identify users

**Context Data (Automatic):**
- ✅ Page URL, title, and referrer
- ✅ UTM campaign parameters (automatic extraction)
- ✅ Device information (screen size, browser, locale)
- ✅ User journey (previous actions, time on page)
- ✅ Element details (selectors, attributes, text content)
- ✅ Click coordinates (for heatmaps)
- ✅ Session and identity management

### Data Storage

All events are stored in PostgreSQL database with:
- Full event history
- Session tracking
- User identification
- Multi-tenant support
- Indexed queries for fast retrieval

### Identity Management

The SDK maintains consistent user identity:

- **Anonymous ID** - 1-year cookie (`_agent_aid`)
- **Session ID** - Session storage (`_agent_sid`)
- **User ID** - Optional, set via `identify()`
- **Pageview ID** - Unique per page view

```javascript
// Get current identifiers
const ids = Agent.getIds();
console.log(ids.anonymousId, ids.sessionId, ids.userId);
```

## Data Captured

### What Gets Tracked

Every interaction includes:

```typescript
{
  type: 'click' | 'submit' | 'change' | 'navigate',
  selector: string,              // CSS selector (e.g., '#signup-button')
  element: {
    tag: string,                 // HTML tag (e.g., 'button')
    text: string,                // Element text content
    attributes: {
      id, class, href, 
      'data-*', 'aria-*',
      'data-outbound': 'true',   // For external links
      'data-file-download': 'true' // For file downloads
    }
  },
  context: {
    url: string,                 // Current page URL
    pageTitle: string,
    referrer: string,
    viewport: { width, height },
    scrollDepth: number,         // Percentage (0-100)
    timeOnPage: number,          // Milliseconds
    campaign: {                  // UTM parameters (if present)
      utm_source, utm_medium, utm_campaign, utm_term, utm_content
    }
  }
}
```

### Best Practices

**1. Use semantic attributes for stable tracking:**

```html
<!-- ✅ Good: Stable selectors -->
<button data-testid="signup-button">Sign Up</button>
<button data-action="add-to-cart">Add to Cart</button>

<!-- ❌ Avoid: Fragile selectors -->
<button class="btn-primary-v2-mobile">Sign Up</button>
```

**2. Consistent event naming:**

```javascript
// ✅ Good: snake_case, descriptive
Agent.track('product_added_to_cart', { product_id: '123' });
Agent.track('checkout_started', { cart_value: 99.99 });

// ❌ Avoid: Inconsistent naming
Agent.track('addToCart', { id: '123' });
Agent.track('Checkout Started', { value: 99.99 });
```

**3. Structured properties:**

```javascript
// ✅ Good: Typed, structured data
Agent.track('purchase_completed', {
  order_id: 'ORD-123',
  total: 99.99,
  currency: 'USD',
  items: 3
});

// ❌ Avoid: Unstructured strings
Agent.track('purchase', {
  data: 'Order ORD-123 for $99.99'
});
```

## Debug Mode

Enable debug mode to access internal information:

```javascript
Agent.init({
  // ... config
  debug: true
});

// Access debug interface
window.__Agent.getIds();    // Get current IDs (anonymousId, sessionId, userId)
window.__Agent.getStats();  // Get interaction tracking stats
window.__Agent.config;      // View current configuration
window.__Agent.version;     // SDK version
```

## API Reference

### `Agent.init(config)`

Initialize the SDK with configuration.

**Parameters:**
- `config` (AgentConfig): Configuration object

**Returns:** `Promise<void>`

### `Agent.page(name?, properties?)`

Track a page view.

**Parameters:**
- `name` (string, optional): Page name
- `properties` (object, optional): Additional properties

### `Agent.track(eventName, properties?)`

Track a custom event.

**Parameters:**
- `eventName` (string): Event name
- `properties` (object, optional): Event properties

### `Agent.identify(userId, traits?)`

Identify a user.

**Parameters:**
- `userId` (string): User identifier
- `traits` (object, optional): User traits

### `Agent.reset()`

Reset user identity (clears user ID).

### `Agent.isInitialized()`

Check if the SDK is initialized.

**Returns:** `boolean`

## Development

### SDK Development

```bash
# Build SDK
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev

# Check bundle size
npm run size
```

### Backend Development

```bash
cd server

# Install dependencies
npm install

# Development mode (auto-restart on changes)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## Project Structure

```
/agentic-tagging
├── /src                    # Client SDK source
│   ├── /core              # Core agent logic
│   ├── /observation       # Interaction capture
│   ├── /tracking          # Event tracking
│   ├── /rules             # Rule execution
│   └── /types             # TypeScript types
├── /dist                   # Built SDK
├── /server                 # Backend server (V1)
│   ├── /src
│   │   ├── index.ts       # Server entry point
│   │   ├── routes.ts      # API routes
│   │   └── storage.ts     # Database layer
│   └── package.json
└── README.md
```

## Privacy & Compliance

### Data Collected

- ✅ Anonymous identifiers (cookies)
- ✅ Page URLs and titles
- ✅ Element selectors and attributes
- ✅ Click coordinates
- ✅ Device/browser information
- ✅ UTM campaign parameters

### Data NOT Collected

- ❌ Form field values (unless explicitly configured in rules)
- ❌ Password fields
- ❌ Credit card information
- ❌ Personal identifiable information (PII) by default

### GDPR/CCPA Compliance

To comply with privacy regulations:

1. **Obtain Consent** - Initialize SDK only after user consent
2. **Respect DNT** - Check `navigator.doNotTrack` before tracking
3. **Data Deletion** - Implement user data deletion via your backend
4. **Anonymization** - SDK uses anonymous IDs by default

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requires ES2015+ support.

## License

MIT License - Copyright (c) 2024 RevSignal.IO

See [LICENSE](./LICENSE) file for full details.

## Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ by [RevSignal.IO](https://revsignal.io)**
