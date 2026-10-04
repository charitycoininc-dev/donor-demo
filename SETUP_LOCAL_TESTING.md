# Simple Local Testing Setup

## The Problem
Vercel dev tries to serve the frontend AND API, which causes conflicts.

## Simple Solution: Two Terminal Setup

**Terminal 1 - Frontend (keep this running):**
```bash
npm run dev
```
This runs on `http://localhost:3000` - your normal dev server

**Terminal 2 - API Only:**
Stop the current `vercel dev` (Ctrl+C), then run:
```bash
vercel dev --listen 3001
```

## Then Update Vite Proxy

The vite.config.js already has a proxy set up, but you need to:
1. Make sure it points to the correct port (3001 or 3002)
2. Restart your `npm run dev` server after making changes

## Alternative: Test API Directly

You can test the API endpoint directly without the frontend:

```bash
curl -X POST http://localhost:3001/api/issue-charity-coins \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","coinsToSend":100,"userWalletAddress":null}'
```

## Recommended: Just Use Regular Dev Server

For now, just use your regular `npm run dev` on port 3000. The Solana transfers will work when you deploy to Vercel. The graceful error handling I added will prevent crashes during local testing.

