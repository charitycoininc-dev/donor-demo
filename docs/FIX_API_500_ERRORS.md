# Fix: API 500 Errors in Donation Processing

## The Problem

You're getting 500 errors from:
- `/api/issue-charity-coins`
- `/api/update-raffle-state`
- `/api/update-raffle-entries`

## Root Cause

These are **Vercel serverless functions** that need the Vercel dev server to run. If you're only running `npm run dev`, the API endpoints won't work.

## Solution: Start Vercel Dev Server

### Step 1: Install Vercel CLI (if not installed)

```powershell
npm install -g vercel
```

### Step 2: Start Vercel Dev Server

**In a NEW terminal window:**

```powershell
cd C:\Users\myrew\charity-coin-2
vercel dev --listen 3001
```

This will:
- Start API server on port 3001
- Handle all `/api/*` routes
- Your Vite proxy will forward requests to it

### Step 3: Keep Both Running

**Terminal 1 (Frontend):**
```powershell
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 (API):**
```powershell
vercel dev --listen 3001
# Runs on http://localhost:3001 (for API only)
```

### Step 4: Test

1. Go to `http://localhost:3000/admin/data`
2. Approve a donation
3. API calls should work now!

---

## Alternative: Make APIs Work Without Vercel Dev

If you don't want to run Vercel dev, we can add error handling to gracefully skip API calls in local development. The donation processing will still work in Firestore, just without Solana token transfers until deployed.

---

## Quick Check

**Is Vercel dev running?**
```powershell
netstat -ano | findstr :3001
```

If you see port 3001 in use, Vercel dev is running. If not, start it!

---

## First Time Setup

If this is your first time running `vercel dev`:

1. Run: `vercel dev --listen 3001`
2. It will ask you to link your project
3. Follow the prompts
4. It will start serving your API endpoints

---

Try starting Vercel dev and let me know if the errors persist!

