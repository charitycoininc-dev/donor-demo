import { Connection, PublicKey, Keypair, clusterApiUrl } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import anchor from '@project-serum/anchor';
import idl from '../programs/charity-coin-raffle/target/idl/charity_coin_raffle.json';

// Solana configuration
const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Raffle program configuration
const RAFFLE_PROGRAM_ID = new PublicKey('YOUR_RAFFLE_PROGRAM_ID_HERE');
const RAFFLE_SEED = 'raffle';

// Treasury keypair (for signing transactions)
const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];
const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));

/**
 * Find the raffle PDA (Program Derived Address)
 */
async function findRafflePDA(programId) {
  return await PublicKey.findProgramAddress(
    [Buffer.from(RAFFLE_SEED)],
    programId
  );
}

/**
 * Conduct a raffle draw on-chain
 * Uses on-chain total_entries (no parameter needed)
 * Returns the winning coin number and transaction signature
 */
async function conductOnChainDraw() {
  try {
    // Initialize Anchor provider
    const wallet = new Wallet(TREASURY_KEYPAIR);
    const provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
    });

    // Load the program
    const program = new Program(idl, RAFFLE_PROGRAM_ID, provider);

    // Find raffle PDA
    const [rafflePDA] = await findRafflePDA(RAFFLE_PROGRAM_ID);
    console.log(`[ConductDraw] Raffle PDA: ${rafflePDA.toBase58()}`);

    // Fetch current raffle state
    const raffleAccount = await program.account.raffle.fetch(rafflePDA);
    console.log(`[ConductDraw] Current prize pool: ${raffleAccount.prizePool}`);
    console.log(`[ConductDraw] Auto draw amount: ${raffleAccount.autoDrawAmount}`);
    console.log(`[ConductDraw] Total entries (on-chain): ${raffleAccount.totalEntries}`);
    console.log(`[ConductDraw] Prior winners: ${raffleAccount.winners.length}`);

    // Verify draw can be conducted
    if (raffleAccount.prizePool < raffleAccount.autoDrawAmount) {
      throw new Error(
        `Prize pool (${raffleAccount.prizePool}) is less than trigger amount (${raffleAccount.autoDrawAmount})`
      );
    }

    const eligibleEntries = raffleAccount.totalEntries - raffleAccount.winners.length;
    if (eligibleEntries === 0) {
      throw new Error('No eligible entries remaining');
    }

    console.log(`[ConductDraw] Conducting draw with ${eligibleEntries} eligible entries...`);

    // Call the on-chain draw instruction (no parameter - uses on-chain total_entries)
    const txSignature = await program.methods
      .conductDraw()
      .accounts({
        raffle: rafflePDA,
        authority: TREASURY_KEYPAIR.publicKey,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY, // Clock sysvar for randomness
      })
      .rpc();

    console.log(`[ConductDraw] Draw transaction sent: ${txSignature}`);

    // Fetch updated raffle to get winner
    const updatedRaffle = await program.account.raffle.fetch(rafflePDA);
    const latestWinner = updatedRaffle.winners[updatedRaffle.winners.length - 1];

    console.log(`[ConductDraw] Winning coin number: ${latestWinner}`);

    // Parse transaction events to get winner (alternative method)
    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    return {
      success: true,
      winnerCoin: latestWinner,
      prizeAmount: raffleAccount.autoDrawAmount,
      transactionSignature: txSignature,
      transactionUrl: `https://solscan.io/tx/${txSignature}?cluster=${SOLANA_NETWORK}`,
      message: `Raffle draw completed. Winning coin: #${latestWinner}`,
    };
  } catch (error) {
    console.error('[ConductDraw] Error:', error);
    throw error;
  }
}

/**
 * Vercel serverless function handler
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // No parameters needed - uses on-chain total_entries
    const result = await conductOnChainDraw();
    return res.status(200).json(result);
  } catch (error) {
    console.error('[ConductDraw] Handler error:', error);
    return res.status(500).json({
      error: 'Failed to conduct raffle draw',
      details: error.message,
    });
  }
}
