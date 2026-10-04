// Usage: 
//   node scripts/validate-wallet-addresses-client.js                    # Check all users (dry-run)
//   node scripts/validate-wallet-addresses-client.js --fix              # Fix invalid addresses
//   node scripts/validate-wallet-addresses-client.js <userId>           # Check specific user
//   node scripts/validate-wallet-addresses-client.js <userId> --fix     # Fix specific user
// 
// This script validates Solana wallet addresses in Firestore user documents.
// It uses the Firebase client SDK and requires admin credentials.
//
// REQUIRES: Admin credentials (email/password)
//   Option 1: Set environment variables: ADMIN_EMAIL and ADMIN_PASSWORD
//   Option 2: Pass as arguments: node scripts/validate-wallet-addresses-client.js <userId> <email> <password>
//
// REQUIRES: @solana/web3.js package (already in dependencies)

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { PublicKey } from '@solana/web3.js';
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

// Wallet address field names to check
const WALLET_FIELDS = ['solanaWallet', 'solanaWalletAddress'];

/**
 * Validates a Solana wallet address
 * @param {string} address - The wallet address to validate
 * @returns {Object} - Validation result with isValid, error, and normalizedAddress
 */
function validateSolanaAddress(address) {
  // Check if address is empty or null
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Address is empty or not a string',
      normalizedAddress: null,
    };
  }

  // Trim whitespace
  const trimmedAddress = address.trim();

  // Check if empty after trimming
  if (!trimmedAddress || trimmedAddress.length === 0) {
    return {
      isValid: false,
      error: 'Address is empty after trimming whitespace',
      normalizedAddress: null,
    };
  }

  // Check minimum length (Solana addresses are base58 encoded, typically 32-44 characters)
  if (trimmedAddress.length < 32) {
    return {
      isValid: false,
      error: `Address is too short (${trimmedAddress.length} characters, minimum 32)`,
      normalizedAddress: trimmedAddress,
    };
  }

  // Check maximum length (base58 addresses shouldn't exceed 44 characters)
  if (trimmedAddress.length > 44) {
    return {
      isValid: false,
      error: `Address is too long (${trimmedAddress.length} characters, maximum 44)`,
      normalizedAddress: trimmedAddress,
    };
  }

  // Try to create a PublicKey object (this validates the address format)
  try {
    const publicKey = new PublicKey(trimmedAddress);
    const normalizedAddress = publicKey.toBase58();

    // Verify the normalized address matches (checks for valid base58 encoding)
    if (normalizedAddress !== trimmedAddress && normalizedAddress.toLowerCase() !== trimmedAddress.toLowerCase()) {
      return {
        isValid: false,
        error: 'Address contains invalid characters or format',
        normalizedAddress: normalizedAddress,
      };
    }

    return {
      isValid: true,
      error: null,
      normalizedAddress: normalizedAddress,
    };
  } catch (error) {
    return {
      isValid: false,
      error: `Invalid Solana public key: ${error.message}`,
      normalizedAddress: trimmedAddress,
    };
  }
}

/**
 * Validates and fixes wallet addresses for a user
 * @param {string} userId - The user ID
 * @param {Object} userData - The user document data
 * @param {boolean} fix - Whether to fix invalid addresses
 * @returns {Object} - Validation result
 */
function validateUserWalletAddresses(userId, userData, fix = false) {
  const results = {
    userId,
    email: userData.email || 'N/A',
    fields: [],
    hasInvalidAddresses: false,
    fixed: false,
    updates: {},
  };

  // Check each wallet field
  for (const fieldName of WALLET_FIELDS) {
    const address = userData[fieldName];
    const validation = validateSolanaAddress(address);

    const fieldResult = {
      fieldName,
      address: address || '(empty)',
      isValid: validation.isValid,
      error: validation.error,
      normalizedAddress: validation.normalizedAddress,
      needsFix: false,
      fixed: false,
    };

    // If address is invalid, mark it for fixing
    if (!validation.isValid) {
      results.hasInvalidAddresses = true;

      if (fix) {
        // If address is empty or just whitespace, remove it
        if (!address || !address.trim() || address.trim().length === 0) {
          fieldResult.needsFix = true;
          fieldResult.fixed = true;
          results.updates[fieldName] = ''; // Set to empty string
          fieldResult.newValue = '';
        } else if (validation.normalizedAddress && validation.normalizedAddress !== address) {
          // If address can be normalized (fixes whitespace/formatting), use normalized version
          fieldResult.needsFix = true;
          fieldResult.fixed = true;
          results.updates[fieldName] = validation.normalizedAddress;
          fieldResult.newValue = validation.normalizedAddress;
        } else {
          // Address is completely invalid, remove it
          fieldResult.needsFix = true;
          fieldResult.fixed = true;
          results.updates[fieldName] = ''; // Set to empty string
          fieldResult.newValue = '';
        }
      } else {
        // Dry-run mode: just mark as needing fix
        if (!address || !address.trim() || address.trim().length === 0) {
          fieldResult.needsFix = true;
        } else {
          fieldResult.needsFix = true;
        }
      }
    } else if (validation.normalizedAddress && validation.normalizedAddress !== address) {
      // Address is valid but needs normalization (whitespace, case, etc.)
      if (fix) {
        fieldResult.needsFix = true;
        fieldResult.fixed = true;
        results.updates[fieldName] = validation.normalizedAddress;
        fieldResult.newValue = validation.normalizedAddress;
      } else {
        fieldResult.needsFix = true;
      }
    }

    results.fields.push(fieldResult);
  }

  // Mark as fixed if any updates were made
  if (fix && Object.keys(results.updates).length > 0) {
    results.fixed = true;
  }

  return results;
}

