# Fix Donation Confirmation Permissions Error

If you're seeing **"Missing or insufficient permissions"** when trying to confirm donations, it means your user account doesn't have the `admin` role set in Firestore.

## Quick Fix: Set Admin Role via Firebase Console

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `charity-coin-83bc8` (or your project name)
3. **Navigate to Firestore Database**:
   - Click "Firestore Database" in the left sidebar
   - Click on the "Data" tab
4. **Find your user document**:
   - Look for the `users` collection
   - Find the document with your user ID (the UID from your Firebase Auth account)
   - If the document doesn't exist, create it
5. **Add or update the `role` field**:
   - Click on the user document
   - Click "Add field" or edit the existing `role` field
   - Field name: `role`
   - Field type: `string`
   - Field value: `admin`
   - Click "Update" or "Save"
6. **Refresh your browser** and try confirming donations again

## Alternative: Use the Script (Requires Browser Login)

1. **Sign in to your app** in the browser (localhost:3000)
2. **Open a new terminal** and run:
   ```bash
   node scripts/set-admin-role.js
   ```
3. The script will detect your logged-in session and set the admin role

## Verify Admin Role is Set

After setting the role, you can verify it's working:

1. **Check in Firebase Console** that `users/{yourUserId}` has `role: "admin"`
2. **Check in browser console** - log `user.role` - it should show `"admin"`
3. **Try confirming a donation** - the permission error should be gone

## Why This Happens

Firestore security rules require:
- User must be authenticated ✅
- User document must exist in `/users/{userId}` ✅
- User document must have `role: "admin"` ❌ (This is what's missing)

The `isAdmin()` function in `firestore.rules` checks all three conditions.
