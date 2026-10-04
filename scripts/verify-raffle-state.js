/**
 * Verify On-Chain Raffle State
 * 
 * This script fetches and displays the current on-chain raffle state,
 * allowing you to verify that the blockchain data matches Firestore.
 * 
 * Usage:
 *   node scripts/verify-raffle-state.js
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { Keypair } from '@solana/web3.js';
import idl from '../programs/charity-coin-raffle/target/idl/charity_coin_raffle.json';

// Configuration
const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));
const RAFFLE_PROGRAM_ID = new PublicKey('YOUR_RAFFLE_PROGRAM_ID_HERE'); // Replace with your deployed program ID
const RAFFLE_SEED = 'raffle';

// Treasury keypair (only needed for signing, not needed for reading)
const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];
const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));

/**
 * Find the PDA for the raffle account
 */
function findRafflePDA(programId) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(RAFFLE_SEED)],
    programId
  );
}

/**
 * Format lamports to SOL
 */
function lamportsToSol(lamports) {
  return lamports / 1e9;
}

/**
 * Format timestamp to readable date
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp * 1000).toISOString();
}

/**
 * Verify on-chain raffle state
 */
async function verifyRaffleState() {
  try {
    console.log('\n🔍 Verifying On-Chain Raffle State...\n');
    console.log(`Network: ${SOLANA_NETWORK}`);
    console.log(`Program ID: ${RAFFLE_PROGRAM_ID.toBase58()}\n`);

    // Initialize Anchor provider (read-only, using dummy keypair)
    const wallet = new Wallet(TREASURY_KEYPAIR);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    // Load the program
    const program = new Program(idl, RAFFLE_PROGRAM_ID, provider);

    // Find raffle PDA
    const [rafflePDA, bump] = findRafflePDA(RAFFLE_PROGRAM_ID);
    console.log(`📍 Raffle PDA: ${rafflePDA.toBase58()}`);
    console.log(`   Bump: ${bump}`);
    console.log(`   View on Solscan: https://solscan.io/account/${rafflePDA.toBase58()}?cluster=${SOLANA_NETWORK}\n`);

    // Fetch current raffle state
    console.log('📊 Fetching raffle account data...\n');
    const raffleAccount = await program.account.raffle.fetch(rafflePDA);

    // Display raffle state
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    RAFFLE STATE');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`Authority:          ${raffleAccount.authority.toBase58()}`);
    console.log(`\nPrize Pool:         ${lamportsToSol(raffleAccount.prizePool)} SOL (${raffleAccount.prizePool.toLocaleString()} lamports)`);
    console.log(`Auto Draw Amount:   ${lamportsToSol(raffleAccount.autoDrawAmount)} SOL (${raffleAccount.autoDrawAmount.toLocaleString()} lamports)`);
    console.log(`Total Entries:      ${raffleAccount.totalEntries.toLocaleString()}`);
    
    // Calculate eligible entries
    const eligibleEntries = raffleAccount.totalEntries - raffleAccount.winners.length;
    console.log(`\nEligible Entries:   ${eligibleEntries.toLocaleString()} (${raffleAccount.totalEntries.toLocaleString()} total - ${raffleAccount.winners.length} winners)`);
    
    console.log(`\nWinners Count:      ${raffleAccount.winners.length}`);
    if (raffleAccount.winners.length > 0) {
      console.log(`Winning Coins:      ${raffleAccount.winners.slice(0, 10).join(', ')}${raffleAccount.winners.length > 10 ? ` ... (${raffleAccount.winners.length} total)` : ''}`);
    }
    
    console.log(`\nLast Draw:          ${formatTimestamp(raffleAccount.lastDraw)}`);
    console.log(`Created At:         ${formatTimestamp(raffleAccount.createdAt)}`);

    // Status indicators
    console.log('\n───────────────────────────────────────────────────────────');
    console.log('                    STATUS CHECKS');
    console.log('───────────────────────────────────────────────────────────\n');

    const canDraw = raffleAccount.prizePool >= raffleAccount.autoDrawAmount;
    const hasEntries = eligibleEntries > 0;
    
    console.log(`Can Conduct Draw:   ${canDraw ? '✅ YES' : '❌ NO'} (Prize pool ${canDraw ? '≥' : '<'} trigger amount)`);
    console.log(`Has Eligible Entries: ${hasEntries ? '✅ YES' : '❌ NO'}`);
    
    if (canDraw && hasEntries) {
      console.log('\n🎰 Raffle is ready to be drawn!');
    } else if (!canDraw) {
      console.log(`\n💰 Need ${lamportsToSol(raffleAccount.autoDrawAmount - raffleAccount.prizePool).toFixed(4)} more SOL to trigger draw`);
    } else if (!hasEntries) {
      console.log('\n⚠️  No eligible entries remaining');
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Return data for programmatic use
    return {
      rafflePDA: rafflePDA.toBase58(),
      authority: raffleAccount.authority.toBase58(),
      prizePool: {
        lamports: raffleAccount.prizePool.toString(),
        sol: lamportsToSol(raffleAccount.prizePool),
      },
      autoDrawAmount: {
        lamports: raffleAccount.autoDrawAmount.toString(),
        sol: lamportsToSol(raffleAccount.autoDrawAmount),
      },
      totalEntries: raffleAccount.totalEntries.toString(),
      eligibleEntries: eligibleEntries.toString(),
      winnersCount: raffleAccount.winners.length,
      winners: raffleAccount.winners.map(w => w.toString()),
      lastDraw: raffleAccount.lastDraw ? formatTimestamp(raffleAccount.lastDraw) : null,
      createdAt: formatTimestamp(raffleAccount.createdAt),
      canDraw,
      hasEntries,
      solscanUrl: `https://solscan.io/account/${rafflePDA.toBase58()}?cluster=${SOLANA_NETWORK}`,
    };

  } catch (error) {
    console.error('\n❌ Error verifying raffle state:', error.message);
    
    if (error.message.includes('Account does not exist')) {
      console.error('\n💡 The raffle account has not been initialized on-chain.');
      console.error('   Run the initialize_raffle instruction first.');
    } else if (error.message.includes('Invalid program id')) {
      console.error('\n💡 Please update RAFFLE_PROGRAM_ID with your deployed program ID.');
    } else {
      console.error('\n💡 Make sure:');
      console.error('   1. The raffle program is deployed to', SOLANA_NETWORK);
      console.error('   2. RAFFLE_PROGRAM_ID is correct');
      console.error('   3. The raffle account has been initialized');
    }
    
    throw error;
  }
}

// Run verification
verifyRaffleState()
  .then((data) => {
    console.log('✅ Verification complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  });


