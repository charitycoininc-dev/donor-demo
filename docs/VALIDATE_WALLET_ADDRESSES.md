# Validate Wallet Addresses Utility

This utility script validates Solana wallet addresses in Firestore user documents and can optionally clean up invalid addresses.

## Purpose

The "Provided Owner Is Not Allowed" error in Solana token transfers typically occurs when:
1. The wallet address is invalid or malformed
2. The wallet address is not a valid Solana public key
3. The wallet address contains invalid characters
4. The wallet address is from a different network (mainnet vs devnet)

This utility helps identify and fix these issues by:
- Validating all wallet addresses in Firestore
- Identifying invalid addresses
- Optionally cleaning up invalid addresses (removing or normalizing them)

## Two Versions Available

### Client-Side Version (Recommended) ✅

**Easier to use** - Uses Firebase client SDK with admin credentials (email/password). No service account setup required.

**Prerequisites:**
- Admin credentials (email/password)
- Node.js and npm (already installed)
- @solana/web3.js package (already in dependencies)

**Usage:**

```bash
# Check all users (dry-run)
npm run validate:wallets:client

# Fix all users
npm run validate:wallets:client:fix

# Check specific user
node scripts/validate-wallet-addresses-client.js <userId>

# Fix specific user
node scripts/validate-wallet-addresses-client.js <userId> --fix
```

**Setup:**
1. Set environment variables (Windows PowerShell):
   ```powershell
   $env:ADMIN_EMAIL="your@email.com"
   $env:ADMIN_PASSWORD="yourpassword"
   ```

2. Or pass credentials as arguments:
   ```bash
   node scripts/validate-wallet-addresses-client.js <userId> <email> <password>
   ```

### Admin SDK Version (Advanced)

**More powerful** - Uses Firebase Admin SDK with service account credentials. Bypasses security rules.

**Prerequisites:**
1. **Firebase Admin SDK credentials**:
   - Option 1: Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable to your service account key file
   - Option 2: Use gcloud CLI: `gcloud auth application-default login`

2. **Node.js and npm** (already installed)

3. **@solana/web3.js package** (already in dependencies)

**Usage:**

```bash
# Check all users (dry-run)
npm run validate:wallets

# Fix all users
npm run validate:wallets:fix

# Check specific user
node scripts/validate-wallet-addresses.js <userId>

# Fix specific user
node scripts/validate-wallet-addresses.js <userId> --fix
```

## What It Does

### Validation

The script validates:
- `solanaWallet` field
- `solanaWalletAddress` field

For each wallet address, it checks:
1. **Empty/Null Check**: Address is not empty or null
2. **Length Check**: Address is between 32-44 characters (valid Solana public key length)
3. **Format Check**: Address is a valid base58-encoded Solana public key
4. **Normalization**: Address can be normalized (whitespace trimmed, case corrected)

### Fixes

When run with `--fix` flag, the script:
1. **Removes invalid addresses**: Sets invalid addresses to empty string
2. **Normalizes valid addresses**: Fixes whitespace, case, and formatting issues
3. **Updates Firestore**: Saves changes to user documents

## Output

### Dry Run Mode

```
🔍 Validating wallet addresses for all users...

📊 Found 10 user(s) to check.

👤 Checking user: abc123
   Email: user@example.com
   ✅ solanaWallet: Valid (5PvuV2C6...)
   ❌ solanaWalletAddress: Invalid
      Address: "invalid-address-123"
      Error: Invalid Solana public key: Invalid public key input
      ⚠️  Needs fix: Will be removed

============================================================
📊 Summary:
   Total users checked: 10
   Users with valid addresses: 8
   Users with invalid addresses: 2

❌ Users with invalid wallet addresses:
   - abc123 (user@example.com):
     • solanaWalletAddress: "invalid-address-123" - Invalid Solana public key: Invalid public key input

💡 To fix invalid addresses, run:
   npm run validate:wallets:fix
   or
   node scripts/validate-wallet-addresses.js --fix
```

### Fix Mode

```
🔍 Validating and fixing wallet addresses for all users...

📊 Found 10 user(s) to check.

👤 Checking user: abc123
   Email: user@example.com
   ✅ solanaWallet: Valid (5PvuV2C6...)
   ❌ solanaWalletAddress: Invalid
      Address: "invalid-address-123"
      Error: Invalid Solana public key: Invalid public key input
      🔧 Fixed: Removed invalid address
   ✅ Updated user document with fixes

============================================================
📊 Summary:
   Total users checked: 10
   Users with valid addresses: 8
   Users with invalid addresses: 2
   Users fixed: 2

✅ Successfully fixed wallet addresses!

📋 Fixed users:
   - abc123 (user@example.com):
     • solanaWalletAddress: ""
```

## Common Issues

### Client-Side Version: Admin Credentials Required

**Error**: `Admin credentials required!`

**Solution**:
1. Set environment variables (Windows PowerShell):
   ```powershell
   $env:ADMIN_EMAIL="your@email.com"
   $env:ADMIN_PASSWORD="yourpassword"
   ```

2. Or pass credentials as arguments:
   ```bash
   node scripts/validate-wallet-addresses-client.js <userId> <email> <password>
   ```

3. Make sure your user has `role: "admin"` in Firestore

### Client-Side Version: User Does Not Have Admin Role

**Error**: `User does not have admin role.`

**Solution**:
1. Set your user role to "admin" in Firestore:
   - Go to Firebase Console → Firestore Database → Data
   - Find your user document in the `users` collection
   - Add field: `role` (string) = `admin`

2. Or use the Admin SDK version (bypasses security rules)

### Admin SDK Version: Firebase Admin SDK Credentials Not Found

**Error**: `Firebase Admin SDK credentials not found!`

**Solution**:
1. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable:
   - Windows: `set GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account-key.json`
   - Mac/Linux: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"`

2. Or use gcloud CLI:
   ```bash
   gcloud auth application-default login
   ```

3. **Recommended**: Use the client-side version instead (easier setup)

### @solana/web3.js Package Not Found

**Error**: `Cannot find module '@solana/web3.js'`

**Solution**:
```bash
npm install @solana/web3.js
```

**Note**: This package is already in dependencies, so this error should not occur.

## Best Practices

1. **Always run in dry-run mode first**: Check what will be fixed before making changes
2. **Backup Firestore**: Export your Firestore data before running fixes
3. **Test on a single user**: Test fixes on a single user before running on all users
4. **Monitor logs**: Check the console output for detailed information about each fix

## Integration with Token Issuance

After fixing invalid wallet addresses, the token issuance API (`api/issue-charity-coins.js`) will:
1. Detect empty wallet addresses
2. Create new custodial wallets for users without valid addresses
3. Use existing valid addresses for token transfers
4. Avoid "Provided Owner Is Not Allowed" errors

## Related Files

- `api/issue-charity-coins.js`: Token issuance API (includes wallet validation)
- `scripts/fix-user-profiles.js`: User profile fix utility (Admin SDK version)
- `scripts/fix-user-profiles-client.js`: User profile fix utility (Client SDK version)
- `scripts/validate-wallet-addresses.js`: Wallet validation utility (Admin SDK version)
- `scripts/validate-wallet-addresses-client.js`: Wallet validation utility (Client SDK version - **Recommended**)

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify Firebase Admin SDK credentials are set correctly
3. Ensure @solana/web3.js package is installed
4. Check Firestore security rules allow Admin SDK access

