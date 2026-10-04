# On-Chain Raffle Setup Guide

## Cost-Effective Design Summary

✅ **Minimal On-Chain Storage**: Only raffle state and winner list
✅ **No Individual Entries**: Don't store coin entries on-chain (saves 99.99% cost)
✅ **Sequential Mapping**: Coin number = entry number (1, 2, 3, ... total_entries)
✅ **Off-Chain Lookup**: Use Firestore to map coin numbers to wallets
✅ **Winner Exclusion**: Built-in logic to prevent duplicate winners

## Cost Per Raffle Draw

- **Transaction fee**: ~0.00001 SOL (~$0.0002)
- **Account storage**: Already rent-exempt (~0.0002 SOL one-time)
- **Total per draw**: ~$0.0002

Compare to storing all entries on-chain: **10,000x cheaper**

## Quick Start

### 1. Install Anchor

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --force --locked
avm install latest
avm use latest
```

### 2. Initialize Project

```bash
# Already created: programs/charity-coin-raffle/
cd programs/charity-coin-raffle
anchor build
```

### 3. Update Program ID

1. Build the program: `anchor build`
2. Copy the generated program ID
3. Update `programs/charity-coin-raffle/src/lib.rs` with your program ID
4. Update `Anchor.toml` with your program ID

### 4. Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

### 5. Update API Endpoints

Update `api/conduct-raffle-draw.js` and `api/update-raffle-state.js` with:
- Your deployed program ID
- Your program's IDL (generated in `target/idl/`)

## Integration Points

### When Donation is Approved

Add these calls to `src/pages/Admin/DataManagement.jsx`:

```javascript
// After updating prize pool in Firestore
const prizePoolLamports = Math.floor((amount * 0.5) * 1e9); // Convert to lamports

await fetch('/api/update-raffle-state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'update_prize_pool',
    amount: prizePoolLamports,
  }),
});

// After incrementing coin counter
await fetch('/api/update-raffle-state', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'increment_entries',
    count: coinsEarned,
  }),
});
```

### When Raffle is Triggered

Replace the current `conductMultipleRaffles` function with on-chain draws:

```javascript
// Check if draw should be triggered
if (prizePool >= autoDrawAmount) {
  const drawResult = await fetch('/api/conduct-raffle-draw', {
    method: 'POST',
  });
  
  const { winnerCoin, transactionSignature } = await drawResult.json();
  
  // Lookup wallet in Firestore
  const winnerWallet = await getWalletForCoinNumber(winnerCoin);
  
  // Record winner in Firestore history
  await addDoc(collection(db, 'raffleHistory'), {
    winnerCoin,
    winnerWallet,
    prizeAmount: autoDrawAmount,
    transactionSignature,
    drawnAt: serverTimestamp(),
  });
}
```

## How It Works

1. **Coin Assignment**: When Charity Coins are issued, increment `total_entries` on-chain
2. **Prize Updates**: When donations approved, update `prize_pool` on-chain
3. **Draw Execution**: 
   - Generate random number [1, eligible_entries]
   - Map to coin number, skipping winners
   - Return winning coin number
4. **Winner Lookup**: Query Firestore `coinNumbers` collection for wallet
5. **Exclusion**: Winning coin added to `winners` array, excluded from future draws

## Randomness

**MVP**: Blockhash-based (free, included)
- Uses slot + timestamp for seed
- Deterministic but unpredictable before execution
- Good enough for most use cases

**Production**: Can upgrade to Switchboard VRF or Pyth Network
- More secure
- Costs ~$0.20 or ~$0.02 per draw respectively

## Testing

1. Deploy program to devnet
2. Initialize raffle
3. Add test entries and prize pool
4. Conduct test draws
5. Verify winner exclusion works

See `docs/RAFFLE_IMPLEMENTATION_GUIDE.md` for detailed instructions.
