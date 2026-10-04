import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
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
 * Record donation proof on-chain using Solana's memo program
 * This creates a verifiable transaction that proves a donation was made
 * 
 * @param {string} donationId - Unique donation ID from Firestore
 * @param {number} amount - Donation amount in dollars
 * @param {string} nonprofitName - Name of the nonprofit receiving the donation
 * @param {string} donorWallet - Donor's Solana wallet address
 * @param {string} donorEmail - Donor's email (optional, for verification)
 * @param {number} coinsEarned - Number of charity coins earned
 * @returns {Promise<{success: boolean, signature: string, url: string}>}
 */
export async function recordDonationProof(
  donationId,
  amount,
  nonprofitName,
  donorWallet,
  donorEmail = null,
  coinsEarned = null
) {
  try {
    // Check treasury SOL balance first
    const solBalance = await connection.getBalance(TREASURY_KEYPAIR.publicKey);
    const solBalanceInSol = solBalance / 1e9;
    
    if (solBalanceInSol < 0.001) {
      throw new Error(`Insufficient SOL balance (${solBalanceInSol} SOL). Need at least 0.001 SOL for transaction fees.`);
    }
    
    // Format amount as dollar string
    const formattedAmount = `$${amount.toFixed(2)}`;
    
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
    
    // Create memo data: JSON string with donation proof
    // Store formatted values for better readability on-chain
    const memoData = JSON.stringify({
      type: 'DONATION_PROOF',
      donationId,
      amount: formattedAmount, // Formatted as "$250.00"
      amountRaw: amount, // Also store raw amount for reference
      nonprofitName,
      donorWallet: donorWallet || 'N/A',
      donorEmail: donorEmail || null, // Optional, only if provided
      coinsEarned: coinsEarned || null, // Optional, number of charity coins earned
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
          isWritable: false, // Memo doesn't need writable account
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
      console.warn('[RecordDonation] Confirmation timeout, but transaction was sent:', signature);
    }
    
    const explorerUrl = `https://solscan.io/tx/${signature}?cluster=${SOLANA_NETWORK}`;
    
    console.log(`[RecordDonation] Transaction sent: ${signature}`);
    console.log(`[RecordDonation] Explorer: ${explorerUrl}`);
    
    return {
      success: true,
      signature,
      url: explorerUrl,
      message: `Donation proof recorded on-chain. Transaction: ${signature}`,
    };
  } catch (error) {
    console.error('[RecordDonation] Error:', error);
    console.error('[RecordDonation] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    });
    throw new Error(`Failed to record donation proof on-chain: ${error.message}`);
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
    const { donationId, amount, nonprofitName, donorWallet, donorEmail, coinsEarned } = req.body;

    if (!donationId || !amount || !nonprofitName) {
      return res.status(400).json({
        error: 'Missing required fields: donationId, amount, nonprofitName',
      });
    }

    const result = await recordDonationProof(
      donationId,
      amount,
      nonprofitName,
      donorWallet || 'N/A',
      donorEmail || null,
      coinsEarned || null
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('[RecordDonation] Handler error:', error);
    console.error('[RecordDonation] Error stack:', error.stack);
    console.error('[RecordDonation] Error name:', error.name);
    
    // Return more detailed error information
    return res.status(500).json({
      error: 'Failed to record donation proof',
      details: error.message,
      type: error.name,
      // Include SOL balance info if it's a balance error
      ...(error.message.includes('SOL balance') ? { 
        hint: 'Fund the treasury wallet with SOL for transaction fees' 
      } : {}),
    });
  }
}