/**
 * Checks admin access and authenticates
 */
async function checkAdminAccess() {
  // Get credentials from environment variables or command line arguments
  // Skip userId and --fix flag when looking for email/password
  const args = process.argv.slice(2);
  const userIdArg = args.find(arg => arg !== '--fix' && !arg.includes('@'));
  const fixFlag = args.includes('--fix');
  const emailArg = args.find(arg => arg.includes('@'));
  const passwordArg = args[args.indexOf(emailArg) + 1] || args[args.length - 1];
  
  const email = process.env.ADMIN_EMAIL || emailArg;
  const password = process.env.ADMIN_PASSWORD || (emailArg ? passwordArg : undefined);
  
  if (!email || !password) {
    console.error('❌ Admin credentials required!');
    console.log('\n📋 Usage options:');
    console.log('   Option 1: Set environment variables');
    console.log('     set ADMIN_EMAIL=your@email.com');
    console.log('     set ADMIN_PASSWORD=yourpassword');
    console.log('     npm run validate:wallets:client');
    console.log('\n   Option 2: Pass credentials as arguments');
    console.log('     node scripts/validate-wallet-addresses-client.js <userId> <email> <password>');
    console.log('\n   Option 3: Use Admin SDK version (requires Firebase Admin setup)');
    console.log('     npm run validate:wallets');
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
      console.log('   2. Or use the Admin SDK version: scripts/validate-wallet-addresses.js');
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

/**
 * Validates wallet addresses for all users
 * @param {boolean} fix - Whether to fix invalid addresses
 */
async function validateAllUsers(fix = false) {
  console.log(`🔍 ${fix ? 'Validating and fixing' : 'Validating'} wallet addresses for all users...\n`);

  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  if (snapshot.empty) {
    console.log('❌ No users found in the database.');
    return;
  }

  console.log(`📊 Found ${snapshot.size} user(s) to check.\n`);

  let validCount = 0;
  let invalidCount = 0;
  let fixedCount = 0;
  const invalidUsers = [];
  const fixedUsers = [];

  for (const docSnap of snapshot.docs) {
    const userId = docSnap.id;
    const userData = docSnap.data();

    console.log(`\n👤 Checking user: ${userId}`);
    console.log(`   Email: ${userData.email || 'N/A'}`);

    const result = validateUserWalletAddresses(userId, userData, fix);

    // Check if user has any wallet fields
    const hasWalletFields = WALLET_FIELDS.some(field => field in userData && userData[field]);
    
    if (!hasWalletFields) {
      console.log(`   ℹ️  No wallet fields found in user document (or all are empty)`);
      // Don't count users without wallet fields as valid or invalid - they're neutral
      continue;
    }

    // Check each field
    let hasInvalid = false;
    let hasFixed = false;
    let hasValid = false;

    for (const fieldResult of result.fields) {
      // Only check fields that exist in userData and have a value
      if (fieldResult.fieldName in userData && userData[fieldResult.fieldName]) {
        if (fieldResult.isValid) {
          hasValid = true;
          if (fieldResult.needsFix && fieldResult.fixed) {
            console.log(`   ✅ ${fieldResult.fieldName}: Valid but normalized`);
            console.log(`      Old: "${fieldResult.address}"`);
            console.log(`      New: "${fieldResult.newValue}"`);
            hasFixed = true;
          } else {
            const address = fieldResult.address || '(empty)';
            const preview = address.length > 8 ? address.substring(0, 8) + '...' : address;
            console.log(`   ✅ ${fieldResult.fieldName}: Valid (${preview})`);
          }
        } else {
          hasInvalid = true;
          console.log(`   ❌ ${fieldResult.fieldName}: Invalid`);
          console.log(`      Address: "${fieldResult.address}"`);
          console.log(`      Error: ${fieldResult.error}`);
          if (fieldResult.needsFix && fieldResult.fixed) {
            console.log(`      🔧 Fixed: ${fieldResult.newValue ? `Normalized to "${fieldResult.newValue}"` : 'Removed invalid address'}`);
            hasFixed = true;
          } else if (fieldResult.needsFix) {
            console.log(`      ⚠️  Needs fix: Will be ${fieldResult.normalizedAddress ? `normalized to "${fieldResult.normalizedAddress}"` : 'removed'}`);
          }
        }
      }
    }

    // Count results
    if (hasInvalid) {
      invalidCount++;
      invalidUsers.push(result);
    } else if (hasValid) {
      validCount++;
    }

    if (hasFixed) {
      fixedCount++;
      fixedUsers.push(result);
    }

    // Apply fixes if in fix mode
    if (fix && Object.keys(result.updates).length > 0) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, result.updates);
        console.log(`   ✅ Updated user document with fixes`);
      } catch (updateError) {
        console.error(`   ❌ Failed to update user document: ${updateError.message}`);
        if (updateError.code === 'permission-denied') {
          console.error(`      This user may not have permission to update this document.`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log(`   Total users checked: ${snapshot.size}`);
  console.log(`   Users with valid addresses: ${validCount}`);
  console.log(`   Users with invalid addresses: ${invalidCount}`);
  if (fix) {
    console.log(`   Users fixed: ${fixedCount}`);
  }

  if (invalidCount > 0) {
    console.log('\n❌ Users with invalid wallet addresses:');
    invalidUsers.forEach(({ userId, email, fields }) => {
      console.log(`   - ${userId} (${email}):`);
      fields.forEach(field => {
        if (!field.isValid) {
          console.log(`     • ${field.fieldName}: "${field.address}" - ${field.error}`);
        }
      });
    });

    if (!fix) {
      console.log('\n💡 To fix invalid addresses, run:');
      console.log('   npm run validate:wallets:client:fix');
      console.log('   or');
      console.log('   node scripts/validate-wallet-addresses-client.js --fix');
    }
  } else {
    console.log('\n✅ All wallet addresses are valid!');
  }

  if (fix && fixedCount > 0) {
    console.log('\n✅ Successfully fixed wallet addresses!');
    console.log('\n📋 Fixed users:');
    fixedUsers.forEach(({ userId, email, updates }) => {
      console.log(`   - ${userId} (${email}):`);
      Object.entries(updates).forEach(([field, value]) => {
        console.log(`     • ${field}: "${value}"`);
      });
    });
  }
}

/**
 * Validates wallet addresses for a specific user
 * @param {string} userId - The user ID
 * @param {boolean} fix - Whether to fix invalid addresses
 */
async function validateSpecificUser(userId, fix = false) {
  console.log(`🔍 ${fix ? 'Validating and fixing' : 'Validating'} wallet addresses for user: ${userId}\n`);

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.log(`❌ User ${userId} not found in the database.`);
    process.exit(1);
  }

  const userData = userSnap.data();
  console.log(`📄 User data:`);
  console.log(`   Email: ${userData.email || 'N/A'}`);
  console.log(`   Wallet fields: ${WALLET_FIELDS.filter(f => f in userData).join(', ') || 'None'}\n`);

  const result = validateUserWalletAddresses(userId, userData, fix);

  // Display results
  for (const fieldResult of result.fields) {
    if (fieldResult.fieldName in userData) {
      console.log(`\n📋 ${fieldResult.fieldName}:`);
      console.log(`   Address: "${fieldResult.address}"`);
      if (fieldResult.isValid) {
        console.log(`   Status: ✅ Valid`);
        if (fieldResult.needsFix && fieldResult.fixed) {
          console.log(`   Normalized: "${fieldResult.newValue}"`);
        }
      } else {
        console.log(`   Status: ❌ Invalid`);
        console.log(`   Error: ${fieldResult.error}`);
        if (fieldResult.needsFix && fieldResult.fixed) {
          console.log(`   Fixed: ${fieldResult.newValue ? `"${fieldResult.newValue}"` : 'Removed'}`);
        } else if (fieldResult.needsFix) {
          console.log(`   Action needed: Will be ${fieldResult.normalizedAddress ? `normalized to "${fieldResult.normalizedAddress}"` : 'removed'}`);
        }
      }
    }
  }

  // Apply fixes if in fix mode
  if (fix && Object.keys(result.updates).length > 0) {
    try {
      await updateDoc(userRef, result.updates);
      console.log(`\n✅ Successfully updated user document!`);
      console.log(`\n📋 Updates applied:`);
      Object.entries(result.updates).forEach(([field, value]) => {
        console.log(`   • ${field}: "${value}"`);
      });
    } catch (updateError) {
      console.error(`\n❌ Failed to update user document: ${updateError.message}`);
      if (updateError.code === 'permission-denied') {
        console.error(`   This user may not have permission to update this document.`);
      }
      process.exit(1);
    }
  } else if (result.hasInvalidAddresses && !fix) {
    console.log(`\n💡 To fix invalid addresses, run:`);
    console.log(`   node scripts/validate-wallet-addresses-client.js ${userId} --fix`);
  } else if (!result.hasInvalidAddresses) {
    console.log(`\n✅ All wallet addresses are valid!`);
  }
}

// Main execution
async function main() {
  try {
    // Parse arguments (skip email/password if provided)
    const args = process.argv.slice(2);
    const fix = args.includes('--fix');
    const userId = args.find(arg => arg !== '--fix' && !arg.includes('@'));

    // Check admin access first
    await checkAdminAccess();
    
    if (userId) {
      await validateSpecificUser(userId, fix);
    } else {
      await validateAllUsers(fix);
    }

    console.log('\n✨ Done!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error validating wallet addresses:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

main();

