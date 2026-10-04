import CryptoJS from 'crypto-js';
import bs58 from 'bs58';

// Encryption key - must match the key used in issue-charity-coins.js
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'default-dev-key-change-in-production-min-32-chars';

/**
 * Decrypt a Solana wallet private key
 * @param {string} encryptedKey - The encrypted private key from Firestore
 * @returns {string} Decrypted private key as base58 string (for easy import into wallets)
 */
function decryptPrivateKey(encryptedKey) {
  try {
    // Decrypt using AES-256
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, ENCRYPTION_KEY);
    const secretKeyHex = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!secretKeyHex) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    // Convert hex string back to Uint8Array, then to base58 for display
    // The encryption stores the private key as hex, so we convert back
    const secretKeyBytes = Buffer.from(secretKeyHex, 'hex');
    
    // Convert to base58 for easy import into wallet software
    // This format can be used with Solana wallet libraries
    return bs58.encode(secretKeyBytes);
  } catch (error) {
    console.error('Error decrypting private key:', error);
    throw new Error(`Failed to decrypt private key: ${error.message}`);
  }
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { encryptedPrivateKey } = req.body;

    // Validate required fields
    if (!encryptedPrivateKey) {
      return res.status(400).json({ 
        error: "Missing required field",
        details: "encryptedPrivateKey is required"
      });
    }

    // Decrypt the private key
    const decryptedKey = decryptPrivateKey(encryptedPrivateKey);

    // Return the decrypted key
    // SECURITY: This endpoint should only be called by admins server-side
    // The client should verify admin status before calling this
    return res.status(200).json({
      success: true,
      privateKey: decryptedKey,
      format: "base58",
      warning: "Keep this private key secure. Anyone with this key has full access to the wallet."
    });
  } catch (error) {
    console.error('[DecryptWalletKey] Error:', error);
    
    return res.status(500).json({
      error: "Failed to decrypt private key",
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
