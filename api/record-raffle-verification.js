import { Connection, Keypair, Transaction, PublicKey, SystemProgram } from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';

// Solana configuration
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Treasury keypair (for signing transactions)
const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];
const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));

// Solana Memo Program (built-in, no deployment needed)
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

/**
 * Record raffle result on-chain using Solana's memo program
 * This creates a verifiable transaction that anyone can check
 * 
 * @param {number} winnerCoin - The winning coin number
 * @param {number} prizeAmount - Prize amount in lamports
 * @param {string} winnerWallet - Winner's Solana wallet address
 * @param {number} raffleRound - Raffle round number
 * @returns {Promise<{success: boolean, signature: string, url: string}>}
 */
export async function recordRaffleVerification(
  winnerCoin,
  prizeAmount,
  winnerWallet,
  raffleRound
) {
  try {
    // Check treasury SOL balance first
    const solBalance = await connection.getBalance(TREASURY_KEYPAIR.publicKey);
    const solBalanceInSol = solBalance / 1e9;
    
    if (solBalanceInSol < 0.001) {
      throw new Error(`Insufficient SOL balance (${solBalanceInSol} SOL). Need at least 0.001 SOL for transaction fees.`);
    }
    
    // Format prize amount from lamports to dollars
    const prizeAmountDollars = (prizeAmount / 1e9).toFixed(2);
    const formattedPrizeAmount = `$${prizeAmountDollars}`;
    
    // Format timestamp as "M/D/YYYY, H:MM:SS AM/PM"
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    
    // Create memo data: JSON string with raffle details
    // Store formatted values for better readability on-chain
    const memoData = JSON.stringify({
      type: 'RAFFLE_WINNER',
      winnerCoin,
      prizeAmount: formattedPrizeAmount, // Formatted as "$250.00"
      prizeAmountLamports: prizeAmount, // Also store raw lamports for reference
      winnerWallet,
      raffleRound,
      timestamp: formattedTimestamp, // Formatted as "11/4/2025, 2:50:23 AM"
      timestampUnix: Date.now(), // Also store Unix timestamp for reference
      network: SOLANA_NETWORK,
    });
    
    // Convert to buffer (Buffer is available in Node.js)
    const memoBuffer = Buffer.from(memoData, 'utf8');
    
    // Check memo size (Solana transaction data limit is ~1232 bytes, memo can be smaller)
    if (memoBuffer.length > 1000) {
      throw new Error(`Memo data too large: ${memoBuffer.length} bytes (max ~1000)`);
    }
    
    // Create transaction with memo instruction
    const transaction = new Transaction();
    
    // Add memo instruction - memo program doesn't require accounts, but we include the signer
    // The memo data is stored in the transaction instruction data
    transaction.add({
      keys: [
        {
          pubkey: TREASURY_KEYPAIR.publicKey,
          isSigner: true,
          isWritable: false,
        },
      ],
      programId: MEMO_PROGRAM_ID,
      data: memoBuffer,
    });
    
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    // Set transaction properties
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = TREASURY_KEYPAIR.publicKey;
    
    // Send and sign transaction (sendTransaction handles signing)
    const signature = await connection.sendTransaction(transaction, [TREASURY_KEYPAIR], {
      skipPreflight: false,
      maxRetries: 3,
    });
    
    // Wait for confirmation with timeout (don't wait too long in serverless)
    try {
      await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight,
        },
        'confirmed'
      );
    } catch (confirmError) {
      // If confirmation times out, still return the signature
      // The transaction might still go through
      console.warn('[RecordRaffle] Confirmation timeout, but transaction was sent:', signature);
    }
    
    const explorerUrl = `https://solscan.io/tx/${signature}?cluster=${SOLANA_NETWORK}`;
    
    console.log(`[RecordRaffle] Transaction sent: ${signature}`);
    console.log(`[RecordRaffle] Explorer: ${explorerUrl}`);
    
    return {
      success: true,
      signature,
      url: explorerUrl,
      message: `Raffle result recorded on-chain. Transaction: ${signature}`,
    };
  } catch (error) {
    console.error('[RecordRaffle] Error:', error);
    console.error('[RecordRaffle] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw new Error(`Failed to record raffle on-chain: ${error.message}`);
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
    const { winnerCoin, prizeAmount, winnerWallet, raffleRound } = req.body;

    if (!winnerCoin || !prizeAmount) {
      return res.status(400).json({
        error: 'Missing required fields: winnerCoin, prizeAmount',
      });
    }

    const result = await recordRaffleVerification(
      winnerCoin,
      prizeAmount,
      winnerWallet || 'N/A',
      raffleRound || 1
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('[RecordRaffle] Handler error:', error);
    console.error('[RecordRaffle] Error stack:', error.stack);
    console.error('[RecordRaffle] Error name:', error.name);
    
    // Return more detailed error information
    return res.status(500).json({
      error: 'Failed to record raffle verification',
      details: error.message,
      type: error.name,
      // Include SOL balance info if it's a balance error
      ...(error.message.includes('SOL balance') ? { 
        hint: 'Fund the treasury wallet with SOL for transaction fees' 
      } : {}),
    });
  }
}

