# Simplified On-Chain Raffle Design (Final)

## Key Simplification

**Removed on-chain `total_entries` tracking** - Calculate from Firestore instead!

### On-Chain State (Minimal)
```rust
pub struct Raffle {
    pub authority: Pubkey,
    pub prize_pool: u64,
    pub auto_draw_amount: u64,
    pub winners: Vec<u64>,        // Only winners stored on-chain
    pub last_draw: Option<i64>,
    pub created_at: i64,
}
```

### Off-Chain (Firestore) - Source of Truth
- Total entries: Count all coin numbers in `coinNumbers` collection
- Display on Raffle page between Prize Pool and Trigger Amount
- Calculate eligible entries = total_entries - winners.len()

## Updated Cost (SOL @ $184)

### One-Time Setup:
- Initialize raffle account: ~0.0002 SOL = **~$0.037**

### Per Operation:
- Update prize pool: ~0.00001 SOL = **~$0.0018**
- Conduct draw: ~0.00001 SOL = **~$0.0018**

### Monthly Example (1000 entries, 50 draws):
- 50 prize pool updates: 0.0005 SOL = **~$0.09**
- 50 draws: 0.0005 SOL = **~$0.09**
- **Total: ~$0.18/month** (vs $368 if storing all entries)

## Implementation Flow

### When Donation Approved:
1. Update Firestore prize pool (existing)
2. Call `/api/update-raffle-state` to update on-chain prize pool
3. **No need to increment entries** - total_entries calculated from Firestore

### When Raffle Triggered:
1. Calculate `total_entries` from Firestore (count coin numbers)
2. Call `/api/conduct-raffle-draw` with `total_entries` parameter
3. On-chain returns winning coin number
4. Lookup wallet in Firestore using coin number
5. Display winner

### Display Total Entries on Raffle Page:
```javascript
// Count all coin numbers from Firestore
const totalEntries = await countCoinNumbers(); // Query Firestore

// Display between Prize Pool and Trigger Amount
<div>
  <span>Total Raffle Entries: {totalEntries}</span>
</div>
```

## Benefits

✅ **Even cheaper**: Removed unnecessary on-chain storage
✅ **Simpler**: Firestore is single source of truth for entries
✅ **More flexible**: Can adjust total_entries calculation logic off-chain
✅ **Transparent**: Prize pool and winners still on-chain for verification

## Updated Program Functions

1. `initialize_raffle(auto_draw_amount)` - Setup only
2. `update_prize_pool(amount)` - Add prize money
3. `conduct_draw(total_entries)` - Draw with entries count as parameter

**Removed**: `increment_entries()` - no longer needed!
