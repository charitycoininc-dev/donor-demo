// Usage: 
//   node scripts/validate-wallet-addresses.js                    # Check all users (dry-run)
//   node scripts/validate-wallet-addresses.js --fix              # Fix invalid addresses
//   node scripts/validate-wallet-addresses.js <userId>           # Check specific user
//   node scripts/validate-wallet-addresses.js <userId> --fix     # Fix specific user
// 
// This script validates Solana wallet addresses in Firestore user documents.
// It identifies invalid addresses and can optionally clean them up.
//
// REQUIRES: Firebase Admin SDK credentials
//   Option 1: Set GOOGLE_APPLICATION_CREDENTIALS environment variable to your service account key file
//   Option 2: Use gcloud CLI: gcloud auth application-default login
//
// REQUIRES: @solana/web3.js package
//   npm install @solana/web3.js

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { PublicKey } from '@solana/web3.js';

// Initialize Firebase Admin SDK
// Note: applicationDefault() will only fail when actually used, not during initialization
initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

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
 * Validates wallet addresses for all users
 * @param {boolean} fix - Whether to fix invalid addresses
 */
async function validateAllUsers(fix = false) {
  console.log(`🔍 ${fix ? 'Validating and fixing' : 'Validating'} wallet addresses for all users...\n`);

  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();

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
        const userRef = db.collection('users').doc(userId);
        await userRef.update(result.updates);
        console.log(`   ✅ Updated user document with fixes`);
      } catch (updateError) {
        console.error(`   ❌ Failed to update user document: ${updateError.message}`);
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
      console.log('   npm run validate:wallets:fix');
      console.log('   or');
      console.log('   node scripts/validate-wallet-addresses.js --fix');
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

  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
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
      await userRef.update(result.updates);
      console.log(`\n✅ Successfully updated user document!`);
      console.log(`\n📋 Updates applied:`);
      Object.entries(result.updates).forEach(([field, value]) => {
        console.log(`   • ${field}: "${value}"`);
      });
    } catch (updateError) {
      console.error(`\n❌ Failed to update user document: ${updateError.message}`);
      process.exit(1);
    }
  } else if (result.hasInvalidAddresses && !fix) {
    console.log(`\n💡 To fix invalid addresses, run:`);
    console.log(`   node scripts/validate-wallet-addresses.js ${userId} --fix`);
  } else if (!result.hasInvalidAddresses) {
    console.log(`\n✅ All wallet addresses are valid!`);
  }
}

// Main execution
async function main() {
  try {
    const args = process.argv.slice(2);
    const fix = args.includes('--fix');
    const userId = args.find(arg => arg !== '--fix');

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

    // Check if it's a credential error
    if (error.message.includes('credential') || error.message.includes('authentication') || error.code === 'ENOENT') {
      console.error('\n📋 Firebase Admin SDK credentials not found!');
      console.error('\n   Setup Options:');
      console.error('   1. Set GOOGLE_APPLICATION_CREDENTIALS environment variable');
      console.error('      Windows: set GOOGLE_APPLICATION_CREDENTIALS=C:\\path\\to\\service-account-key.json');
      console.error('      Mac/Linux: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"');
      console.error('\n   2. Use gcloud CLI (if installed)');
      console.error('      gcloud auth application-default login');
    }

    // Check if it's a missing package error
    if (error.message.includes('@solana/web3.js') || error.message.includes('Cannot find module')) {
      console.error('\n📋 @solana/web3.js package not found!');
      console.error('\n   Install it with:');
      console.error('   npm install @solana/web3.js');
    }

    process.exit(1);
  }
}

main();

