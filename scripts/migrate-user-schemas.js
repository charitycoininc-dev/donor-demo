// Usage: node scripts/migrate-user-schemas.js
// This script updates all user documents in Firestore to ensure all profile fields are present.

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

const DEFAULT_PROFILE = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street1: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  solanaWallet: '',
  charityCoins: 0,
  totalDonated: 0,
  membershipTier: 'Bronze',
  joinDate: '',
  coinNumbers: [],
  wonCoins: [],
  achievements: [],
  privacyConsent: true,
  consentDate: '',
  transactions: []
};

async function updateAllUserProfiles() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  let updatedCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    let needsUpdate = false;
    const updateData = {};
    for (const key of Object.keys(DEFAULT_PROFILE)) {
      if (!(key in data)) {
        updateData[key] = DEFAULT_PROFILE[key];
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      await docSnap.ref.update(updateData);
      updatedCount++;
      console.log(`Updated user ${docSnap.id} with missing fields:`, Object.keys(updateData));
    }
  }
  console.log(`\nDone. Updated ${updatedCount} user profiles.`);
}

updateAllUserProfiles().catch(err => {
  console.error('Error updating user profiles:', err);
  process.exit(1);
}); 