// Usage: 
//   node scripts/fix-user-profiles-client.js                    # Fix all users
//   node scripts/fix-user-profiles-client.js <userId>           # Fix specific user
// 
// This script uses the Firebase client SDK and requires admin credentials.
// Set environment variables: ADMIN_EMAIL and ADMIN_PASSWORD
// Or pass them as arguments: node scripts/fix-user-profiles-client.js <userId> <email> <password>

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.VITE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.VITE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.VITE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || process.env.VITE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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

async function checkAdminAccess() {
  // Get credentials from environment variables or command line arguments
  const email = process.env.ADMIN_EMAIL || process.argv[3];
  const password = process.env.ADMIN_PASSWORD || process.argv[4];
  
  if (!email || !password) {
    console.error('❌ Admin credentials required!');
    console.log('\n📋 Usage options:');
    console.log('   Option 1: Set environment variables');
    console.log('     set ADMIN_EMAIL=your@email.com');
    console.log('     set ADMIN_PASSWORD=yourpassword');
    console.log('     npm run fix:profile:client <userId>');
    console.log('\n   Option 2: Pass credentials as arguments');
    console.log('     npm run fix:profile:client <userId> <email> <password>');
    console.log('\n   Option 3: Use Admin SDK version (requires Firebase Admin setup)');
    console.log('     npm run fix:profile <userId>');
    process.exit(1);
  }

  try {
    console.log(`🔐 Signing in as ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if user has admin role
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('❌ User document does not exist in Firestore.');
      process.exit(1);
    }

    const userData = userSnap.data();
    if (userData.role !== 'admin') {
      console.error('❌ User does not have admin role.');
      console.log(`   Current role: ${userData.role || 'none'}`);
      console.log('\n📋 To fix this:');
      console.log('   1. Set your user role to "admin" in Firestore');
      console.log('   2. Or use the Admin SDK version: scripts/fix-user-profiles.js');
      process.exit(1);
    }

    console.log(`✅ Authenticated as admin: ${user.email}`);
    return user;
  } catch (error) {
    console.error('❌ Failed to sign in:', error.message);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      console.error('   Check your email and password.');
    }
    process.exit(1);
  }
}

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
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, missingFields);

  return { 
    updated: true, 
    missingFields: Object.keys(missingFields),
    addedFields: missingFields
  };
}

async function fixAllUsers() {
  console.log('🔍 Scanning all users for missing profile fields...\n');
  
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);
  
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
  
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
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
    const updatedSnap = await getDoc(userRef);
    const updatedData = updatedSnap.data();
    console.log(`\n📄 Updated user document now has ${Object.keys(updatedData).length} field(s).`);
  } else {
    console.log(`✅ User profile is already complete - no missing fields!`);
  }
}

// Main execution
async function main() {
  try {
    // Get userId (first argument, skip email/password if provided)
    const userId = process.argv[2];
    
    // Check admin access first
    await checkAdminAccess();
    
    if (userId) {
      await fixSpecificUser(userId);
    } else {
      await fixAllUsers();
    }
    
    console.log('\n✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing user profiles:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

main();

