# Simple On-Chain Raffle Explanation

## Your Understanding (100% Correct!)

✅ Each Charity Coin = 1 perpetual raffle entry tied to wallet
✅ Each entry gets unique sequential number (coin number: 1, 2, 3, ...)
✅ Raffle only needs: trigger amount and total entries count
✅ Generate random number → match to coin number → get wallet
✅ No need to store all entries on-chain
✅ Winners can't win again (excluded from future draws)

## How It Works

### Initial Setup
1. **Initialize Raffle**: Set trigger amount (e.g., $100 = 100000000 lamports)
2. **Start with 0 entries**: `total_entries = 0`

### When Coins Are Issued
1. User receives 110 Charity Coins
2. Call `increment_entries(110)` on-chain
3. `total_entries` becomes 110
4. Firestore stores: coin numbers 1-110 mapped to user's wallet
5. **Cost**: ~0.00001 SOL (just updating one number)

### When Donation Approved
1. Prize pool increases (50% of donation)
2. Call `update_prize_pool(amount)` on-chain
3. **Cost**: ~0.00001 SOL

### When Raffle Triggered
1. Check: `prize_pool >= auto_draw_amount`?
2. If yes, call `conduct_draw()` on-chain:
   - Generate random number [1, eligible_entries]
   - Eligible = `total_entries - winners.len()`
   - Map to coin number (skipping winners)
   - Return winning coin number
3. **Off-chain**: Lookup wallet in Firestore using coin number
4. **On-chain**: Add winner to `winners` array, reduce prize pool
5. **Cost**: ~0.00001 SOL per draw

## Example Flow

**Initial State:**
- `total_entries = 1000`
- `winners = []`
- Eligible = 1000 entries (coins 1-1000)

**Draw 1:**
- Random: 523 → Coin #523 wins
- `winners = [523]`
- Eligible = 999 entries

**Draw 2:**
- Random: 523 → Already in winners, retry
- Random: 247 → Coin #247 wins  
- `winners = [523, 247]`
- Eligible = 998 entries

**Draw 100:**
- `winners = [523, 247, ..., 891]` (100 winners)
- Eligible = 900 entries
- Random: 1001 → Out of range, map to 1001st non-winning coin
- Or: Random: 891 → In winners, retry until finds non-winner

## Winner Exclusion Algorithm

```rust
// Generate random index [1, eligible_entries]
let random_index = generate_random(eligible_entries);

// Find the nth non-winning coin number
let mut non_winner_count = 0;
for coin_num in 1..=total_entries {
    if coin_num not in winners {
        non_winner_count += 1;
        if non_winner_count == random_index {
            winner = coin_num;
            break;
        }
    }
}
```

This ensures:
- ✅ Fair distribution (equal chance for all eligible coins)
- ✅ No duplicate winners
- ✅ Deterministic mapping (same random index always maps to same coin)

## Cost Summary

**Setup:**
- Initialize raffle: ~0.0002 SOL (one-time)

**Per Operation:**
- Update prize pool: ~0.00001 SOL (~$0.0002)
- Increment entries: ~0.00001 SOL (~$0.0002)
- Conduct draw: ~0.00001 SOL (~$0.0002)

**Monthly Example (1000 entries, 50 draws):**
- 1000 increment_entries calls: 0.01 SOL
- 50 draws: 0.0005 SOL
- **Total: ~0.01 SOL = $0.20/month**

**Compare to storing entries**: Would be ~2 SOL = $40
**Savings: 200x cheaper!**

## Why This Works

1. **Sequential Coin Numbers**: Coin #1 = entry 1, Coin #2 = entry 2, etc.
2. **No Mapping Needed**: Random number directly corresponds to coin number
3. **Exclusion via Iteration**: Simply skip winners when mapping
4. **Firestore Fast Lookup**: O(1) lookup by coin number (indexed)

This is the most cost-effective approach possible!
