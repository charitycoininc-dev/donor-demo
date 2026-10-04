# Local Testing Guide

## Testing Solana Token Transfers Locally

To test the Solana token issuance API endpoint locally, you need to run Vercel's development server alongside your Vite dev server.

### Setup Steps

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Run Vercel Dev Server** (in a separate terminal):
   ```bash
   vercel dev
   ```
   
   This will:
   - Link your project to Vercel (first time only)
   - Start a local server that handles `/api/*` routes
   - Default to port 3000 (same as Vite)
   
3. **Configure Ports** (if port conflict):
   - Vite dev server: `npm run dev` (default port 3000)
   - Vercel dev server: `vercel dev --listen 3001` (use different port)
   - Update your frontend to call `http://localhost:3001/api/issue-charity-coins` OR
   - Update Vite config to proxy API requests to Vercel dev server

### Recommended Setup (Two Terminal Windows)

**Terminal 1 - Vite Dev Server:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Vercel Dev Server:**
```bash
vercel dev --listen 3001
# Runs on http://localhost:3001 and handles /api/* routes
```

Then update `src/pages/Admin/DataManagement.jsx` to use:
```javascript
const API_BASE = import.meta.env.DEV && window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : '';

const solanaResponse = await fetch(`${API_BASE}/api/issue-charity-coins`, {
  // ...
});
```

### Alternative: Use Vercel Dev Only

If you prefer to use only Vercel dev (which can serve both the frontend and API):

```bash
vercel dev
```

This will serve both your Vite-built frontend and your serverless functions.

### Environment Variables

Make sure your `.env.local` file has any required environment variables for the API functions.

### Testing

Once `vercel dev` is running, the `/api/issue-charity-coins` endpoint will be available and you can test the Solana token transfers when approving donations in the admin panel.

