// Firebase Configuration
// Note: Firebase API keys are safe to expose in client-side code.
// They only identify your Firebase project - real security comes from
// Firebase Authentication and Security Rules.

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Debug: Log all environment variables (check both naming conventions)
const logEnvVar = (preferred, fallback, label) => {
  const value = import.meta.env[preferred] || import.meta.env[fallback];
  const source = import.meta.env[preferred] ? preferred : (import.meta.env[fallback] ? fallback : 'missing');
  console.log(`${label}:`, value ? `✅ Set (${source})` : '❌ Missing');
};

console.log('🔍 Debug: Environment Variables Check');
logEnvVar('VITE_FIREBASE_API_KEY', 'VITE_API_KEY', 'API Key');
logEnvVar('VITE_FIREBASE_AUTH_DOMAIN', 'VITE_AUTH_DOMAIN', 'Auth Domain');
logEnvVar('VITE_FIREBASE_PROJECT_ID', 'VITE_PROJECT_ID', 'Project ID');
logEnvVar('VITE_FIREBASE_STORAGE_BUCKET', 'VITE_STORAGE_BUCKET', 'Storage Bucket');
logEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_SENDER_ID', 'Messaging Sender ID');
logEnvVar('VITE_FIREBASE_APP_ID', 'VITE_APP_ID', 'App ID');
logEnvVar('VITE_FIREBASE_MEASUREMENT_ID', 'VITE_MEASUREMENT_ID', 'Measurement ID');

// Check if required environment variables are present (support both naming conventions)
const checkEnvVar = (preferredName, fallbackName) => {
  return import.meta.env[preferredName] || import.meta.env[fallbackName];
};

const requiredEnvVars = [
  { preferred: 'VITE_FIREBASE_API_KEY', fallback: 'VITE_API_KEY' },
  { preferred: 'VITE_FIREBASE_AUTH_DOMAIN', fallback: 'VITE_AUTH_DOMAIN' },
  { preferred: 'VITE_FIREBASE_PROJECT_ID', fallback: 'VITE_PROJECT_ID' },
  { preferred: 'VITE_FIREBASE_STORAGE_BUCKET', fallback: 'VITE_STORAGE_BUCKET' },
  { preferred: 'VITE_FIREBASE_MESSAGING_SENDER_ID', fallback: 'VITE_SENDER_ID' },
  { preferred: 'VITE_FIREBASE_APP_ID', fallback: 'VITE_APP_ID' }
];

const missingVars = requiredEnvVars.filter(({ preferred, fallback }) => !checkEnvVar(preferred, fallback));

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars);
  console.error('Please check your .env file and Vercel environment variables.');
  console.error('You can create a .env file in the root directory with the following variables:');
  console.error(`
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
  `);
}

// Create a fallback config for development if env vars are missing
const createFallbackConfig = () => {
  console.warn('⚠️ Using fallback Firebase configuration for development');
  return {
    apiKey: "demo-api-key",
    authDomain: "demo-project.firebaseapp.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id",
    measurementId: "demo-measurement-id"
  };
};

// Support both naming conventions: VITE_FIREBASE_* and VITE_* (fallback for compatibility)
const firebaseConfig = missingVars.length > 0 && import.meta.env.DEV 
  ? createFallbackConfig()
  : {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.VITE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.VITE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.VITE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.VITE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.VITE_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.VITE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || import.meta.env.VITE_MEASUREMENT_ID,
    };

// Debug: Log the final config (without sensitive data)
console.log('🔍 Debug: Firebase Config Check');
console.log('Config API Key:', firebaseConfig.apiKey ? '✅ Present' : '❌ Missing');
console.log('Config Auth Domain:', firebaseConfig.authDomain ? '✅ Present' : '❌ Missing');
console.log('Config Project ID:', firebaseConfig.projectId ? '✅ Present' : '❌ Missing');
console.log('Firebase Project ID (for rules verification):', firebaseConfig.projectId || 'MISSING - check Vercel env vars');
    if (typeof window !== 'undefined') window.__FIREBASE_PROJECT_ID = firebaseConfig.projectId;
console.log('Config Storage Bucket:', firebaseConfig.storageBucket ? '✅ Present' : '❌ Missing');
console.log('Config Sender ID:', firebaseConfig.messagingSenderId ? '✅ Present' : '❌ Missing');
console.log('Config App ID:', firebaseConfig.appId ? '✅ Present' : '❌ Missing');

// Initialize Firebase app and services
let app;
let auth;
let db;

try {
  // Validate config before initializing
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "demo-api-key") {
    throw new Error('Invalid Firebase configuration. Please check your environment variables.');
  }

  console.log('🚀 Attempting to initialize Firebase...');
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');
  
  // Only initialize analytics in production and if measurementId exists
  if (import.meta.env.PROD && import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) {
    getAnalytics(app);
  }
  
  auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
  
  db = getFirestore(app);
  console.log('✅ Firestore initialized');

  // Configure Firestore settings for better offline support and connection handling
  // Note: settings() method might not be available in all Firebase versions
  if (db && typeof db.settings === 'function') {
    try {
      db.settings({
        cacheSizeBytes: 50 * 1024 * 1024, // 50MB cache
        ignoreUndefinedProperties: true,
      });
      console.log('✅ Firestore settings configured');
    } catch (settingsError) {
      console.warn('⚠️ Could not configure Firestore settings:', settingsError);
    }
  } else {
    console.log('ℹ️ Firestore settings not configured (settings method not available)');
  }

  // Connect to emulators in development if needed
  if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099');
      connectFirestoreEmulator(db, 'localhost', 8080);
      console.log('Connected to Firebase emulators');
    } catch (emulatorError) {
      console.warn('Failed to connect to emulators:', emulatorError);
    }
  }

  console.log('🎉 Firebase initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error);
  
  // Provide helpful error messages for both development and production
  if (import.meta.env.DEV) {
    console.error(`
🔥 Firebase Configuration Error 🔥

To fix this issue:

1. Create a .env file in the root directory
2. Add your Firebase configuration:

VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

3. Get these values from your Firebase Console:
   - Go to https://console.firebase.google.com/
   - Select your project
   - Go to Project Settings > General
   - Scroll down to "Your apps" section
   - Copy the config values

4. Restart your development server
    `);
  } else {
    console.error(`
🔥 Firebase Configuration Error (Production) 🔥

Firebase environment variables are missing on Vercel. To fix this:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variables (for Production environment):

VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

4. Get these values from Firebase Console:
   - Go to https://console.firebase.google.com/
   - Select your project > Project Settings > General
   - Scroll to "Your apps" section and copy the config values

5. After adding variables, redeploy your Vercel project

NOTE: The code also supports shorter variable names (VITE_API_KEY, VITE_AUTH_DOMAIN, etc.)
as a fallback if you prefer those names in Vercel.
    `);
  }
  
  // Create mock objects to prevent app from crashing
  app = null;
  auth = null;
  db = null;
}

// Export Firebase instances
export { auth, db };
export default app;
