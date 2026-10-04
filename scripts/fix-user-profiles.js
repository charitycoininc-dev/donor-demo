// Usage: 
//   node scripts/fix-user-profiles.js                    # Fix all users
//   node scripts/fix-user-profiles.js <userId>           # Fix specific user
// 
// This script updates user documents in Firestore to ensure all profile fields are present.
// It adds missing profile fields with empty string defaults.
//
// REQUIRES: Firebase Admin SDK credentials
//   Option 1: Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key file
//   Option 2: Use gcloud CLI: gcloud auth application-default login
//
// ALTERNATIVE: If you're logged in as admin, use scripts/fix-user-profiles-client.js instead

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// Note: applicationDefault() will only fail when actually used, not during initialization
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

// Define all expected profile fields with their default values
const PROFILE_FIELDS = {
  // Personal information
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  // Address information
  street1: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  // Wallet information
  solanaWallet: '',
  // System fields (only add if completely missing)
  charityCoins: 0,
  totalDonated: 0,
  membershipTier: 'Bronze',
  joinDate: '',
  coinNumbers: [],
  wonCoins: [],
  achievements: [],
  privacyConsent: true,
  consentDate: '',
  transactions: [],
};

async function fixUserProfile(userId, userData) {
  const missingFields = {};

  // Check which profile fields are missing
  for (const [key, defaultValue] of Object.entries(PROFILE_FIELDS)) {
    if (!(key in userData)) {
      missingFields[key] = defaultValue;
    }
  }

  if (Object.keys(missingFields).length === 0) {
    return { updated: false, missingFields: [] };
  }

  // Update the document with missing fields
  const userRef = db.collection('users').doc(userId);
  await userRef.update(missingFields);

  return { 
    updated: true, 
    missingFields: Object.keys(missingFields),
    addedFields: missingFields
  };
}

async function fixAllUsers() {
  console.log('🔍 Scanning all users for missing profile fields...\n');
  
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  
  if (snapshot.empty) {
    console.log('❌ No users found in the database.');
    return;
  }

  console.log(`📊 Found ${snapshot.size} user(s) to check.\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  const results = [];

  for (const docSnap of snapshot.docs) {
    const userId = docSnap.id;
    const userData = docSnap.data();
    
    console.log(`\n👤 Checking user: ${userId}`);
    console.log(`   Email: ${userData.email || 'N/A'}`);
    
    const result = await fixUserProfile(userId, userData);
    
    if (result.updated) {
      updatedCount++;
      console.log(`   ✅ Updated with ${result.missingFields.length} missing field(s):`);
      result.missingFields.forEach(field => {
        console.log(`      - ${field}: ${JSON.stringify(result.addedFields[field])}`);
      });
      results.push({ userId, email: userData.email || 'N/A', missingFields: result.missingFields });
    } else {
      skippedCount++;
      console.log(`   ✓ All profile fields present`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total users checked: ${snapshot.size}`);
  console.log(`   Users updated: ${updatedCount}`);
  console.log(`   Users already complete: ${skippedCount}`);
  
  if (updatedCount > 0) {
    console.log('\n✅ Successfully fixed user profiles!');
    console.log('\n📋 Updated users:');
    results.forEach(({ userId, email, missingFields }) => {
      console.log(`   - ${userId} (${email}): Added ${missingFields.length} field(s)`);
    });
  } else {
    console.log('\n✅ All user profiles are complete!');
  }
}

async function fixSpecificUser(userId) {
  console.log(`🔍 Checking user: ${userId}\n`);
  
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  
  if (!userSnap.exists) {
    console.log(`❌ User ${userId} not found in the database.`);
    process.exit(1);
  }

  const userData = userSnap.data();
  console.log(`📄 Current user data:`);
  console.log(`   Email: ${userData.email || 'N/A'}`);
  console.log(`   Existing fields: ${Object.keys(userData).join(', ')}\n`);

  const result = await fixUserProfile(userId, userData);
  
  if (result.updated) {
    console.log(`✅ Successfully updated user profile!`);
    console.log(`\n📋 Added ${result.missingFields.length} missing field(s):`);
    result.missingFields.forEach(field => {
      console.log(`   - ${field}: ${JSON.stringify(result.addedFields[field])}`);
    });
    
    // Show updated document
    const updatedSnap = await userRef.get();
    const updatedData = updatedSnap.data();
    console.log(`\n📄 Updated user document now has ${Object.keys(updatedData).length} field(s).`);
  } else {
    console.log(`✅ User profile is already complete - no missing fields!`);
  }
}

// Main execution
async function main() {
  try {
    const userId = process.argv[2];
    
    if (userId) {
      await fixSpecificUser(userId);
    } else {
      await fixAllUsers();
    }
    
    console.log('\n✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing user profiles:', error.message);
    
    // Check if it's a credential error
    if (error.message.includes('credential') || error.message.includes('authentication') || error.code === 'ENOENT') {
      console.error('\n📋 Firebase Admin SDK credentials not found!');
      console.error('\n   Setup Options:');
      console.error('   1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.error('      Windows: set GOOGLE_APPLICATION_CREDENTIALS=C:\\path\\to\\service-account-key.json');
      console.error('      Mac/Linux: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"');
      console.error('\n   2. Use gcloud CLI (if installed)');
      console.error('      gcloud auth application-default login');
      console.error('\n   3. Use the client SDK version instead (easier if you\'re logged in)');
      console.error('      npm run fix:profile:client ' + (process.argv[2] || ''));
    }
    
    process.exit(1);
  }
}

main();

