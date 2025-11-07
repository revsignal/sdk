# How to Add Agentic Tagging to Your Website

This guide will help you add the Agentic Tagging SDK to your website in just a few minutes.

## What You'll Need

Before you start, make sure you have:

1. ✅ The **Backend Server** running (see setup below)
2. ✅ Your **Write Key** (any string, e.g., `demo-key`)
3. ✅ Your **Site ID** (any string, e.g., `my-website`)
4. ✅ Access to edit your website's HTML code

## Step 0: Start the Backend Server

First, you need to run the backend server that will collect events:

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server
npm run dev
```

The server will run on `http://localhost:3000`. You should see:
```
🚀 Agentic Tagging Server - V1
✓ Server running on http://localhost:3000
```

---

## Quick Start (3 Easy Steps)

### Step 1: Build the SDK

```bash
# From project root
npm install
npm run build
```

This creates `dist/agent.js`.

### Step 2: Copy the Code Below

```html
<script src="dist/agent.js"></script>
<script>
  Agent.init({
    writeKey: 'demo-key',
    siteId: 'my-website',
    endpoint: 'http://localhost:3000',
    debug: true
  });
</script>
```

### Step 3: Customize (Optional)

Replace these values if needed:

- **`writeKey`** → Any identifier (e.g., `my-app-key`)
- **`siteId`** → Your site identifier (e.g., `my-online-store`)
- **`endpoint`** → Your backend URL (default: `http://localhost:3000`)
- **`debug`** → Set to `false` in production

**Example:**

```html
<script src="dist/agent.js"></script>
<script>
  Agent.init({
    writeKey: 'my-production-key',
    siteId: 'my-online-store',
    endpoint: 'https://analytics.mycompany.com',
    debug: false
  });
</script>
```

### Step 4: Add to Your Website

Paste the code just before the closing `</body>` tag on every page you want to track.

**Where to paste:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  
  <!-- Your website content goes here -->
  <h1>Welcome!</h1>
  
  <!-- 👇 PASTE THE CODE HERE, right before </body> -->
  <script src="dist/agent.js"></script>
  <script>
    Agent.init({
      writeKey: 'demo-key',
      siteId: 'my-website',
      endpoint: 'http://localhost:3000',
      debug: true
    });
  </script>
  
</body>
</html>
```

Or try the included example:
```bash
# Open example.html in your browser
open example.html
```

---

## That's It! 🎉

Once you've added the code, the SDK will automatically start tracking:

- ✅ Every click on your website
- ✅ Form submissions
- ✅ Page views
- ✅ How far users scroll (25%, 50%, 75%, 100%)
- ✅ Which links they click
- ✅ File downloads
- ✅ Input field changes

**No additional setup needed!** The SDK works automatically in the background.

All events are stored in the PostgreSQL database.

---

## How to Verify It's Working

### Option 1: Check Your Browser Console

1. Open your website in a browser
2. Press `F12` (or right-click → "Inspect")
3. Click the **"Console"** tab
4. Look for a message that says: `[Agent] Initialized successfully`

✅ If you see this message, you're all set!

### Option 2: Check Backend Logs

Watch the backend terminal for incoming events:
```
2024-01-01T12:00:00.000Z POST /track
[API] Saved 1 event(s) for site my-website
```

### Option 3: Query the Database

```bash
# Get recent events
curl http://localhost:3000/events?siteId=my-website&limit=10

