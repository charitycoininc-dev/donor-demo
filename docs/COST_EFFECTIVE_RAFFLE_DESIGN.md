# Cost-Effective On-Chain Raffle Design

## Core Principle: Minimal On-Chain Storage

**Store on-chain:**
- Raffle state (trigger amount, total entries, prize pool)
- Winner history (list of winning coin numbers)
- Last draw timestamp

**Don't store on-chain:**
- Individual raffle entries (cost prohibitive at scale)
- Coin number → wallet mapping (keep in Firestore for fast lookup)

## Architecture: Perfect for Your Requirements

### Design Principles
- ✅ **Coin Number = Entry Number**: Sequential mapping (1, 2, 3, ... total_entries)
- ✅ **No Entry Storage**: Don't store individual entries (saves 99.99% cost)
- ✅ **Off-Chain Mapping**: Use Firestore for coin number → wallet lookup
- ✅ **Winner Exclusion**: Built-in retry logic to skip prior winners
- ✅ **Minimal Cost**: Only store raffle state and winner list

### Raffle Account (Single PDA) - Simplified
```rust
#[account]
pub struct Raffle {
    pub authority: Pubkey,           // Admin wallet
    pub prize_pool: u64,             // Current prize pool in lamports
    pub auto_draw_amount: u64,       // Trigger amount
    pub winners: Vec<u64>,           // List of winning coin numbers (excluded from future draws)
    pub last_draw: Option<i64>,      // Timestamp of last draw
    pub created_at: i64,
}
```

**Key Simplification:**
- ✅ **No `total_entries` on-chain**: Calculate from Firestore by counting coin numbers
- ✅ **Passed as parameter**: `total_entries` passed to `conduct_draw()` function
- ✅ **Firestore is source of truth**: Display total entries on Raffle page from Firestore

**Storage Cost:** 
- Base account: ~85 bytes
- Winners array: ~8 bytes per winner
- For 1000 winners: ~8KB = ~0.0002 SOL (rent-exempt threshold)
- **Note**: SOL price is currently ~$184, so ~$0.037 for account storage

### Winner History (Optional Separate Account)
```rust
#[account]
pub struct RaffleDraw {
    pub raffle: Pubkey,              // Reference to raffle
    pub draw_number: u32,            // Sequential draw number
    pub winner_coin: u64,             // Winning coin number
    pub prize_amount: u64,            // Prize won
    pub drawn_at: i64,                // Timestamp
    pub transaction: String,          // Transaction signature
}
```

## Raffle Draw Process

### Step 1: Determine Eligibility
- Check `prize_pool >= auto_draw_amount`
- Get `total_entries` from raffle account
- Get `winners` list to exclude

### Step 2: Generate Random Number (On-Chain)
```rust
// Generate random index in [1, eligible_entries]
let random_index = (seed % eligible_entries) + 1;

// Map index to coin number, skipping winners
// Iterate through coin numbers 1..total_entries, counting non-winners
// When count == random_index, that's our winner
let candidate = map_index_to_coin_number(random_index, winners);
```

### Step 3: Verify Winner Not in Prior Winners
- Check if `candidate` is in `winners` array
- If yes, generate new random number (retry)
- If no, proceed with winner

### Step 4: Map Coin Number to Wallet (Off-Chain)
- Coin number is the result from on-chain draw
- Query Firestore: `coinNumbers` collection group where `coinNumber == winner`
- Get wallet address from user document
- This is fast and doesn't cost SOL

### Step 4: Verify & Store Winner (On-Chain)
- Store winning coin number in `winners` array
- Update prize pool
- Emit event with winner wallet (from off-chain lookup)

## Cost Analysis

### Per Raffle Draw:
- **Transaction fee**: ~0.000005 SOL (base fee)
- **Account write**: Included in transaction
- **Total per draw**: ~0.00001 SOL (~$0.0018 at $184/SOL)

### Per Winner Stored:
- Appending to `winners` array: Minimal (part of account update)
- If storing separate draw history: ~0.0002 SOL per winner

### Comparison:
- **Store all entries on-chain**: 1000 entries = 1000 accounts = 2 SOL = **$368**
- **Simplified approach** (this design): Raffle account = 0.0002 SOL = **$0.037**
- **Per draw**: 0.00001 SOL = **$0.0018**

**Savings: 99.99% reduction in storage costs**

## Implementation Strategy

### Phase 1: Simple Anchor Program

1. **Initialize Raffle**:
   ```rust
   pub fn initialize_raffle(
       ctx: Context<InitializeRaffle>,
       auto_draw_amount: u64,
   ) -> Result<()>
   ```

2. **Update Prize Pool** (when donation approved):
   ```rust
   pub fn update_prize_pool(
       ctx: Context<UpdatePrizePool>,
       amount: u64,  // Additional prize money
   ) -> Result<()>
   ```

