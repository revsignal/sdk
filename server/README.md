# Backend Server - V1

Simple Node.js backend for collecting and storing events from the Agentic Tagging SDK.

## Features

- ✅ Event collection via POST /track
- ✅ PostgreSQL database storage
- ✅ Multi-tenant ready (customer isolation)
- ✅ Optional authentication
- ✅ Query endpoints for debugging
- ✅ CORS support
- ✅ Batch event support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Database

**Install PostgreSQL:**
- Mac: `brew install postgresql && brew services start postgresql`
- Ubuntu: `sudo apt install postgresql`
- Or use hosted: [Railway](https://railway.app), [Supabase](https://supabase.com), [Neon](https://neon.tech)

**Create database:**
```bash
createdb agentic_tagging
```

### 3. Configure

Create a `.env` file (copy from `.env.example`):

```bash
# Database (required)
DATABASE_URL=postgresql://localhost:5432/agentic_tagging

# Server
PORT=3000
NODE_ENV=development

# Security (demo mode for testing)
DEMO_MODE=true
REQUIRE_AUTH=false

# CORS
ALLOWED_ORIGINS=*
```

### 4. Start Server

**Development mode (auto-restart on changes):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

Server will run on `http://localhost:3000`

## API Endpoints

### POST /track
Track single event or batch of events (manual tracking).

### POST /agent/observe
Receive automatic interaction tracking data from the SDK.

**Single Event:**
```bash
curl -X POST http://localhost:3000/track \
  -H "Content-Type: application/json" \
  -d '{
    "event": "button_clicked",
    "ts": "2024-01-01T12:00:00.000Z",
    "site_id": "demo-site",
    "session_id": "session_123",
    "pageview_id": "pageview_456",
    "user": {
      "anonymous_id": "anon_789"
    },
    "properties": {
      "button_name": "Sign Up"
    }
  }'
```

**Batch Events:**
```bash
curl -X POST http://localhost:3000/track \
  -H "Content-Type: application/json" \
  -d '[
    { "event": "page_view", ... },
    { "event": "button_clicked", ... }
  ]'
```

### GET /events?siteId=demo-site&limit=100
Get events for a site (debugging).

```bash
curl http://localhost:3000/events?siteId=demo-site&limit=10
```

### GET /session/:sessionId
Get all events for a session (debugging).

```bash
curl http://localhost:3000/session/session_123
```

### GET /stats?siteId=demo-site
Get event statistics.

```bash
curl http://localhost:3000/stats?siteId=demo-site
```

### GET /health
Health check endpoint.

```bash
curl http://localhost:3000/health
```

## Database

Events are stored in PostgreSQL with automatic schema creation.

**Schema:**
```sql
CREATE TABLE events (
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
);
```

**Indexes:**
- `idx_events_customer_site_ts` - Query by customer, site, and time
- `idx_events_customer_session` - Query by customer and session
- `idx_events_customer_user` - Query by customer and user

## Deployment

### Heroku

```bash
# Create app
heroku create your-app-name

# Set environment variables
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Development

### Project Structure

```
/server
├── src/
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database layer (PostgreSQL)
│   ├── config.ts          # Configuration & feature flags
│   └── middleware/
│       └── auth.ts        # Authentication middleware
├── dist/                  # Built files
├── .env.example           # Example configuration
├── package.json
└── tsconfig.json
```

### Adding New Endpoints

Edit `src/routes.ts`:

```typescript
router.get('/my-endpoint', (req, res) => {
  // Your logic here
  res.json({ success: true });
});
```

### Modifying Database

Edit `src/storage.ts` to add new tables or queries.

## Troubleshooting

### Port already in use
Change the port in `.env`:
```bash
PORT=3001
```

### Database connection errors
Check your `DATABASE_URL` is correct and PostgreSQL is running:
```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql $DATABASE_URL
```

### CORS errors
Add your frontend URL to `ALLOWED_ORIGINS` in `.env`:
```bash
ALLOWED_ORIGINS=http://localhost:8080,https://yoursite.com
```

## Future Enhancements (V2+)

- [ ] AI agent integration (LangGraph)
- [ ] Webhooks
- [ ] Rate limiting
- [ ] Real-time dashboard
- [ ] Event replay
- [ ] Data export
- [ ] Full multi-tenant authentication

