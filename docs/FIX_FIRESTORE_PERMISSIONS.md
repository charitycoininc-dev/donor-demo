# Fix: Firestore Permission Errors

## The Problem

You're seeing `FirebaseError: Missing or insufficient permissions` errors for:
- `settings/nonprofitWallet`
- `donations` collection queries
- Wallet balance fetches

## Solution: Deploy Firestore Rules

The rules are correct, but they need to be deployed to Firebase.

### Option 1: Deploy via Firebase CLI (Recommended)

1. **Make sure you're logged in:**
   ```powershell
   firebase login
   ```

2. **Deploy the rules:**
   ```powershell
   firebase deploy --only firestore:rules
   ```

### Option 2: Deploy via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

## Verify Your User Has Admin Role

The rules require your user document to have `role: 'admin'`. Check:

1. Go to Firebase Console → Firestore Database
2. Open `users` collection
3. Find your user document (by your user ID)
4. Verify it has `role: "admin"`

If it doesn't exist or doesn't have the role, you need to add it:

```javascript
// Run this in Firebase Console or a script
await firestore.collection('users').doc('YOUR_USER_ID').set({
  role: 'admin',
  // ... other user fields
}, { merge: true });
```

## Check Authentication

Make sure you're logged in:
- The app should show your email in the top right
- Check browser console for auth state

## After Deploying Rules

1. **Refresh the page** - Rules are cached
2. **Check console** - Errors should disappear
3. **Try again** - Access should work now

## If Still Having Issues

The rules I updated allow:
- ✅ Any authenticated user can read `settings` (for wallet balance)
- ✅ Admins can list/query all `donations`
- ✅ Admins can read/write `settings`

If errors persist after deploying, check:
1. User is authenticated (check `auth.currentUser`)
2. User document exists with `role: 'admin'`
3. Rules were deployed successfully (check Firebase Console)

