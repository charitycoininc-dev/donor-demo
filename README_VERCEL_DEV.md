# Testing Solana Transfers Locally

## Quick Start

To test Solana token transfers locally, you need to run Vercel's development server:

### Option 1: Run Both Servers (Recommended)

**Terminal 1 - Vite Dev Server (Frontend):**
```bash
npm run dev
```
This runs on `http://localhost:3000`

**Terminal 2 - Vercel Dev Server (API):**
```bash
vercel dev --listen 3001
```
This runs on `http://localhost:3001` and handles `/api/*` routes

The Vite dev server is configured to proxy `/api/*` requests to the Vercel dev server automatically.

### Option 2: Use Vercel Dev Only

```bash
vercel dev
```

This serves both your frontend and API endpoints. Vercel will build and serve your Vite app.

## First Time Setup

1. **Link to Vercel** (first time only):
   ```bash
   vercel link
   ```
   Follow the prompts to link your project.

2. **Run Vercel Dev:**
   ```bash
   vercel dev --listen 3001
   ```

## Testing

Once both servers are running:
1. Go to `http://localhost:3000/admin/data`
2. Approve a donation
3. The Solana token transfer will execute and you'll see the transaction signature in the console

## Troubleshooting

- **Port already in use**: Change the port with `--listen 3002` (and update vite.config.js proxy target)
- **404 errors**: Make sure Vercel dev server is running
- **Connection refused**: Check that Vercel dev is running on the correct port

