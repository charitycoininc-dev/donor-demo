# Firestore Security Rules

This document describes the Firestore security rules implemented for the Charity Coin application.

## Overview

The security rules are defined in `firestore.rules` and protect sensitive data, especially custodial wallet private keys.

## Key Security Features

### 1. Private Key Protection

The `solanaWalletPrivateKey` field is heavily restricted:
- Users **cannot** read their own private keys (for security)
- Users **cannot** update their own private keys
- Only the system (during custodial wallet creation) can write private keys
- Admins have read access for recovery scenarios

### 2. User Data Access

- Users can read their own profile data
- Users can update their profile (except sensitive fields like role and private keys)
- Admins can read all user data
- Admins can update user data (except private keys)

### 3. Transaction Access

- Users can read their own transactions
- Admins can read all transactions
- Only the system can create transactions (users cannot create their own)

### 4. Donation Management

- Users can create donations
- Users can read their own donations
- Only admins can approve/update/delete donations

## Deploying Rules

### Using Firebase CLI

1. Install Firebase CLI:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase (if not already done):
```bash
firebase init firestore
```

4. Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy the contents of `firestore.rules`
5. Paste into the rules editor
6. Click **Publish**

## Testing Rules

You can test the rules using the Firebase Console Rules Playground:

1. Go to Firestore → Rules → Rules Playground
2. Select a user and scenario
3. Test read/write operations
4. Verify the expected behavior

## Important Notes

1. **Private Keys**: The rules prevent users from reading their own private keys for security. If wallet recovery is needed, admins can access the keys through the admin interface.

2. **Production**: For production, consider using Firebase App Check or Cloud Functions with Admin SDK for additional security when handling private keys.

3. **Rule Updates**: Always test rules in a staging environment before deploying to production.

4. **Monitoring**: Monitor Firestore security rule violations in Firebase Console → Firestore → Usage tab.
