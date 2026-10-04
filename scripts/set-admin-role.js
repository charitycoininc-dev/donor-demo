import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
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

async function setAdminRole() {
  try {
    // Wait for auth to be ready
    await new Promise((resolve) => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        unsubscribe();
        resolve(user);
      });
    });

    const user = auth.currentUser;
    
    if (!user) {
      console.error('❌ No user is currently signed in.');
      console.log('Please sign in to the app first, then run this script.');
      process.exit(1);
    }

    console.log(`✅ Found authenticated user: ${user.email}`);
    console.log(`   User ID: ${user.uid}`);

    // Check if user document exists
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data();
      console.log(`\n📄 Current user document:`);
      console.log(`   Role: ${userData.role || 'NOT SET'}`);
      console.log(`   Email: ${userData.email || 'N/A'}`);
      
      if (userData.role === 'admin') {
        console.log(`\n✅ User already has admin role!`);
        return;
      }
    } else {
      console.log(`\n📄 User document does not exist. Creating...`);
    }

    // Set admin role
    console.log(`\n🔧 Setting admin role...`);
    await setDoc(
      userRef,
      {
        role: 'admin',
        email: user.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true } // Merge with existing data
    );

    console.log(`\n✅ Admin role set successfully!`);
    console.log(`\n📋 Next steps:`);
    console.log(`   1. Refresh your browser page`);
    console.log(`   2. Try processing donations again`);
    console.log(`   3. The permission errors should be gone`);

  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

// Run the function
setAdminRole()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

