# Real-Time On-Chain Raffle Sync Analysis

## Current Design (Parameter-Based)

- **Prize Pool**: Updated on-chain when donations approved
- **Total Entries**: Passed as parameter to `conduct_draw()` (calculated from Firestore)

## Proposed Design (Real-Time Sync)

Update on-chain raffle state whenever prize pool or total entries change:
- **Prize Pool**: Update on-chain immediately when donation approved
- **Total Entries**: Update on-chain whenever coins are issued (donations, airdrops, volunteer rewards)

## Usage Scenario

- **100 updates/month**: Mixed prize pool and total entries updates
- **1 raffle draw/month**: On-chain draw execution
- **Total operations**: ~101 transactions/month

## Cost Analysis (SOL @ $184)

### Per Transaction:
- **Update prize pool**: ~0.00001 SOL = **~$0.0018**
- **Update total entries**: ~0.00001 SOL = **~$0.0018**
- **Conduct draw**: ~0.00001 SOL = **~$0.0018**

### Monthly Costs:
- **100 updates**: 100 × 0.00001 SOL = 0.001 SOL = **~$0.18/month**
- **1 draw**: 0.00001 SOL = **~$0.0018/month**
- **Total**: **~$0.18/month**

### Comparison to Current Design:
- **Current**: Only prize pool updates + draws = ~50 × $0.0018 = **~$0.09/month**
- **Proposed**: All updates + draws = 101 × $0.0018 = **~$0.18/month**
- **Difference**: **+$0.09/month** (still extremely affordable!)

## Structure Changes Required

### 1. Anchor Program Updates

```rust
#[account]
pub struct Raffle {
    pub authority: Pubkey,
    pub prize_pool: u64,
    pub auto_draw_amount: u64,
    pub total_entries: u64,           // ADD BACK: Track total entries on-chain
    pub winners: Vec<u64>,
    pub last_draw: Option<i64>,
    pub created_at: i64,
}

// ADD FUNCTION: Update total entries
pub fn update_total_entries(
    ctx: Context<UpdateTotalEntries>,
    total_entries: u64,
) -> Result<()> {
    let raffle = &mut ctx.accounts.raffle;
    raffle.total_entries = total_entries;
    Ok(())
}

// UPDATE: conduct_draw now uses on-chain total_entries
pub fn conduct_draw(ctx: Context<ConductDraw>) -> Result<u64> {
    // Use raffle.total_entries instead of parameter
    // ... rest of logic
}
```

### 2. API Endpoint Updates

**New endpoint**: `/api/update-raffle-entries`
```javascript
// Update total entries on-chain
await fetch('/api/update-raffle-entries', {
  method: 'POST',
  body: JSON.stringify({ totalEntries: newTotal }),
});
```

**Modified**: `/api/conduct-raffle-draw`
```javascript
// No longer needs totalEntries parameter
// Reads directly from on-chain state
await fetch('/api/conduct-raffle-draw', {
  method: 'POST',
  // No body needed - reads from chain
});
```

### 3. Integration Points

**When Donation Approved** (`DataManagement.jsx`):
```javascript
// 1. Update Firestore
await updateDoc(raffleRef, {
  prizePool: newPrizePool,
  globalCoinCounter: newCounter,
});

// 2. Update on-chain prize pool
await fetch('/api/update-raffle-state', {
  method: 'POST',
  body: JSON.stringify({
    action: 'update_prize_pool',
    amount: prizePoolLamports,
  }),
});

// 3. Update on-chain total entries
const totalEntries = newCounter - 1;
await fetch('/api/update-raffle-entries', {
  method: 'POST',
  body: JSON.stringify({ totalEntries }),
});
```

**When Coins Issued Outside Donations** (Airdrops, Volunteer Rewards):
```javascript
// Only update total entries (no prize pool change)
const totalEntries = globalCoinCounter - 1;
await fetch('/api/update-raffle-entries', {
  method: 'POST',
  body: JSON.stringify({ totalEntries }),
});
```

### 4. Frontend Updates

**Raffle Page** (`Raffle.jsx`):
```javascript
// Option 1: Read from on-chain (requires Web3 connection)
const raffle = await program.account.raffle.fetch(rafflePDA);
const totalEligible = raffle.totalEntries - raffle.winners.length;

// Option 2: Continue using Firestore (simpler, no Web3 needed)
// Can still calculate from globalCoinCounter - 1 - winners
```

**Recommendation**: Keep using Firestore for display (faster, no Web3), but on-chain is source of truth for draws.

## Benefits of Real-Time Sync

✅ **Single Source of Truth**: On-chain state always accurate
✅ **Real-Time Transparency**: Anyone can verify current raffle state
✅ **Simpler Draws**: No need to pass total_entries parameter
✅ **Audit Trail**: All changes recorded on blockchain
✅ **Still Cheap**: Only $0.18/month for 100 updates

## Implementation Considerations

### Transaction Failures
- If on-chain update fails, should Firestore update also fail?
- Recommendation: Make Firestore primary, on-chain secondary (async updates)

### Race Conditions
- Multiple donations processed simultaneously
- Solution: Use Firestore transactions, then batch on-chain updates

### Airdrop/Volunteer Scenarios
- May not be tied to specific admin actions
- Solution: Separate endpoint that updates only total_entries

### Cost vs Benefit
- **Cost**: +$0.09/month ($1.08/year)
- **Benefit**: Real-time transparency, simpler draw logic, audit trail
- **Verdict**: Worth it for the added transparency and simplicity

## Recommended Approach

1. **Keep Firestore as primary**: Fast reads, easy queries
2. **Sync to on-chain asynchronously**: Don't block operations on blockchain
3. **On-chain for draws**: Use on-chain state for raffle draws (source of truth)
4. **Fallback logic**: If on-chain fails, use Firestore calculation

This gives you:
- Fast UI updates (Firestore)
- Transparent draws (on-chain)
- Resilient to failures (fallback)
- Affordable cost (~$0.18/month)

## Monthly Cost Summary

| Operation | Frequency | Cost/Op | Monthly Cost |
|-----------|-----------|---------|--------------|
| Prize Pool Update | ~50/month | $0.0018 | $0.09 |
| Total Entries Update | ~50/month | $0.0018 | $0.09 |
| Raffle Draw | 1/month | $0.0018 | $0.002 |
| **Total** | **101 ops** | | **~$0.18/month** |

**Annual Cost**: ~$2.16/year

This is still **170x cheaper** than storing all entries on-chain ($368 vs $2.16)!
