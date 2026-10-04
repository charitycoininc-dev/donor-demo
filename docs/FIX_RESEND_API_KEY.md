# Fix RESEND_API_KEY Error

## Problem
Getting error: "RESEND_API_KEY is not set in environment variables"

## Solution

### Option 1: Restart Vercel Dev Server (Most Common Fix)

The `.env.local` file exists with the correct API key, but Vercel dev server needs to be restarted to load it:

1. **Stop the Vercel dev server** (if running):
   - Press `Ctrl+C` in the terminal where `vercel dev` is running

2. **Restart Vercel dev server**:
   ```bash
   vercel dev
   ```

3. **Test again** - Try submitting a donation

### Option 2: Pull Environment Variables from Vercel

If restarting doesn't work, pull all environment variables from Vercel:

```bash
vercel env pull .env.local
```

This will overwrite your `.env.local` file with all environment variables from Vercel (including RESEND_API_KEY).

### Option 3: Verify .env.local File

Make sure `.env.local` exists in the project root and contains:

```
RESEND_API_KEY=re_xxxxxxxx
```

Check the file:
```bash
# Windows PowerShell
Get-Content .env.local

# Or on Mac/Linux
cat .env.local
```

### Option 4: Check Vercel Environment Variables

Verify the key is set in Vercel:

```bash
vercel env ls
```

You should see `RESEND_API_KEY` listed with "Development, Preview, Production" environments.

## Important Notes

- **Vercel dev server must be running** for API routes to work
- **Environment variables are loaded when the server starts** - restart required after changes
- **`.env.local` is in `.gitignore`** - it won't be committed to git
- **For production**, the environment variable is already set in Vercel dashboard

## Testing

After restarting `vercel dev`, test by:
1. Submitting a donation → Should send initial confirmation email
2. Approving a donation → Should send approval confirmation email

If errors persist, check the Vercel dev server console for detailed error messages.

