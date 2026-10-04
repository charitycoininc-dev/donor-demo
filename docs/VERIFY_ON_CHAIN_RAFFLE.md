# How to Verify On-Chain Raffle Data

This guide shows you how to verify that your on-chain raffle state matches your Firestore data and ensure everything is working correctly.

## Quick Verification Script

Run the verification script to see the current on-chain raffle state:

```bash
node scripts/verify-raffle-state.js
```

This will display:
- ✅ Current prize pool (in SOL and lamports)
- ✅ Auto draw trigger amount
- ✅ Total entries count
- ✅ Eligible entries (total - winners)
- ✅ List of winning coin numbers
- ✅ Last draw timestamp
- ✅ Whether a draw can be conducted

## Manual Verification via Solscan

### 1. Find Your Raffle Account Address (PDA)

The raffle account is a Program Derived Address (PDA) calculated from:
- Program ID: `YOUR_RAFFLE_PROGRAM_ID_HERE`
- Seed: `"raffle"`

You can get the PDA address from:
- The verification script output
- Your application logs when initializing or updating the raffle

### 2. View on Solscan

Visit Solscan and search for your raffle PDA:
- **Devnet**: `https://solscan.io/account/YOUR_RAFFLE_PDA?cluster=devnet`
- **Mainnet**: `https://solscan.io/account/YOUR_RAFFLE_PDA`

On the account page, you'll see:
- **Account Balance**: Should show rent-exempt SOL
- **Owner**: Your raffle program ID
- **Data**: Raw account data (requires Anchor IDL to decode)

### 3. Decode Account Data

To see the decoded raffle state on Solscan:
1. Click on your raffle account
2. Look for the "Data" or "Account Data" section
3. With Anchor, you should see structured data including:
   - `authority`: Admin wallet address
   - `prize_pool`: Current prize pool (lamports)
   - `auto_draw_amount`: Trigger amount (lamports)
   - `total_entries`: Total eligible entries
   - `winners`: Array of winning coin numbers
   - `last_draw`: Timestamp of last draw
   - `created_at`: Creation timestamp

## Comparing On-Chain vs Firestore

### Prize Pool Verification

**On-Chain (Lamports)**:
```bash
node scripts/verify-raffle-state.js
# Look for: Prize Pool: X.XXXX SOL
```

**Firestore**:
- Collection: `raffles/current`
- Field: `prizePool` (in dollars)
- **Conversion**: On-chain stores lamports, Firestore stores dollars
- **Formula**: `Firestore prizePool (in dollars) × 0.5 = Prize pool portion`
- **Note**: Only 50% of donations go to prize pool

**Verification**:
```
On-Chain (lamports) ÷ 1e9 = On-Chain (SOL)
Firestore prizePool × 0.5 ≈ Should match SOL value (at current SOL price)
```

### Total Entries Verification

**On-Chain**:
```bash
node scripts/verify-raffle-state.js
# Look for: Total Entries: X
```

**Firestore**:
- Collection: `raffles/current`
- Field: `globalCoinCounter`
- **Formula**: `On-chain total_entries = Firestore globalCoinCounter - 1`

**Verification**:
```
On-Chain total_entries should equal: (Firestore globalCoinCounter - 1)
```

### Winners Verification

**On-Chain**:
- Stored in `winners` array in raffle account
- Each entry is a coin number that has won

**Firestore**:
- Collection: `raffleHistory`
- Each document has `winningCoinNumber`

**Verification**:
```bash
# Count winners on-chain
node scripts/verify-raffle-state.js | grep "Winners Count"

# Count winners in Firestore
# Query: raffleHistory collection size
```

The counts should match: `raffleAccount.winners.length === raffleHistory.length`

## Programmatic Verification

### Using Node.js Script

```javascript
import { verifyRaffleState } from './scripts/verify-raffle-state.js';

const state = await verifyRaffleState();
console.log('On-chain prize pool:', state.prizePool.sol, 'SOL');
console.log('Eligible entries:', state.eligibleEntries);
```

