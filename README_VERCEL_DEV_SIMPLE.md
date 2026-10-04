# Testing Solana Transfers Locally - Simple Setup

## Quick Start (Easiest Method)

**Just use Vercel Dev - it serves both frontend and API!**

```bash
vercel dev
```

This will:
- Serve your frontend (Vite app)
- Handle all `/api/*` routes (serverless functions)
- Automatically pick an available port (usually 3000, 3001, or 3002)

Then just go to the URL it shows (e.g., `http://localhost:3002`) and test!

## Alternative: Two Servers

If you prefer to keep your regular `npm run dev` running:

**Terminal 1:**
```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2:**
```bash
vercel dev --listen 3001
# Runs on http://localhost:3001 for API routes
```

Then update `vite.config.js` proxy target to match the port Vercel dev uses.

## Ignore These Warnings

The Vue/dependency warnings about files in `docs/franks_guide/` can be ignored - they're just documentation files and won't affect functionality.

