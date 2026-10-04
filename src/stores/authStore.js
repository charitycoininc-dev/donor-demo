import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "./config/firebase.js";

// Helper function to check if Firebase is available
const isFirebaseAvailable = () => {
  return auth && db && typeof auth.onAuthStateChanged === 'function';
};

const useAuthStore = create(
  devtools(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      loading: true,
      error: null,
      authListener: null,
      userListener: null,
      firebaseAvailable: isFirebaseAvailable(),

      // Actions
      setUser: (user) =>
        set(
          {
            user,
            isAuthenticated: !!user,
            loading: false,
            error: null,
          },
          false,
          "setUser",
        ),

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      // Update user data (merge with existing)
      updateUser: async (userData) => {
        try {
          const state = get();
          if (!state.user) return;

          // Remove password field - Firebase Auth handles authentication
          if (userData.password) {
            delete userData.password;
          }

          const updatedUser = { ...state.user, ...userData };
          set({
            user: updatedUser,
            error: null,
          });

          return updatedUser;
        } catch (error) {
          console.error("Update user error:", error);
          set({ error: error.message });
          throw error;
        }
      },

      // Initialize auth listener
      initializeAuth: () => {
        const state = get();

        // Check if Firebase is available
        if (!isFirebaseAvailable()) {
          console.error("Firebase is not available. Please check your configuration.");
          set({
            error: "Firebase is not available. Please check your configuration.",
            loading: false,
            firebaseAvailable: false,
          });
          return;
        }

        // Prevent multiple initializations
        if (state.authListener) {
          return;
        }

        try {
          const unsubscribeAuth = onAuthStateChanged(
            auth,
            async (firebaseUser) => {
              // Clean up previous user listener
              const currentState = get();
              if (currentState.userListener) {
                currentState.userListener();
                set({ userListener: null });
              }

              if (firebaseUser) {
                // Set up user document listener
                const userDocRef = doc(db, "users", firebaseUser.uid);

                const unsubscribeUser = onSnapshot(
                  userDocRef,
                  async (userDoc) => {
                    if (userDoc.exists()) {
                      const userData = userDoc.data();
                      set({
                        user: { id: firebaseUser.uid, ...userData },
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                      });
                    } else {
                      // User document doesn't exist, create basic user object
                      set({
                        user: {
                          id: firebaseUser.uid,
                          uid: firebaseUser.uid,
                          email: firebaseUser.email,
                        },
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                      });
                    }
                  },
                  (error) => {
                    console.error("Error listening to user doc:", error);
                    set({ error: error.message });
                  },
                );

                set({ userListener: unsubscribeUser });
              } else {
                // User logged out
                set({
                  user: null,
                  isAuthenticated: false,
                  loading: false,
                  error: null,
                });
              }
            },
          );

          set({ authListener: unsubscribeAuth });
        } catch (error) {
          console.error("Error initializing auth:", error);
          set({
            error: error.message,
            loading: false,
            firebaseAvailable: false,
          });
        }
      },

      // Sign in with email and password
      signIn: async (email, password) => {
        try {
          if (!isFirebaseAvailable()) {
            throw new Error("Firebase is not available. Please check your configuration.");
          }

          set({ loading: true, error: null });

          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );

          // The auth state change listener will handle setting the user
          return userCredential.user;
        } catch (error) {
          console.error("Sign in error:", error);
          set({
            error: error.message,
            loading: false,
          });
          throw error;
        }
      },

      // Sign up with email and password
      signUp: async (email, password, userData = {}) => {
        try {
          if (!isFirebaseAvailable()) {
            throw new Error("Firebase is not available. Please check your configuration.");
          }

          set({ loading: true, error: null });

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password,
          );

          const userId = userCredential.user.uid;
          console.log("✅ Firebase Auth user created:", userId);
          console.log("📝 User data passed to signUp:", userData);
          
          // CRITICAL: After createUserWithEmailAndPassword, we need to ensure the auth token
          // is fully propagated to Firestore before creating the document. The issue is that
          // request.auth.uid in Firestore rules might not be immediately available.
          //
          // Solution: Wait for onAuthStateChanged to fire, which ensures the auth state is
          // fully propagated. This is the most reliable way to ensure request.auth.uid is
          // available in Firestore rules.
          console.log("⏳ Ensuring auth token is available to Firestore...");
          
          // CRITICAL: After createUserWithEmailAndPassword, the user is authenticated
          // However, we need to ensure the auth token is available to Firestore before creating the document
          // The issue is that request.auth.uid in Firestore rules might not be immediately available
          // even though the user is authenticated.
          //
          // Solution: Use a combination of waiting for auth.currentUser and forcing token refresh
          // This ensures the token is fresh and available to Firestore security rules
          console.log("⏳ Ensuring auth token is available to Firestore...");
          
          // Check if auth.currentUser is already set (should be after createUserWithEmailAndPassword)
          let authReady = auth.currentUser && auth.currentUser.uid === userId;
          
          if (!authReady) {
            // Wait for auth.currentUser to be set with polling
            console.log("   ⏳ Waiting for auth.currentUser to be set...");
            const maxWaitAttempts = 50; // 5 seconds total (50 * 100ms)
            let attempts = 0;
            
            while (!authReady && attempts < maxWaitAttempts) {
              await new Promise(resolve => setTimeout(resolve, 100));
              attempts++;
              authReady = auth.currentUser && auth.currentUser.uid === userId;
              
              if (authReady) {
                console.log(`✅ Auth state ready after ${attempts * 100}ms`);
              }
            }
          }
          
          // Force a token refresh to ensure it's fresh and available to Firestore
          if (auth.currentUser) {
            try {
              console.log("   🔄 Forcing auth token refresh...");
              const idToken = await auth.currentUser.getIdToken(true);
              console.log("✅ Auth token refreshed successfully");
              console.log("   Token length:", idToken?.length || 0);
              
              // Wait for token to propagate to Firestore (this is critical)
              console.log("   ⏳ Waiting for token to propagate to Firestore...");
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // Verify token is still valid
              const verifyToken = await auth.currentUser.getIdToken(false);
              console.log("✅ Token verification successful (length:", verifyToken?.length || 0, ")");
            } catch (tokenError) {
              console.warn("⚠️ Error refreshing token:", tokenError);
              console.warn("   Waiting longer for token to propagate...");
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } else {
            console.error("❌ CRITICAL: auth.currentUser is not set after waiting");
            console.error("   userId:", userId);
            console.error("   This will likely cause permission errors!");
            throw new Error(`Auth state not ready: auth.currentUser is null after waiting`);
          }
          
          // Final verification
          if (!auth.currentUser || auth.currentUser.uid !== userId) {
            console.error("❌ CRITICAL: auth.currentUser still not set or doesn't match userId");
            console.error("   userId:", userId);
            console.error("   auth.currentUser:", auth.currentUser?.uid || 'not set');
            console.error("   This will likely cause permission errors!");
            throw new Error(`Auth state mismatch: expected ${userId}, got ${auth.currentUser?.uid || 'null'}`);
          } else {
            console.log("✅ Auth state confirmed:");
            console.log("   auth.currentUser.uid:", auth.currentUser.uid);
            console.log("   userId:", userId);
            console.log("   Match:", auth.currentUser.uid === userId);
          }
          
          console.log("📝 Creating user profile in Firestore for:", userId);
          console.log("   auth.currentUser:", auth.currentUser?.uid || 'not set');
          console.log("   Expected userId:", userId);
          console.log("   User ID match:", auth.currentUser?.uid === userId || 'auth.currentUser not set');

          // Create user document in Firestore with all profile fields initialized
          // Note: Remove 'role' from userData if present (users cannot set their own role)
          const { role, solanaWalletPrivateKey, ...safeUserData } = userData;
          
          // Build user document data, ensuring all profile fields are included
          // Use values from userData if provided, otherwise use empty strings
          const userDocData = {
            // Profile fields - use values from userData, defaulting to empty strings
            firstName: safeUserData.firstName !== undefined ? safeUserData.firstName : '',
            lastName: safeUserData.lastName !== undefined ? safeUserData.lastName : '',
            email: email || userCredential.user.email || '',
            phone: safeUserData.phone !== undefined ? safeUserData.phone : '',
            street1: safeUserData.street1 !== undefined ? safeUserData.street1 : '',
            street2: safeUserData.street2 !== undefined ? safeUserData.street2 : '',
            city: safeUserData.city !== undefined ? safeUserData.city : '',
            state: safeUserData.state !== undefined ? safeUserData.state : '',
            zip: safeUserData.zip !== undefined ? safeUserData.zip : '',
            solanaWallet: safeUserData.solanaWallet !== undefined ? safeUserData.solanaWallet : '',
            // System fields
            charityCoins: safeUserData.charityCoins !== undefined ? safeUserData.charityCoins : 0,
            totalDonated: safeUserData.totalDonated !== undefined ? safeUserData.totalDonated : 0,
            membershipTier: safeUserData.membershipTier || "Bronze",
            memberSince: safeUserData.memberSince || new Date().toISOString(),
            joinDate: safeUserData.joinDate || new Date().toISOString().split("T")[0],
            coinNumbers: safeUserData.coinNumbers || [],
            wonCoins: safeUserData.wonCoins || [],
            achievements: safeUserData.achievements || [],
            privacyConsent: safeUserData.privacyConsent !== undefined ? safeUserData.privacyConsent : true,
            consentDate: safeUserData.consentDate || new Date().toISOString(),
            transactions: safeUserData.transactions || [],
            status: safeUserData.status || "Active",
          };

          // CRITICAL: Verify that restricted fields are NOT in the data
          if ('role' in userDocData) {
            console.error("❌ ERROR: 'role' field found in userDocData - this will cause permission denied!");
            delete userDocData.role;
          }
          if ('solanaWalletPrivateKey' in userDocData) {
            console.error("❌ ERROR: 'solanaWalletPrivateKey' field found in userDocData - this will cause permission denied!");
            delete userDocData.solanaWalletPrivateKey;
          }
          
          // Log all keys in the data to verify no restricted fields are present
          const dataKeys = Object.keys(userDocData);
          console.log("📄 User document data keys:", dataKeys);
          console.log("📄 Checking for restricted fields...");
          if (dataKeys.includes('role')) {
            console.error("❌ ERROR: 'role' is in dataKeys - removing it");
            delete userDocData.role;
          }
          if (dataKeys.includes('solanaWalletPrivateKey')) {
            console.error("❌ ERROR: 'solanaWalletPrivateKey' is in dataKeys - removing it");
            delete userDocData.solanaWalletPrivateKey;
          }
          console.log("✅ Restricted fields check complete - role and solanaWalletPrivateKey are not in data");
          
          console.log("📄 User document data to save in authStore:", JSON.stringify(userDocData, null, 2));
          console.log("📄 Profile fields being saved:", {
            firstName: userDocData.firstName || '(empty)',
            lastName: userDocData.lastName || '(empty)',
            email: userDocData.email || '(empty)',
            phone: userDocData.phone || '(empty)',
            street1: userDocData.street1 || '(empty)',
            street2: userDocData.street2 || '(empty)',
            city: userDocData.city || '(empty)',
            state: userDocData.state || '(empty)',
            zip: userDocData.zip || '(empty)',
            solanaWallet: userDocData.solanaWallet || '(empty)'
          });
          
          // Check if any profile fields have actual values (not just empty strings)
          const hasProfileValues = userDocData.firstName || 
                                  userDocData.lastName || 
                                  userDocData.phone || 
                                  userDocData.street1 || 
                                  userDocData.city ||
                                  userDocData.state ||
                                  userDocData.zip;
          
          if (!hasProfileValues) {
            console.warn("⚠️ WARNING: No profile field values provided - all fields are empty!");
            console.warn("⚠️ This means the form fields were empty when signup was called");
            console.warn("⚠️ Empty strings will be saved to Firestore");
          } else {
            console.log("✅ Profile fields have values - will be saved to Firestore");
          }

          try {
            const userRef = doc(db, "users", userId);
            console.log("📝 Attempting to save user document to Firestore...");
            console.log("   Document path: users/", userId);
            console.log("   User ID from credential:", userId);
            console.log("   Auth currentUser.uid:", auth.currentUser?.uid || 'not set');
            console.log("   User ID match:", auth.currentUser?.uid === userId || 'auth.currentUser not set yet');
            console.log("   Data being saved:", JSON.stringify(userDocData, null, 2));
            console.log("   Firestore rules check: isAuthenticated() && request.auth.uid == userId");
            
            // CRITICAL: Use setDoc to create the document
            // Firestore security rules will check:
            // 1. isAuthenticated() - request.auth != null
            // 2. request.auth.uid == userId - user ID matches
            // 3. !('role' in request.resource.data) - role is not being set
            // 4. !('solanaWalletPrivateKey' in request.resource.data) - private key is not being set
            //
            // After createUserWithEmailAndPassword, request.auth.uid should be available
            // However, there can be a brief delay before the auth token is available to Firestore
            // Retry up to 5 times with increasing delays if it fails
            let documentCreated = false;
            let lastError = null;
            const maxAttempts = 5;
            
            console.log("   🔄 Starting document creation with retry logic (up to", maxAttempts, "attempts)...");
            
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
              try {
                if (attempt > 0) {
                  // Increasing delay: 500ms, 1000ms, 1500ms, 2000ms
                  const delayMs = 500 * attempt;
                  console.log(`   ⏳ Retry attempt ${attempt + 1}/${maxAttempts} after ${delayMs}ms delay...`);
                  await new Promise(resolve => setTimeout(resolve, delayMs));
                  
                  // Re-check auth state before retry
                  console.log("   🔍 Checking auth state before retry...");
                  console.log("      auth.currentUser:", auth.currentUser?.uid || 'not set');
                  console.log("      Expected userId:", userId);
                  console.log("      Match:", auth.currentUser?.uid === userId || 'auth.currentUser not set');
                } else {
                  console.log("   📤 Calling setDoc (attempt 1/5)...");
                }
                
                // Verify we're still authenticated before attempting to create the document
                if (!auth.currentUser) {
                  console.error(`   ❌ Not authenticated - auth.currentUser is null on attempt ${attempt + 1}`);
                  throw new Error("Not authenticated - auth.currentUser is null");
                }
                
                if (auth.currentUser.uid !== userId) {
                  console.error(`   ❌ User ID mismatch - expected ${userId}, got ${auth.currentUser.uid}`);
                  throw new Error(`User ID mismatch - expected ${userId}, got ${auth.currentUser.uid}`);
                }
                
                // Get a fresh token before each attempt to ensure it's available to Firestore
                try {
                  const freshToken = await auth.currentUser.getIdToken(false); // Don't force refresh on retry
                  console.log(`   🔑 Got fresh token (length: ${freshToken?.length || 0})`);
                } catch (tokenError) {
                  console.warn(`   ⚠️ Could not get token:`, tokenError.message);
                }
                
                // Attempt to create the document
                console.log(`   📤 Attempting setDoc for users/${userId}...`);
                console.log(`   📤 Auth state: authenticated=${!!auth.currentUser}, uid=${auth.currentUser?.uid}`);
                console.log(`   📤 Document path: users/${userId}`);
                console.log(`   📤 Rule check: isAuthenticated()=${!!auth.currentUser}, request.auth.uid==userId=${auth.currentUser?.uid === userId}`);
                
                await setDoc(userRef, userDocData);
                console.log(`✅ ✅ ✅ setDoc SUCCEEDED on attempt ${attempt + 1}/${maxAttempts} - User profile document saved to Firestore`);
                documentCreated = true;
                break;
              } catch (setDocError) {
                lastError = setDocError;
                console.error(`   ❌ setDoc FAILED on attempt ${attempt + 1}/${maxAttempts}:`, setDocError.code, setDocError.message);
                console.error(`   Error details:`, {
                  code: setDocError.code,
                  message: setDocError.message,
                  name: setDocError.name,
                  stack: setDocError.stack?.substring(0, 200)
                });
                
                // If it's a permission error and we haven't exhausted attempts, wait and retry
                if (setDocError.code === 'permission-denied') {
                  console.error(`   🚫 Permission denied on attempt ${attempt + 1}/${maxAttempts}`);
                  console.error(`   Detailed error information:`);
                  console.error(`   - Error code: ${setDocError.code}`);
                  console.error(`   - Error message: ${setDocError.message}`);
                  console.error(`   - Auth currentUser: ${auth.currentUser?.uid || 'null'}`);
                  console.error(`   - Expected userId: ${userId}`);
                  console.error(`   - User ID match: ${auth.currentUser?.uid === userId}`);
                  console.error(`   - Data being sent:`, JSON.stringify(userDocData, null, 2));
                  console.error(`   - Data keys:`, Object.keys(userDocData));
                  console.error(`   - Has 'role' field: ${'role' in userDocData}`);
                  console.error(`   - Has 'solanaWalletPrivateKey' field: ${'solanaWalletPrivateKey' in userDocData}`);
                  console.error(`   - Firestore rule check:`);
                  console.error(`     1. isAuthenticated() = ${!!auth.currentUser}`);
                  console.error(`     2. request.auth.uid == userId = ${auth.currentUser?.uid === userId}`);
                  console.error(`     3. !('role' in request.resource.data) = ${!('role' in userDocData)}`);
                  console.error(`     4. !('solanaWalletPrivateKey' in request.resource.data) = ${!('solanaWalletPrivateKey' in userDocData)}`);
                  
                  if (attempt < maxAttempts - 1) {
                    console.log(`   ⏳ Permission denied - this might be a timing issue`);
                    console.log(`   ⏳ Auth token might not be ready yet, will retry...`);
                    console.log(`   ⏳ This is attempt ${attempt + 1}/${maxAttempts}`);
                    
                    // Force a token refresh before retry
                    if (auth.currentUser) {
                      try {
                        console.log(`   🔄 Forcing token refresh before retry...`);
                        await auth.currentUser.getIdToken(true);
                        console.log(`   ✅ Token refreshed`);
                        // Wait longer before retry
                        await new Promise(resolve => setTimeout(resolve, 1000));
                      } catch (tokenError) {
                        console.warn(`   ⚠️ Token refresh failed:`, tokenError.message);
                      }
                    }
                    
                    continue;
                  } else {
                    // Last attempt failed with permission error
                    console.error(`   🚫 Permission denied on final attempt - Firestore rules rejected the create operation`);
                    console.error(`   This means:`);
                    console.error(`   1. Either request.auth.uid is not available yet, OR`);
                    console.error(`   2. Firestore security rules are rejecting the create operation, OR`);
                    console.error(`   3. The rules haven't been deployed properly, OR`);
                    console.error(`   4. There's a field in the data that violates the rules`);
                    console.error(`   Please check the browser console for detailed error information.`);
                    console.error(`   Also verify that Firestore rules are deployed: firebase deploy --only firestore:rules`);
                    break;
                  }
                }
                
                // For other errors, log and continue to retry if we have attempts left
                if (attempt < maxAttempts - 1) {
                  console.log(`   ⏳ Non-permission error, will retry...`);
                  continue;
                }
                
                // Last attempt failed, break and throw
                console.error(`   ❌ setDoc failed on final attempt ${attempt + 1}/${maxAttempts}`);
                break;
              }
            }
            
            if (!documentCreated) {
              console.error("❌❌❌ CRITICAL ERROR: Failed to create user document after", maxAttempts, "attempts");
              console.error("   Last error:", lastError);
              console.error("   Error code:", lastError?.code);
              console.error("   Error message:", lastError?.message);
              console.error("   This means:");
              console.error("   1. User account was created in Firebase Auth ✅");
              console.error("   2. But Firestore document could NOT be created ❌");
              console.error("   3. User is authenticated but has no profile document");
              console.error("   4. This is a critical issue that needs to be fixed");
              
              // Provide detailed error information
              const errorDetails = {
                userId,
                authCurrentUser: auth.currentUser?.uid || 'not set',
                errorCode: lastError?.code,
                errorMessage: lastError?.message,
                attempts: maxAttempts
              };
              
              console.error("   Error details:", errorDetails);
              
              // Throw a detailed error that will be caught and displayed to the user
              const errorMsg = lastError 
                ? `Failed to create user profile in Firestore after ${maxAttempts} attempts. Error: ${lastError.message} (code: ${lastError.code}). Please check Firestore security rules and ensure they are deployed.`
                : `Failed to create user profile in Firestore after ${maxAttempts} attempts. Please check Firestore security rules.`;
              
              throw new Error(errorMsg);
            }

            // Verify the document was created and contains all fields
            const createdDoc = await getDoc(userRef);
            if (!createdDoc.exists()) {
              console.error("ERROR: User profile document was not created in authStore!");
              throw new Error("Failed to create user profile in Firestore");
            }
            
            const savedData = createdDoc.data();
            console.log("✅ Verified: User profile document exists in Firestore");
            console.log("✅ Document ID:", createdDoc.id);
            console.log("✅ All fields in saved document:", Object.keys(savedData));
            
            // Check if profile fields exist in savedData (even if empty strings)
            const requiredProfileFields = ['firstName', 'lastName', 'email', 'phone', 'street1', 'street2', 'city', 'state', 'zip', 'solanaWallet'];
            const missingFields = [];
            const fieldsWithValues = [];
            
            requiredProfileFields.forEach(field => {
              if (!savedData.hasOwnProperty(field)) {
                // Field is missing from saved document
                missingFields.push(field);
                console.error(`❌ Field '${field}' is MISSING from Firestore document`);
              } else if (savedData[field] && savedData[field].toString().trim()) {
                // Field exists and has a non-empty value
                fieldsWithValues.push(field);
                console.log(`✅ Field '${field}' saved with value: "${savedData[field]}"`);
              } else {
                // Field exists but is empty
                console.log(`⚠️ Field '${field}' saved but is empty: "${savedData[field]}"`);
              }
            });
            
            console.log("✅ Saved profile fields summary:", {
              firstName: savedData.firstName || '(empty)',
              lastName: savedData.lastName || '(empty)',
              email: savedData.email || '(empty)',
              phone: savedData.phone || '(empty)',
              street1: savedData.street1 || '(empty)',
              street2: savedData.street2 || '(empty)',
              city: savedData.city || '(empty)',
              state: savedData.state || '(empty)',
              zip: savedData.zip || '(empty)',
              solanaWallet: savedData.solanaWallet || '(empty)'
            });
            
            if (missingFields.length > 0) {
              console.error(`❌ ERROR: ${missingFields.length} profile fields are MISSING from Firestore:`, missingFields);
              console.error("❌ Fields we tried to save:", Object.keys(userDocData));
              console.error("❌ Fields in saved document:", Object.keys(savedData));
            } else {
              console.log("✅ All profile fields exist in Firestore document");
            }
            
            console.log(`✅ Profile fields saved: ${fieldsWithValues.length} fields have values, ${requiredProfileFields.length - fieldsWithValues.length} are empty`);
            
            if (fieldsWithValues.length === 0) {
              console.warn("⚠️ WARNING: No profile fields have values - all fields are empty!");
              console.warn("⚠️ This might mean the form fields were empty when signup was called");
            }
            
            // IMPORTANT: Immediately update the user object in the store with the saved data
            // This ensures the form fields can be populated immediately, without waiting for onSnapshot
            // The onSnapshot listener will still fire and keep things in sync
            console.log("Updating user object in store with saved profile data");
            set({
              user: { id: userId, ...savedData },
              isAuthenticated: true,
              loading: false,
              error: null,
            });
            console.log("User object updated in store with profile data");
          } catch (firestoreError) {
            console.error("❌ ERROR creating user profile in Firestore (authStore):", firestoreError);
            console.error("   Error code:", firestoreError.code);
            console.error("   Error message:", firestoreError.message);
            console.error("   Error name:", firestoreError.name);
            console.error("   Auth current user:", auth.currentUser?.uid);
            console.error("   Expected user ID:", userId);
            console.error("   User ID match:", auth.currentUser?.uid === userId);
            console.error("   User data being saved:", JSON.stringify(userDocData, null, 2));
            
            // Check if it's a permission error
            if (firestoreError.code === 'permission-denied') {
              console.error("🚫 PERMISSION DENIED when creating user document");
              console.error("   - auth.currentUser exists:", !!auth.currentUser);
              console.error("   - auth.currentUser.uid:", auth.currentUser?.uid);
              console.error("   - userId:", userId);
              console.error("   - Match:", auth.currentUser?.uid === userId);
              console.error("   - Document path: users/", userId);
              console.error("   - Firestore rule: isAuthenticated() && request.auth.uid == userId");
              
              // Provide more detailed error message
              throw new Error(
                `Permission denied: Unable to create user profile. ` +
                `Auth state: ${auth.currentUser ? 'authenticated' : 'not authenticated'}, ` +
                `User ID match: ${auth.currentUser?.uid === userId ? 'yes' : 'no'}. ` +
                `Please check Firestore security rules and try again. ` +
                `Error: ${firestoreError.message}`
              );
            }
            
            // Re-throw with more context for other errors
            throw new Error(
              `Failed to save profile to Firestore: ${firestoreError.message} (code: ${firestoreError.code})`
            );
          }

          // The auth state change listener will handle setting the user
          console.log("✅ SignUp completed successfully - returning user credential");
          return userCredential.user;
        } catch (error) {
          console.error("❌ Sign up error in authStore:", error);
          console.error("   Error message:", error.message);
          console.error("   Error code:", error.code);
          console.error("   Error name:", error.name);
          console.error("   Error stack:", error.stack);
          
          // Set error state in store
          set({
            error: error.message,
            loading: false,
          });
          
          // Re-throw the error so it can be caught by useAuth hook
          throw error;
        }
      },

      // Sign out
      signOut: async () => {
        try {
          if (!isFirebaseAvailable()) {
            throw new Error("Firebase is not available. Please check your configuration.");
          }

          set({ loading: true, error: null });

          await signOut(auth);

          // Clean up listeners
          const state = get();
          if (state.userListener) {
            state.userListener();
          }

          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            userListener: null,
          });

          return true;
        } catch (error) {
          console.error("Sign out error:", error);
          set({
            error: error.message,
            loading: false,
          });
          throw error;
        }
      },

      // Send password reset email
      resetPassword: async (email) => {
        try {
          if (!isFirebaseAvailable()) {
            throw new Error("Firebase is not available. Please check your configuration.");
          }

          set({ error: null });

          await sendPasswordResetEmail(auth, email);

          return true;
        } catch (error) {
          console.error("Password reset error:", error);
          set({ error: error.message });
          throw error;
        }
      },

      // Update user profile in Firestore
      updateUserProfile: async (profileData) => {
        try {
          if (!isFirebaseAvailable()) {
            throw new Error("Firebase is not available. Please check your configuration.");
          }

          const state = get();
          if (!state.user?.id && !state.user?.uid) {
            throw new Error("No authenticated user");
          }

          set({ loading: true, error: null });

          const userId = state.user.id || state.user.uid;
          const userRef = doc(db, "users", userId);

          console.log("Updating user profile in authStore:", profileData);
          console.log("User ID:", userId);

          // Check if document exists
          const userDoc = await getDoc(userRef);

          if (userDoc.exists()) {
            // Document exists, update it
            console.log("Updating existing user document in authStore");
            await updateDoc(userRef, profileData);
            console.log("Profile updated successfully in authStore");

            // Verify the update succeeded
            const updatedDoc = await getDoc(userRef);
            if (updatedDoc.exists()) {
              const savedData = updatedDoc.data();
              console.log("Verified: Profile updated in authStore", savedData);
              
              // Update local state with saved data
              set({
                user: { ...state.user, ...savedData },
                loading: false,
                error: null,
              });
            } else {
              throw new Error("Profile update verification failed");
            }
          } else {
            // Create document if it doesn't exist
            console.log("User document doesn't exist, creating new document in authStore");
            const fullProfileData = {
              charityCoins: state.user.charityCoins || 0,
              totalDonated: state.user.totalDonated || 0,
              membershipTier: state.user.membershipTier || "Bronze",
              joinDate: state.user.joinDate || new Date().toISOString().split("T")[0],
              coinNumbers: state.user.coinNumbers || [],
              wonCoins: state.user.wonCoins || [],
              achievements: state.user.achievements || [],
              privacyConsent: true,
              consentDate: new Date().toISOString(),
              transactions: state.user.transactions || [],
              ...profileData,
            };
            await setDoc(userRef, fullProfileData);
            console.log("New user document created in authStore");

            // Verify the document was created
            const createdDoc = await getDoc(userRef);
            if (createdDoc.exists()) {
              const savedData = createdDoc.data();
              set({
                user: { ...state.user, ...savedData },
                loading: false,
                error: null,
              });
            } else {
              throw new Error("Failed to create user profile");
            }
          }

          return true;
        } catch (error) {
          console.error("Update profile error in authStore:", error);
          console.error("Error code:", error.code);
          console.error("Error message:", error.message);
          set({
            error: error.message,
            loading: false,
          });
          throw error;
        }
      },

      // Delete user account
      deleteAccount: async (password) => {
        try {
          if (!isFirebaseAvailable()) {
            throw new Error("Firebase is not available. Please check your configuration.");
          }

          const state = get();
          if (!state.user) {
            throw new Error("No authenticated user");
          }

          set({ loading: true, error: null });

          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error("No current user");
          }

          // Re-authenticate user before deletion
          const credential = EmailAuthProvider.credential(
            currentUser.email,
            password,
          );
          await reauthenticateWithCredential(currentUser, credential);

          // Delete user document from Firestore
          const userId = state.user.id || state.user.uid;
          await deleteDoc(doc(db, "users", userId));

          // Delete Firebase Auth user
          await deleteUser(currentUser);

          // Clean up state
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            userListener: null,
          });

          return true;
        } catch (error) {
          console.error("Delete account error:", error);
          set({
            error: error.message,
            loading: false,
          });
          throw error;
        }
      },

      // Get user statistics
      getUserStats: () => {
        const state = get();
        if (!state.user) return null;

        return {
          charityCoins: state.user.charityCoins || 0,
          totalDonated: state.user.totalDonated || 0,
          membershipTier: state.user.membershipTier || "Bronze",
          coinNumbers: state.user.coinNumbers || [],
          wonCoins: state.user.wonCoins || [],
          achievements: state.user.achievements || [],
          joinDate: state.user.joinDate,
        };
      },

      // Check membership tier
      getMembershipInfo: () => {
        const state = get();
        if (!state.user) return null;

        const totalDonated = state.user.totalDonated || 0;
        let tier = "Bronze";
        let multiplier = 1;

        if (totalDonated >= 1000) {
          tier = "Platinum";
          multiplier = 1.5;
        } else if (totalDonated >= 500) {
          tier = "Gold";
          multiplier = 1.25;
        } else if (totalDonated >= 100) {
          tier = "Silver";
          multiplier = 1.1;
        }

        return {
          tier,
          multiplier,
          totalDonated,
          nextTierThreshold:
            tier === "Bronze"
              ? 100
              : tier === "Silver"
                ? 500
                : tier === "Gold"
                  ? 1000
                  : null,
        };
      },

      // Clean up all listeners (for app unmount)
      cleanup: () => {
        const state = get();

        if (state.authListener) {
          state.authListener();
        }

        if (state.userListener) {
          state.userListener();
        }

        set(
          {
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null,
            authListener: null,
            userListener: null,
          },
          false,
          "cleanup",
        );
      },
    }),
    {
      name: "auth-store", // DevTools name
    },
  ),
);

export default useAuthStore;
