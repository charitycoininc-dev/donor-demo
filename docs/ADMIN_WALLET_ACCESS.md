# Admin Access to Custodial Wallet Private Keys

This document explains how administrators can access and decrypt custodial wallet private keys.

## Overview

Custodial wallets are automatically created for users who don't have a Solana wallet when they make a donation. The private keys are encrypted using AES-256 encryption and stored in Firestore.

## Accessing Private Keys

### Method 1: User Management Page (Recommended)

1. Navigate to **Admin** → **User Management**
2. Find the user with a custodial wallet
3. Look for the **"Custodial"** badge next to their wallet address
4. Click the **"Decrypt Private Key"** button
5. The decrypted private key will appear in a yellow box
6. Use the eye icon to show/hide the key
7. Use the copy icon to copy the key to clipboard

### Method 2: API Endpoint (Programmatic Access)

For programmatic access or integration with other tools:

**Endpoint:** `POST /api/decrypt-wallet-key`

**Request:**
```json
{
  "encryptedPrivateKey": "encrypted_key_from_firestore"
}
```

**Response:**
```json
{
  "success": true,
  "privateKey": "base58_encoded_private_key",
  "format": "base58",
  "warning": "Keep this private key secure. Anyone with this key has full access to the wallet."
}
```

## Security Considerations

### Access Control

- **Firestore Security Rules**: Only admins can read `solanaWalletPrivateKey` fields
- **API Endpoint**: The decrypt endpoint should ideally verify admin status server-side
- **Display**: Decrypted keys are only shown temporarily in the browser (not persisted)

### Best Practices

1. **Never share private keys** via insecure channels (email, chat, etc.)
2. **Use secure communication** when transferring keys to users
3. **Log access**: Consider logging when private keys are decrypted
4. **Rotate keys**: Periodically rotate the encryption key
5. **Limit access**: Only grant admin access to trusted personnel

## Wallet Recovery

When a user needs to recover their custodial wallet:

1. Admin decrypts the private key using the User Management page
2. Admin securely provides the key to the user (e.g., encrypted email, secure portal)
3. User imports the key into their wallet software (Phantom, Solflare, etc.)

## Importing into Wallet Software

The decrypted private key is in **base58** format, which can be imported into most Solana wallets:

### Phantom Wallet
1. Open Phantom
2. Go to Settings → Add/Connect Wallet
3. Choose "Import Private Key"
4. Paste the base58 private key

### Solflare Wallet
1. Open Solflare
2. Go to Settings → Add Wallet
3. Choose "Import Private Key"
4. Paste the base58 private key

### Command Line (Solana CLI)
```bash
solana-keygen recover 'prompt://?full-path=/path/to/keypair.json' \
  --outfile /path/to/output.json
# Then manually set the bytes from the decrypted key
```

## Troubleshooting

### "Decryption failed" error
- Verify the `WALLET_ENCRYPTION_KEY` environment variable is set correctly
- Ensure the key matches the one used during encryption
- Check that the encrypted key hasn't been corrupted

### Key doesn't work when imported
- Verify the key format (should be base58)
- Check that you copied the complete key (no truncation)
- Ensure you're importing to a Solana-compatible wallet

## API Security Recommendations

For production, consider adding:
1. Admin authentication check in the API endpoint
2. Rate limiting on decrypt requests
3. Audit logging of decrypt operations
4. Temporary access tokens instead of direct API calls
