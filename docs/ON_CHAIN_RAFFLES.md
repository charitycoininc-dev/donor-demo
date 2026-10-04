# On-Chain Raffle Implementation Guide

This document explores how to migrate raffle functionality from Firestore to Solana blockchain for transparency, immutability, and verifiable randomness.

## Current System (Firestore-Based)

### What's Currently Stored Off-Chain:
1. **Current Raffle State** (`raffles/current`):
   - `prizePool`: Total prize amount
   - `autoDrawAmount`: Trigger amount for automatic drawing
   - `globalCoinCounter`: Next coin number to assign
   - `participants`: Number of eligible entries
   - `lastUpdated`: Timestamp

2. **Eligible Coin Numbers** (`raffles/current/eligibleCoinNumbers`):
   - `coinNumber`: Unique coin number
   - `userId`: Owner of the coin
   - `solanaWallet`: User's Solana wallet address

3. **Raffle History** (`raffleHistory`):
   - Winner information
   - Prize pool amount
   - Drawing date
   - Transaction details

### Current Raffle Draw Process:
1. Admin triggers raffle when `prizePool >= autoDrawAmount`
2. System randomly selects from eligible coin numbers
3. Winner is determined from Firestore data
4. Prize is transferred via traditional payment
5. History is stored in Firestore

## Benefits of On-Chain Raffles

1. **Transparency**: All raffle data visible on blockchain
2. **Immutability**: Cannot be altered after creation
3. **Verifiability**: Anyone can verify winners independently
4. **Trustless**: No need to trust admin for fair draws
5. **Automated**: Smart contract can execute draws automatically
6. **Public Randomness**: Can use Solana's VRF (Verifiable Random Function) or chain randomness

## Implementation Options

### Option 1: Solana Program (Smart Contract) - Recommended

**Architecture:**
- Create a Solana program using Anchor framework
- Store raffle state in Program Derived Addresses (PDAs)
- Use on-chain accounts for eligible entries
- Execute draws on-chain with verifiable randomness

**Key Components:**

1. **Raffle Account (PDA)**:
   ```rust
   #[account]
   pub struct Raffle {
       pub authority: Pubkey,           // Admin wallet
       pub prize_pool: u64,            // Prize in lamports (SOL)
       pub auto_draw_amount: u64,      // Trigger amount
       pub global_coin_counter: u64,    // Next coin number
       pub participants: u64,          // Number of entries
       pub status: RaffleStatus,       // Active, Drawing, Closed
       pub created_at: i64,
       pub last_updated: i64,
   }
   ```

2. **Coin Entry Account (PDA)**:
   ```rust
   #[account]
   pub struct CoinEntry {
       pub raffle: Pubkey,             // Raffle this entry belongs to
       pub coin_number: u64,           // Unique coin number
       pub owner: Pubkey,              // User's wallet address
       pub charity_coin_mint: Pubkey,  // Reference to Charity Coin token
       pub created_at: i64,
   }
   ```

3. **Raffle History Account**:
   ```rust
   #[account]
   pub struct RaffleDraw {
       pub raffle: Pubkey,
       pub winner: Pubkey,             // Winner's wallet
       pub winner_coin: u64,           // Winning coin number
       pub prize_amount: u64,
       pub drawn_at: i64,
       pub transaction_signature: String,
   }
   ```

**Program Instructions (Functions):**

1. `initialize_raffle`: Create a new raffle
2. `add_coin_entry`: Register a Charity Coin for raffle eligibility
3. `conduct_draw`: Execute raffle draw using verifiable randomness
4. `update_prize_pool`: Update prize pool from donations
5. `close_raffle`: Finalize raffle

### Option 2: Hybrid Approach

Keep some data on-chain, some off-chain:

- **On-Chain**: Raffle state, eligible entries (coin numbers + wallets), draw results
- **Off-Chain**: User profiles, donation history, detailed transaction logs

**Benefits:**
- Lower on-chain costs
- Faster queries for non-critical data
- Still provides transparency for raffle operations

### Option 3: Minimal On-Chain (Anchor Program Only)

Create a simple Anchor program that:
- Stores only critical raffle state
- Provides verifiable random draws
- Records draw results on-chain
- Keeps all other data in Firestore

## Implementation Steps

### Phase 1: Setup Anchor Project

```bash
# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --force --locked
avm install latest
avm use latest

# Create new Anchor project
anchor init charity-coin-raffle
cd charity-coin-raffle
```

### Phase 2: Define Program Structure

1. Create raffle state accounts
2. Implement entry registration
3. Implement draw logic with randomness
4. Add prize distribution logic

### Phase 3: Deploy to Devnet

```bash
anchor build
anchor deploy --provider.cluster devnet
```

### Phase 4: Frontend Integration

1. Install Anchor client libraries
2. Create API endpoints to interact with program
3. Update admin pages to use on-chain raffle data
4. Add transaction signing for raffle operations

### Phase 5: Migration Strategy

1. Dual-write: Write to both Firestore and blockchain during transition
2. Verify on-chain data matches Firestore
3. Switch reads to blockchain
4. Deprecate Firestore raffle storage

## Technical Considerations

### Randomness Source

**Option A: Chain History (Pseudorandom)**
- Use recent blockhash or slot number
- Predictable, not cryptographically secure
- Good for low-stakes raffles

**Option B: Switchboard VRF**
- Verifiable Random Function from Switchboard
- Cryptographically secure
- Requires oracle integration
- Recommended for production

**Option C: Pyth Network**
- Oracle network with randomness
- Secure and verifiable
- Good integration with Solana

### Cost Considerations

**On-Chain Storage Costs:**
- Account creation: ~0.002 SOL per account
- Transaction fees: ~0.000005 SOL per transaction
- Rent: Accounts need rent exemption (SOL locked)

**Example Costs:**
- 1000 coin entries = ~2 SOL in account creation
- Raffle draws = ~0.001 SOL per draw
- Monthly rent = Minimal (rent-exempt accounts)

### Transaction Size Limits

- Solana transaction: 1232 bytes max
- May need to batch coin entry registrations
- Use instruction data compression if needed

## Alternative: On-Chain Metadata Approach

Instead of storing individual entries, store:
- Merkle tree root of all eligible coins
- Verify eligibility off-chain, prove on-chain
- Reduces on-chain storage costs
- More complex verification logic

## Recommended Next Steps

1. **Start Small**: Create a simple proof-of-concept Anchor program
2. **Test Locally**: Use Anchor test framework
3. **Deploy to Devnet**: Test with real transactions
4. **Integrate Gradually**: Start with one raffle on-chain
5. **Measure Performance**: Compare costs and speed
6. **Expand**: Migrate more functionality as needed

## Resources

- **Anchor Documentation**: https://www.anchor-lang.com/
- **Solana Cookbook**: https://solanacookbook.com/
- **Switchboard VRF**: https://docs.switchboard.xyz/
- **Pyth Network**: https://docs.pyth.network/

## Questions to Consider

1. **Priority**: Is transparency more important than cost?
2. **Scale**: How many coin entries per raffle? (affects storage costs)
3. **Frequency**: How often are raffles conducted?
4. **Randomness**: What level of randomness security is needed?
5. **Integration**: How much can we change the existing system?

Would you like me to start by creating a simple Anchor program as a proof-of-concept?
