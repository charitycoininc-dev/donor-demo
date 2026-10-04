# Start Vercel Dev Server - Quick Fix

## The Problem

Your API endpoints are returning 500 errors because **Vercel dev server is not running**.

## Quick Fix

### Step 1: Open a NEW Terminal Window

Keep your current `npm run dev` running, and open a **second terminal**.

### Step 2: Start Vercel Dev

In the new terminal, run:

```powershell
cd C:\Users\myrew\charity-coin-2
vercel dev --listen 3001
```

**First time?** It will ask you to link your project - just follow the prompts.

### Step 3: Verify It's Running

You should see:
```
Vercel CLI
Ready! Available at http://localhost:3001
```

### Step 4: Test Again

Go back to your browser (`localhost:3000`) and try approving a donation. The API calls should work now!

---

## If Vercel CLI Not Installed

Install it first:

```powershell
npm install -g vercel
```

Then run `vercel dev --listen 3001`

---

## Both Servers Running

**Terminal 1:** `npm run dev` (frontend on port 3000)  
**Terminal 2:** `vercel dev --listen 3001` (API on port 3001)

Vite automatically proxies `/api/*` requests to port 3001.

---

## Troubleshooting

**"Port 3001 already in use":**
- Use a different port: `vercel dev --listen 3002`
- Update `vite.config.js` proxy target to `3002`

**"Project not linked":**
- Run: `vercel link`
- Follow prompts to link your project

---

**Start Vercel dev and the errors should be fixed!** 🚀

