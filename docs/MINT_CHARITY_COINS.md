# How to Mint Charity Coins to Treasury

## Problem

If you're seeing errors when issuing Charity Coins and no transactions appear on Solscan, it's likely because **the treasury account doesn't have any Charity Coins yet**. The system transfers tokens from the treasury to users, so the treasury must be funded first.

## Solution: Mint Tokens to Treasury

### Option 1: Use the Mint Script (Recommended)

I've created a script to mint Charity Coins to the treasury:

```bash
node scripts/mint-charity-coins.js [amount]
```

Example:
```bash
node scripts/mint-charity-coins.js 1000000
```

This will mint 1,000,000 Charity Coins to the treasury account.

### Option 2: Manual Minting via Solana CLI

If the script doesn't work, you can mint manually:

1. **Check the mint authority**:
```bash
spl-token display C2d1xNx5cvQX7eeQQa1rQtSdQL5iCykYMEwWZgNTDyUr
```

2. **If treasury has mint authority, mint tokens**:
```bash
spl-token mint C2d1xNx5cvQX7eeQQa1rQtSdQL5iCykYMEwWZgNTDyUr [amount] [treasury-token-account-address]
```

3. **If treasury doesn't have mint authority**, you'll need to:
   - Use the wallet that has mint authority, OR
   - Transfer mint authority to the treasury wallet first

### Option 3: Check Token Mint Status

First, verify the token exists and check its mint authority:

```bash
# Check token info
spl-token display C2d1xNx5cvQX7eeQQa1rQtSdQL5iCykYMEwWZgNTDyUr

# Check treasury token account balance
spl-token accounts --owner [treasury-public-key]
```

## Troubleshooting

### "Mint authority is null"
The token mint has been frozen (mint authority revoked). You'll need to:
- Create a new token with mint authority, OR
- Use a different token that still has mint authority

### "Insufficient SOL balance"
The treasury wallet needs SOL to pay for transaction fees:
```bash
# Airdrop SOL to treasury (devnet only)
solana airdrop 1 [treasury-public-key] --url devnet
```

### "Transfer failed"
If transfers are failing:
1. Verify treasury has tokens: Check balance on Solscan
2. Verify treasury has SOL: Check SOL balance
3. Check transaction logs: Look at the error details in the API response

## Verification

After minting, verify on Solscan:
1. Go to: `https://solscan.io/token/C2d1xNx5cvQX7eeQQa1rQtSdQL5iCykYMEwWZgNTDyUr?cluster=devnet`
2. Check "Current Supply" - should show the minted amount
3. Check treasury token account balance
4. Try issuing coins to a user and verify the transaction appears

## Next Steps

Once tokens are minted to the treasury:
- ✅ Charity Coin transfers will succeed
- ✅ Transactions will appear on Solscan
- ✅ Token supply will be visible
- ✅ Users will receive their coins