3. **Update Total Entries** (when coins issued):
   ```rust
   pub fn increment_entries(
       ctx: Context<IncrementEntries>,
       count: u64,  // Number of new coin entries
   ) -> Result<()>
   ```

4. **Conduct Draw**:
   ```rust
   pub fn conduct_draw(
       ctx: Context<ConductDraw>,
   ) -> Result<u64>  // Returns winning coin number
   ```

### Phase 2: Randomness Options

**Option A: Blockhash-Based (Cheapest)**
- Use recent slot/blockhash
- Deterministic but unpredictable before execution
- Cost: $0 (uses existing transaction data)
- Security: Medium (predictable in same slot, but raffle is atomic)

**Option B: Switchboard VRF (Most Secure)**
- Verifiable Random Function
- Cryptographically secure
- Cost: ~0.01 SOL per request (~$0.20)
- Recommended for production with high stakes

**Option C: Pyth Network Randomness**
- Oracle-provided randomness
- Secure and verifiable
- Cost: ~0.001 SOL per request (~$0.02)
- Good middle ground

**Recommendation for MVP**: Start with Option A (blockhash), upgrade to Option C or B if needed.

### Phase 3: Integration

**Frontend Flow:**
1. Admin triggers raffle draw
2. Call `conduct_draw` instruction
3. Get winning coin number from transaction
4. Query Firestore to get wallet address: `coinNumbers/{coinNumber}`
5. Display winner and update UI

**Backend API Flow:**
```javascript
// Pseudo-code
async function conductRaffleDraw() {
  // 1. Check on-chain raffle state
  const raffle = await program.account.raffle.fetch(rafflePDA);
  
  // 2. Call on-chain draw instruction
  const tx = await program.methods
    .conductDraw()
    .accounts({ raffle: rafflePDA, authority: adminWallet })
    .rpc();
  
  // 3. Parse transaction logs for winning coin number
  const winnerCoin = parseWinnerFromTx(tx);
  
  // 4. Lookup wallet in Firestore
  const coinDoc = await getCoinNumber(winnerCoin);
  const winnerWallet = coinDoc.walletAddress;
  
  // 5. Update Firestore with winner info
  await recordWinner(winnerCoin, winnerWallet, tx);
}
```

## Winner Exclusion Logic

The `winners` array in the raffle account stores all prior winning coin numbers. During draw:

```rust
// Pseudocode
let eligible_range = total_entries - winners.len();
let random_index = generate_random(eligible_range);
let candidate_coin = map_index_to_coin(random_index, winners);

// If candidate is in winners list, retry (shouldn't happen with proper mapping)
```

**Better approach**: Map random number to a "skipping" index that excludes winners:
```rust
// Generate random in [1, total_entries]
// Find the nth non-winning coin number
let mut candidate = random_number;
for &winner in winners.iter().sorted() {
    if candidate >= winner {
        candidate += 1;  // Skip this winner
    } else {
        break;
    }
}
```

## Cost-Effective Storage Pattern

### Option 1: Inline Array (Current Raffle Account)
- Store winners directly in raffle account
- Limited by account size (~10KB max)
- Good for: ~1000 winners before needing separate storage

### Option 2: Separate Winner Account (Per Winner)
- Create PDA for each winner
- Unlimited capacity
- Cost: ~0.0002 SOL per winner (~$0.004)
- Good for: Long-term scalability

### Option 3: Merkle Tree of Winners
- Store hash of all winners
- Verify exclusion off-chain
- Minimal on-chain storage
- More complex implementation

**Recommendation**: Start with Option 1 (inline array), migrate to Option 2 when needed.

## Example Transaction Costs

**Scenario: 1000 coin entries, 50 raffle draws**

- **Current (store all entries)**: 1000 accounts × 0.002 SOL = 2 SOL = $40
- **Proposed (minimal)**: 
  - Raffle account: 0.0002 SOL
  - 50 draws: 50 × 0.00001 SOL = 0.0005 SOL
  - Winner storage: 50 × 0.0002 SOL = 0.01 SOL
  - **Total: ~0.01 SOL = $0.20**

**Savings: 200x cheaper**

## Recommended Implementation

1. **Simple Anchor program** with 4 instructions (initialize, update pool, increment entries, draw)
2. **Blockhash-based randomness** (upgradeable later)
3. **Inline winners array** (migrate to separate accounts if needed)
4. **Firestore for coin→wallet lookup** (fast, free, already exists)

This gives you:
- ✅ On-chain transparency
- ✅ Verifiable draws
- ✅ Minimal cost
- ✅ Simple implementation
- ✅ Easy migration path

Would you like me to create the Anchor program code?