### Using Solana Web3.js Directly

```javascript
import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet } from '@project-serum/anchor';
import idl from './programs/charity-coin-raffle/target/idl/charity_coin_raffle.json';

const connection = new Connection(clusterApiUrl('devnet'));
const programId = new PublicKey('YOUR_RAFFLE_PROGRAM_ID_HERE');
const program = new Program(idl, programId, provider);

// Find PDA
const [rafflePDA] = PublicKey.findProgramAddressSync(
  [Buffer.from('raffle')],
  programId
);

// Fetch state
const raffleAccount = await program.account.raffle.fetch(rafflePDA);
console.log('Prize Pool:', raffleAccount.prizePool.toString());
console.log('Total Entries:', raffleAccount.totalEntries.toString());
console.log('Winners:', raffleAccount.winners);
```

## Automated Verification (Recommended)

Create a cron job or scheduled task to automatically verify on-chain state matches Firestore:

```javascript
// scripts/auto-verify-raffle.js
import { verifyRaffleState } from './verify-raffle-state.js';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../src/stores/config/firebase.js';

async function autoVerify() {
  // Get on-chain state
  const onChainState = await verifyRaffleState();
  
  // Get Firestore state
  const raffleDoc = await getDoc(doc(db, 'raffles', 'current'));
  const firestoreData = raffleDoc.data();
  
  // Compare
  const onChainTotalEntries = parseInt(onChainState.totalEntries);
  const firestoreTotalEntries = (firestoreData.globalCoinCounter || 1) - 1;
  
  if (onChainTotalEntries !== firestoreTotalEntries) {
    console.error('⚠️  MISMATCH: Total entries differ!');
    console.error(`On-chain: ${onChainTotalEntries}`);
    console.error(`Firestore: ${firestoreTotalEntries}`);
  } else {
    console.log('✅ Total entries match!');
  }
  
  // Add more comparisons as needed...
}

autoVerify();
```

## Troubleshooting

### "Account does not exist" Error

**Cause**: Raffle account hasn't been initialized on-chain.

**Fix**: Initialize the raffle using `initialize_raffle` instruction.

### Mismatched Total Entries

**Possible Causes**:
1. On-chain updates haven't been called after new donations
2. Firestore globalCoinCounter was reset but on-chain wasn't
3. Airdrops/volunteer rewards added entries without updating on-chain

**Fix**: Call `/api/update-raffle-entries` with correct `totalEntries` value.

### Mismatched Prize Pool

**Possible Causes**:
1. Prize pool updates failed silently
2. Network issues during update
3. Conversion errors (lamports vs SOL vs dollars)

**Fix**: 
- Check API logs for failed updates
- Manually sync using `/api/update-raffle-state`
- Verify conversion logic (50% of donation → prize pool)

### Winners Don't Match

**Possible Causes**:
1. Raffle history wasn't synced to Firestore
2. Old winners in on-chain state
3. Reset operations only cleared Firestore

**Fix**: Ensure reset operations update both Firestore AND on-chain state.

## Best Practices

1. **Regular Verification**: Run verification script after major operations
2. **Automated Checks**: Set up automated verification in CI/CD
3. **Logging**: Log on-chain state after updates for audit trail
4. **Error Handling**: If mismatches found, investigate immediately
5. **Documentation**: Keep record of expected vs actual state

## Viewing Transaction History

To see all raffle-related transactions:

1. **On Solscan**: Search for your raffle PDA and view "Transactions" tab
2. **Filter by Program**: Search for transactions involving your program ID
3. **Look for**:
   - `initialize_raffle`: Initial setup
   - `update_prize_pool`: Prize pool updates
   - `update_total_entries`: Entry count updates
   - `conduct_draw`: Raffle draws

Each transaction includes:
- Transaction signature (clickable link to Solscan)
- Accounts involved
- Instruction data
- Timestamp

This gives you a complete audit trail of all raffle operations!

