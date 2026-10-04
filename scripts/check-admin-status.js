import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
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

async function checkAdminStatus() {
  try {
    console.log('🔍 Checking admin status...\n');
    
    // Wait for auth state
    const user = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });

    if (!user) {
      console.error('❌ No user is currently signed in.');
      console.log('\nPlease sign in to the app in your browser first, then run this script.');
      console.log('Or use Firebase Console to check the user document directly.');
      process.exit(1);
    }

    console.log(`✅ Found authenticated user:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User ID (UID): ${user.uid}\n`);

    // Check user document
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ User document does NOT exist in Firestore!');
      console.log(`\n📋 To fix this:`);
      console.log(`   1. Go to Firebase Console: https://console.firebase.google.com/`);
      console.log(`   2. Go to Firestore Database → Data`);
      console.log(`   3. Find the "users" collection`);
      console.log(`   4. Create a document with ID: ${user.uid}`);
      console.log(`   5. Add field: role (string) = admin`);
      console.log(`   6. Add field: email (string) = ${user.email}`);
      process.exit(1);
    }

    const userData = userSnap.data();
    console.log(`✅ User document exists in Firestore`);
    console.log(`\n📄 User document data:`);
    console.log(`   Role: ${userData.role || 'NOT SET'}`);
    console.log(`   Email: ${userData.email || 'N/A'}`);
    console.log(`   All fields:`, Object.keys(userData).join(', '));

    // Check role specifically
    if (!userData.role) {
      console.error(`\n❌ Role field is missing!`);
      console.log(`   Add role field with value "admin"`);
    } else if (userData.role !== 'admin') {
      console.error(`\n❌ Role is set to "${userData.role}" but should be "admin"`);
      console.log(`   Current role: "${userData.role}"`);
      console.log(`   Expected: "admin"`);
      console.log(`   (Note: Role check is case-sensitive and exact match)`);
    } else {
      console.log(`\n✅ Role is correctly set to "admin"`);
      console.log(`\n🔍 If you're still getting permission errors:`);
      console.log(`   1. Hard refresh your browser (Ctrl+Shift+R)`);
      console.log(`   2. Sign out and sign back in`);
      console.log(`   3. Check browser console for your user ID`);
      console.log(`   4. Verify the user ID matches: ${user.uid}`);
    }

  } catch (error) {
    console.error('❌ Error checking admin status:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the function
checkAdminStatus()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });









