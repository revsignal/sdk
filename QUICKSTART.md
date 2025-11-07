# Quick Start Guide - V1

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Terminal/Command line access

## Setup Steps

### 1. Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd agentic-tagging

# Install SDK dependencies
npm install

# Build the SDK
npm run build
```

### 2. Start the Backend

```bash
# Navigate to server directory
cd server

# Install backend dependencies
npm install

# Start the server
npm run dev
```

You should see:
```
🚀 Agentic Tagging Server - V1
✓ Server running on http://localhost:3000
```

Keep this terminal window open!

### 3. Test with Example

Open a new terminal window:

```bash
# From project root
open example.html
# or on Linux: xdg-open example.html
# or on Windows: start example.html
```

Click the buttons in the example page and watch:
- Browser console for SDK logs
- Backend terminal for incoming events

### 4. Query Your Data

```bash
# Get recent events
curl http://localhost:3000/events?siteId=demo-site&limit=10

# Get event statistics
curl http://localhost:3000/stats?siteId=demo-site

# Health check
curl http://localhost:3000/health
```

## Add to Your Website

Add this code before the closing `</body>` tag:

```html
<script src="dist/agent.js"></script>
<script>
  Agent.init({
    writeKey: 'your-key',
    siteId: 'your-site',
    endpoint: 'http://localhost:3000',
    debug: true
  });
</script>
```

## What Gets Tracked Automatically?

- ✅ Page views
- ✅ Button clicks
- ✅ Link clicks
- ✅ Form submissions
- ✅ Scroll depth
- ✅ File downloads
- ✅ Outbound links

## Manual Tracking

```javascript
// Track custom event
Agent.track('purchase_completed', {
  amount: 99.99,
  currency: 'USD',
  items: 3
});

// Identify user
Agent.identify('user-123', {
  email: 'user@example.com',
  name: 'John Doe'
});

// Track page view
Agent.page('Product Page', {
  product_id: '123'
});
```

## Next Steps

1. ✅ **Deploy Backend** - Deploy to Heroku, Railway, or your own server
2. ✅ **Update Endpoint** - Change `endpoint` in `Agent.init()` to your production URL
3. ✅ **Turn Off Debug** - Set `debug: false` in production
4. ✅ **Analyze Data** - Query the `/events` endpoint or connect to the SQLite database

## Troubleshooting

### SDK not loading?
- Check that `dist/agent.js` exists (run `npm run build`)
- Check browser console for errors

### Events not saving?
- Check that backend is running on port 3000
- Check backend terminal for errors
- Verify `endpoint` in `Agent.init()` is correct

### CORS errors?
- Add your frontend URL to `ALLOWED_ORIGINS` in `server/.env`

## What's Next? (V2 Roadmap)

- 🤖 AI-powered event suggestions (LangGraph)
- 🔗 Webhooks for real-time integrations
- 📊 Built-in analytics dashboard
- 🎯 Automatic rule generation
- 📈 Advanced analytics and insights

---

**Need help?** Check the full documentation in `README.md` and `INTEGRATION.md`.

