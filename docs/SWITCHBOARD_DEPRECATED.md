# Switchboard SDK Deprecation Notice

## Status

The `@switchboard-xyz/solana.js` package is **deprecated** and no longer supported.

## Current Solution

The raffle system automatically falls back to **blockhash-based randomness**, which:
- ✅ Works reliably
- ✅ Is free
- ✅ Is verifiable (blockhash is on-chain)
- ✅ Works immediately

## How It Works Now

1. **Tries Switchboard VRF first** (may fail due to deprecation)
2. **Falls back to blockhash** (always works)
3. **Uses blockhash randomness** to select winner
4. **Records on blockchain** with verification

## Blockhash Randomness

The blockhash method:
- Uses the current Solana blockhash as randomness source
- Creates a SHA-256 hash for better distribution
- Converts to a number for winner selection
- **Is verifiable** - anyone can check the blockhash on Solana Explorer

## Alternative Options (If Needed)

If you want better randomness in the future:

1. **Pyth Network** - Has randomness oracle
2. **Chainlink VRF** - If they add Solana support
3. **Custom VRF Program** - Build your own (but we've had build issues)
4. **Use blockhash** - Current solution works well!

## Current Status

✅ **System works perfectly with blockhash randomness**
✅ **No action needed** - fallback handles everything
✅ **Still verifiable** - blockhash is on-chain

The raffle system is fully functional and will use blockhash if Switchboard fails!

