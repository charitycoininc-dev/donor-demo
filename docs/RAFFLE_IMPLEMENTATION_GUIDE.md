# Cost-Effective On-Chain Raffle Implementation Guide

## Overview

This guide implements an on-chain raffle system that minimizes costs by storing only essential data on-chain, while using Firestore for fast lookups.

## Design Principles

1. **Minimal On-Chain Storage**: Only store raffle state and winner history
2. **No Individual Entries**: Don't store each coin entry (saves 99.99% cost)
3. **Off-Chain Lookup**: Use Firestore to map coin numbers to wallets
4. **Deterministic Mapping**: Coin number = entry number (1 to total_entries)

## Architecture

### On-Chain (Solana)
- **Raffle Account**: Prize pool, trigger amount, total entries, winner list
- **Storage Cost**: ~8KB = ~0.0002 SOL (rent-exempt)

### Off-Chain (Firestore)
- **Coin Numbers**: `users/{userId}/coinNumbers/{doc}` → maps coin number to user
- **Lookup**: Fast, free, already exists in your system

### Raffle Flow

```
1. User receives Charity Coins → Firestore stores coin numbers
2. Donation approved → Update on-chain prize pool
3. Raffle triggered → Call on-chain draw instruction
4. On-chain generates random number → Returns winning coin number
5. Lookup wallet → Query Firestore for coin number → wallet mapping
6. Display winner → Show wallet address and user info
```

## Cost Breakdown

### Per Raffle Draw:
- Transaction fee: ~0.00001 SOL (~$0.0002)
- Account update: Included in transaction
- **Total: ~$0.0002 per draw**

### Comparison:
- **Store all entries**: 1000 entries = 2 SOL = $40
- **This approach**: 0.0002 SOL = $0.004
- **Savings: 10,000x cheaper**

## Implementation Files

1. **Anchor Program**: `programs/charity-coin-raffle/src/lib.rs`
   - `initialize_raffle`: Set up new raffle
   - `update_prize_pool`: Add prize money from donations
   - `increment_entries`: Add new coin entries
   - `conduct_draw`: Execute raffle draw

2. **API Endpoints**:
   - `api/conduct-raffle-draw.js`: Trigger on-chain draw
   - `api/update-raffle-state.js`: Update prize pool/entries

3. **Helper Scripts**:
   - `scripts/get-coin-wallet-mapping.js`: Map coin numbers to wallets

## Next Steps

1. **Set up Anchor project**:
   ```bash
   anchor init charity-coin-raffle
   ```

2. **Deploy program to devnet**:
   ```bash
   anchor build
   anchor deploy --provider.cluster devnet
   ```

3. **Integrate with existing system**:
   - Update `DataManagement.jsx` to call on-chain updates
   - Add raffle draw button that calls on-chain draw
   - Update winner display to show on-chain transaction

4. **Test thoroughly**:
   - Test random number generation
   - Verify winner exclusion logic
   - Test with multiple draws

## Randomness Options

**For MVP (Recommended):**
- Use blockhash-based randomness (free, included in program)
- Simple, works immediately
- Good enough for most use cases

**For Production:**
- Upgrade to Switchboard VRF (~$0.20 per draw)
- Or Pyth Network randomness (~$0.02 per draw)
- Cryptographically secure

## Winner Exclusion Logic

The raffle account stores a `winners` array. The draw logic:
1. Generates random number [1, total_entries]
2. Skips any numbers in `winners` array
3. Finds next available coin number
4. Adds winner to `winners` array
5. Updates prize pool

This ensures no coin can win twice.

## Integration Points

### When Donation Approved:
```javascript
// Update on-chain prize pool
await fetch('/api/update-raffle-state', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update_prize_pool',
    amount: donationAmount * 0.5 * 1e9, // Convert to lamports
  }),
});

// Increment entries
await fetch('/api/update-raffle-state', {
  method: 'POST',
  body: JSON.stringify({
    action: 'increment_entries',
    count: coinsEarned,
  }),
});
```

### When Raffle Triggered:
```javascript
// Conduct on-chain draw
const result = await fetch('/api/conduct-raffle-draw', {
  method: 'POST',
});

const { winnerCoin, transactionSignature } = await result.json();

// Lookup wallet in Firestore
const winnerInfo = await getWalletForCoinNumber(winnerCoin);

// Display winner with on-chain proof
```

This design gives you maximum transparency with minimal cost!
