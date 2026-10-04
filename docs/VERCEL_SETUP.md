# Vercel Deployment Setup Guide

This guide explains how to configure environment variables in Vercel for the Charity Coin application.

## Required Environment Variables

### Firebase Configuration

The application requires Firebase environment variables to be set in Vercel. Without these, authentication and database functionality will not work.

**Required Variables (all must start with `VITE_`):**

1. `VITE_FIREBASE_API_KEY`
2. `VITE_FIREBASE_AUTH_DOMAIN`
3. `VITE_FIREBASE_PROJECT_ID`
4. `VITE_FIREBASE_STORAGE_BUCKET`
5. `VITE_FIREBASE_MESSAGING_SENDER_ID`
6. `VITE_FIREBASE_APP_ID`
7. `VITE_FIREBASE_MEASUREMENT_ID` (optional, for analytics)

### Resend Email API

For contact form email notifications:

- `RESEND_API_KEY` - Your Resend.com API key (does NOT need VITE_ prefix since it's server-side only)

## How to Set Environment Variables in Vercel

1. **Go to your Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Select your project

2. **Access Settings**
   - Click on the "Settings" tab
   - Click on "Environment Variables" in the sidebar

3. **Add Variables**
   - Click "Add New"
   - Enter the variable name (e.g., `VITE_FIREBASE_API_KEY`)
   - Enter the variable value
   - Select which environments to apply to:
     - **Production** - For your live site
     - **Preview** - For pull request previews
     - **Development** - For local development (optional)
   - Click "Save"

4. **Repeat for All Variables**
   - Add each required Firebase variable
   - Add the `RESEND_API_KEY` variable

5. **Redeploy**
   - After adding environment variables, you may need to trigger a new deployment
   - Go to the "Deployments" tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"

## Getting Firebase Configuration Values

1. **Open Firebase Console**
   - Go to https://console.firebase.google.com/
   - Select your project

2. **Access Project Settings**
   - Click the gear icon next to "Project Overview"
   - Select "Project settings"

3. **Get Web App Config**
   - Scroll down to the "Your apps" section
   - If you don't have a web app, click "Add app" and select the web icon (</>)
   - Copy the configuration values from the Firebase config object

4. **Map to Environment Variables**
   ```javascript
   // Firebase config object:
   {
     apiKey: "AIza...",                    // → VITE_FIREBASE_API_KEY
     authDomain: "project.firebaseapp.com", // → VITE_FIREBASE_AUTH_DOMAIN
     projectId: "your-project-id",          // → VITE_FIREBASE_PROJECT_ID
     storageBucket: "project.appspot.com",  // → VITE_FIREBASE_STORAGE_BUCKET
     messagingSenderId: "123456789",        // → VITE_FIREBASE_MESSAGING_SENDER_ID
     appId: "1:123456789:web:abcdef",       // → VITE_FIREBASE_APP_ID
     measurementId: "G-XXXXXXXXXX"          // → VITE_FIREBASE_MEASUREMENT_ID
   }
   ```

## Troubleshooting

### Sign-in Not Working

If sign-in is not working on Vercel, check:

1. **Environment Variables**
   - Verify all `VITE_FIREBASE_*` variables are set in Vercel
   - Check that they're applied to the correct environment (Production/Preview)
   - Make sure there are no extra spaces or quotes in the values

2. **Browser Console**
   - Open the browser developer console (F12)
   - Look for Firebase initialization errors
   - Check for messages starting with "🔍 Debug: Environment Variables Check"
   - Look for errors about missing environment variables

3. **Redeploy After Changes**
   - Environment variables only take effect on new deployments
   - After adding/updating variables, trigger a new deployment

4. **Verify Firebase Project**
   - Ensure Firebase Authentication is enabled in Firebase Console
   - Go to Authentication > Sign-in method
   - Make sure Email/Password is enabled

### Common Error Messages

- **"Firebase is not available. Please check your configuration."**
  - Solution: Add all required `VITE_FIREBASE_*` environment variables in Vercel

- **"Invalid Firebase configuration. Please check your environment variables."**
  - Solution: Verify all Firebase config values are correct and properly set

- **"Missing required environment variables"**
  - Solution: Check which variables are missing and add them in Vercel

## Testing Locally

To test with the same configuration locally:

1. Create a `.env.local` file in the project root
2. Add all environment variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   # ... etc
   ```
3. Restart your development server

**Note:** Never commit `.env.local` to git - it's already in `.gitignore`

