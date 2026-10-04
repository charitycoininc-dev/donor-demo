# Set Admin Role - Quick Fix

## The Problem

You're seeing permission errors because your user account doesn't have the `admin` role set in Firestore.

## Quick Solution: Use Firebase Console

**Easiest method:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **charity-coin-83bc8**
3. Go to **Firestore Database** → **Data** tab
4. Find the `users` collection
5. Find your user document (by your user ID - check browser console or your email)
6. If it doesn't exist, create it:
   - Click "Add document"
   - Document ID: Your Firebase Auth user ID (check browser console)
   - Add fields:
     - `role` (string) = `admin`
     - `email` (string) = Your email
7. If it exists, click "Edit" and add/update:
   - `role` (string) = `admin`
8. Save

## Alternative: Check Your User ID

1. Open your browser console (F12)
2. Go to the app and make sure you're logged in
3. Run this in the console:
   ```javascript
   import { getAuth } from 'firebase/auth';
   const auth = getAuth();
   console.log('User ID:', auth.currentUser?.uid);
   console.log('Email:', auth.currentUser?.email);
   ```
4. Use that User ID in Firebase Console

## Verify It Works

1. Refresh your browser page
2. Go to Admin → Data Management
3. The permission errors should be gone
4. You should be able to process donations

## If Still Not Working

1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check browser console** for your user ID
3. **Verify in Firebase Console** that the document exists and has `role: "admin"`
4. **Clear browser cache** if needed

The admin role is required by the Firestore security rules to access donations and settings.

