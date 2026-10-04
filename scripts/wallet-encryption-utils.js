/**
 * Wallet Encryption Utilities
 * 
 * Helper functions for encrypting and decrypting Solana wallet private keys.
 * These use AES-256 encryption via crypto-js.
 * 
 * NOTE: This is a utility script for reference. In production, encryption/decryption
 * should happen server-side only (in API endpoints or Cloud Functions).
 */

import CryptoJS from 'crypto-js';

// Encryption key - should match the key used in api/issue-charity-coins.js
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'default-dev-key-change-in-production-min-32-chars';

/**
 * Encrypt a Solana wallet private key
 * @param {Uint8Array} secretKeyUint8Array - The private key as Uint8Array
 * @returns {string} Encrypted private key (base64 string)
 */
export function encryptPrivateKey(secretKeyUint8Array) {
  // Convert Uint8Array to hex string for encryption
  const secretKeyHex = Buffer.from(secretKeyUint8Array).toString('hex');
  
  // Encrypt using AES-256
  const encrypted = CryptoJS.AES.encrypt(secretKeyHex, ENCRYPTION_KEY).toString();
  
  return encrypted;
}

/**
 * Decrypt a Solana wallet private key
 * @param {string} encryptedKey - The encrypted private key (base64 string from Firestore)
 * @returns {Uint8Array} Decrypted private key as Uint8Array
 */
export function decryptPrivateKey(encryptedKey) {
  try {
    // Decrypt using AES-256
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const secretKeyHex = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!secretKeyHex) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    // Convert hex string back to Uint8Array
    const secretKeyBytes = Buffer.from(secretKeyHex, 'hex');
    return new Uint8Array(secretKeyBytes);
  } catch (error) {
    console.error('Error decrypting private key:', error);
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
}

/**
 * Verify encryption/decryption works correctly
 * @returns {boolean} True if encryption/decryption works
 */
export function testEncryption() {
  try {
    // Generate a test keypair
    const testKey = new Uint8Array(64);
    crypto.getRandomValues(testKey);
    
    // Encrypt
    const encrypted = encryptPrivateKey(testKey);
    console.log('✅ Encryption successful');
    
    // Decrypt
    const decrypted = decryptPrivateKey(encrypted);
    console.log('✅ Decryption successful');
    
    // Verify
    const matches = testKey.length === decrypted.length &&
      testKey.every((val, idx) => val === decrypted[idx]);
    
    if (matches) {
      console.log('✅ Encryption/decryption test PASSED');
      return true;
    } else {
      console.error('❌ Encryption/decryption test FAILED - data mismatch');
      return false;
    }
  } catch (error) {
    console.error('❌ Encryption/decryption test FAILED:', error);
    return false;
  }
}

// Export for use in other modules
export default {
  encryptPrivateKey,
  decryptPrivateKey,
  testEncryption
};
