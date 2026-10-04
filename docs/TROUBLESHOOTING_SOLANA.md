# Troubleshooting Solana Token Issuance

If you're getting errors when approving donations that should create custodial wallets, this guide will help you diagnose and fix the issue.

## Common Error: "Failed to create user token account"

This error typically means the treasury wallet doesn't have enough SOL to pay for transaction fees.

### Check Treasury SOL Balance

Run this command to check the current SOL balance:

```bash
node scripts/check-sol-balance.js
```

### Fund the Treasury Wallet

If the balance is below 0.001 SOL, you need to fund it:

1. **Get the Treasury Wallet Address:**
   ```
   5PvuV2C6ofQHRgxPTFPQBXVC75v1gz3NVivVggyWGFyw
   ```

2. **Fund via Solana CLI (if you have it):**
   ```bash
   solana airdrop 1 5PvuV2C6ofQHRgxPTFPQBXVC75v1gz3NVivVggyWGFyw --url devnet
   ```

3. **Fund via Solana Faucet:**
   - Go to https://faucet.solana.com/
   - Enter the treasury address: `5PvuV2C6ofQHRgxPTFPQBXVC75v1gz3NVivVggyWGFyw`
   - Select "devnet"
   - Request SOL (usually 1-2 SOL per request)

4. **Fund via Phantom/Other Wallet:**
   - Connect your wallet to Solana devnet
   - Send 1-2 SOL to the treasury address above

### Verify the Fix

After funding:
1. Wait 10-30 seconds for the transaction to confirm
2. Check the balance again: `node scripts/check-sol-balance.js`
3. Try approving a donation again

## Other Common Issues

### Error: "Insufficient SOL balance"

**Solution:** Fund the treasury wallet (see above)

### Error: Network timeout

**Solution:** 
- Check your internet connection
- Solana devnet can be slow during peak times
- Wait a few minutes and try again

### Error: "Token account not found" after creation

**Solution:**
- This might be a timing issue
- Wait 10-20 seconds after wallet creation before checking
- The transaction may still be confirming on-chain

## Environment Variables

Make sure `WALLET_ENCRYPTION_KEY` is set in Vercel:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add `WALLET_ENCRYPTION_KEY` with your encryption key
- Make sure it's set for **Production** environment

## Debugging Tips

### Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Go to "Functions" tab
4. Click on `/api/issue-charity-coins`
5. View the logs to see detailed error messages

### Test Locally

If you want to test locally:
```bash
# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Vercel dev server for API routes
vercel dev --listen 3001
```

Then try approving a donation in the admin panel.

## Treasury Wallet Maintenance

The treasury wallet needs to maintain a SOL balance for:
- Creating new token accounts (for custodial wallets)
- Transferring tokens
- Transaction fees (typically 0.000005 SOL per transaction, but more is needed for account creation)

**Recommendation:** Keep at least 0.1 SOL in the treasury wallet for regular operations.
