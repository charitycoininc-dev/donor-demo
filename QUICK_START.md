# Quick Start - Testing Solana Transfers Locally

## Important: Use the Right URL

**DO NOT access `localhost:3001` directly in your browser!**

Vercel dev on port 3001 is **only for API routes**. The frontend should be accessed via your regular dev server.

## Setup Steps

1. **Start your regular dev server** (if not already running):
   ```bash
   npm run dev
   ```
   ✅ This runs on `http://localhost:3000` - **USE THIS URL**

2. **Start Vercel dev for API** (in background or separate terminal):
   ```bash
   vercel dev --listen 3001
   ```
   ✅ This runs on `http://localhost:3001` - **Don't access this directly!**

## How to Test

1. Open your browser to: **`http://localhost:3000`** (NOT 3001!)
2. Go to Admin → Data Management
3. Approve a donation
4. The API call will automatically be proxied from port 3000 to 3001

## How It Works

- Your frontend on `localhost:3000` makes API calls to `/api/issue-charity-coins`
- Vite's proxy (configured in vite.config.js) forwards these to `localhost:3001`
- Vercel dev on port 3001 handles only the API routes, not the frontend

## If You See Errors

If you see 500 errors when accessing `localhost:3001` directly - that's normal! Don't access that URL. Use `localhost:3000` for the frontend.

