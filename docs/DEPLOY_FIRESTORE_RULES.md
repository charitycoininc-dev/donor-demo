# Deploy Firestore Security Rules

## Quick Deploy

Deploy the updated security rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

## What Changed

The latest update adds admin delete permissions for:
- User transactions subcollection (`users/{userId}/transactions`)
- User coin numbers subcollection (`users/{userId}/coinNumbers`)

This allows the "Delete All Donations & Reset Raffle" function to work properly.

## Requirements

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Logged in to Firebase: `firebase login`
3. Project initialized: `firebase init firestore` (if not already done)

## Deployment Steps

1. **Make sure you're in the project root directory**
   ```bash
   cd charity-coin-2
   ```

2. **Deploy the rules**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Verify deployment**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Navigate to **Firestore Database** → **Rules**
   - Verify the rules match `firestore.rules`

## Alternative: Manual Deployment via Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

## Testing

After deployment, the "Delete All Donations & Reset Raffle" button should work without permission errors.

## Rollback

If you need to rollback, use:
```bash
git checkout HEAD~1 firestore.rules
firebase deploy --only firestore:rules
```