# Get event count
curl http://localhost:3000/stats?siteId=my-website
```

---

## Common Platforms

### WordPress

1. Go to **Appearance** → **Theme Editor**
2. Select **footer.php** (or use a plugin like "Insert Headers and Footers")
3. Paste the code before `</body>`
4. Click **Update File**

### Shopify

1. Go to **Online Store** → **Themes**
2. Click **Actions** → **Edit code**
3. Open **theme.liquid**
4. Paste the code before `</body>`
5. Click **Save**

### Wix

1. Go to **Settings** → **Custom Code**
2. Click **+ Add Custom Code**
3. Paste the code
4. Set it to load on **All pages**
5. Place code in **Body - end**
6. Click **Apply**

### Squarespace

1. Go to **Settings** → **Advanced** → **Code Injection**
2. Paste the code in the **Footer** section
3. Click **Save**

### Webflow

1. Go to **Project Settings** → **Custom Code**
2. Paste the code in the **Footer Code** section
3. Click **Save Changes**
4. Publish your site

### Custom Website

If you built your website yourself or hired a developer:

1. Open your website's HTML files
2. Find the `</body>` tag (usually near the bottom)
3. Paste the code right before it
4. Save and upload the files to your server

---

## Need Help?

### Still Not Working?

**Check these common issues:**

1. ✅ Did you replace **all** the placeholder text with your actual credentials?
2. ✅ Did you paste the code on **every page** you want to track?
3. ✅ Is your **Backend URL** correct and accessible?
4. ✅ Are you using the correct **Write Key** and **Site ID**?

### Get Support

- 📧 Email: support@yourcompany.com
- 💬 Chat: Available in your dashboard
- 📚 Documentation: [Full README](./README.md)

---

## Advanced Options (Optional)

### Enable Debug Mode

Want to see what's happening behind the scenes? Add `debug: true`:

```html
<script>
  Agent.init({
    writeKey: 'my-production-key',
    siteId: 'my-online-store',
    endpoint: 'https://analytics.mycompany.com',
    debug: true  // 👈 Add this line
  });
</script>
```

Then open your browser console (press `F12`) to see detailed tracking information.

> **Important:** Remove `debug: true` before going live to keep your site fast!

### Track Custom Events

Want to track specific actions? Add this code where you need it:

```html
<button onclick="Agent.track('button_clicked', { button_name: 'Sign Up' })">
  Sign Up
</button>
```

This will track when someone clicks the "Sign Up" button.

### Identify Users

When someone logs in, you can identify them:

```javascript
Agent.identify('user-123', {
  email: 'customer@example.com',
  name: 'Jane Doe'
});
```

---

## Privacy & Compliance

### What Data is Collected?

The SDK automatically collects:
- ✅ Which pages users visit
- ✅ Which buttons and links they click
- ✅ How they navigate your site
- ✅ Device and browser information

### What Data is NOT Collected?

- ❌ Passwords
- ❌ Credit card numbers
- ❌ Form field values (unless you specifically configure it)
- ❌ Personal information (unless you use `identify()`)

### GDPR & Cookie Compliance

If you need to comply with GDPR or cookie laws, only initialize the SDK **after** users accept cookies:

```html
<script src="https://cdn.example.com/agentic-tagging/dist/agent.js"></script>
<script>
  // Wait for user consent
  function startTracking() {
    Agent.init({
      writeKey: 'my-production-key',
      siteId: 'my-online-store',
      endpoint: 'https://analytics.mycompany.com'
    });
  }
  
  // Call startTracking() only after user accepts cookies
  // (This depends on your cookie consent tool)
</script>
```

---

## Frequently Asked Questions

### Will this slow down my website?

No! The SDK is very lightweight (less than 50KB) and loads asynchronously, so it won't affect your page load speed.

### Do I need to add code to every page?

If your website has a shared header or footer file (most do), you only need to add the code once to that file. It will then appear on all pages automatically.

### Can I track multiple websites?

Yes! Just use a different `siteId` for each website. You can use the same `writeKey` for all your sites.

### What if I update my website?

The tracking code will continue to work automatically. You don't need to update anything unless your credentials change.

### Can I remove it later?

Yes! Simply delete the code from your website and tracking will stop immediately.

### Does it work on mobile devices?

Yes! The SDK works on all devices: desktop, tablet, and mobile.

### Do I need to install anything?

No! Everything works through the code snippet you paste. No plugins, extensions, or installations required.

---

## Next Steps

✅ **Step 1:** Add the code to your website  
✅ **Step 2:** Verify it's working (check console or dashboard)  
✅ **Step 3:** Start analyzing your data!

For more advanced features and technical details, see the [Full Documentation](./README.md).

---

**Questions?** Contact your Agentic Tagging administrator or support team.

