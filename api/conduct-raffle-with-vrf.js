import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { clusterApiUrl } from '@solana/web3.js';

// Solana configuration
const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Treasury keypair
const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];
const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));

/**
 * Option 1: Use Switchboard VRF for Verifiable Randomness
 * 
 * This uses Switchboard's already-deployed program (no building needed!)
 * Gets verifiable random number from oracle
 */
async function getRandomnessFromSwitchboard() {
  try {
    // Note: @switchboard-xyz/solana.js is deprecated
    // This may not work - will fallback to blockhash if it fails
    const { SwitchboardProgram } = await import('@switchboard-xyz/solana.js');
    
    // Initialize Switchboard program
    const switchboardProgram = await SwitchboardProgram.load(
      connection,
      TREASURY_KEYPAIR,
      {
        cluster: SOLANA_NETWORK,
      }
    );
    
    // Request randomness from VRF
    // This creates a VRF account and requests randomness
    const vrfAccount = await switchboardProgram.createVrfAccount({
      name: 'CharityCoinRaffle',
    });
    
    // Request randomness
    await vrfAccount.requestRandomness();
    
    // Wait for result (usually takes 10-30 seconds)
    const randomValue = await vrfAccount.waitForResult();
    
    return {
      randomValue: randomValue.toString(),
      vrfAccount: vrfAccount.publicKey.toBase58(),
      verified: true,
    };
  } catch (error) {
    console.error('[VRF] Switchboard error (package may be deprecated):', error);
    throw new Error(`Switchboard VRF failed: ${error.message}. Package is deprecated, using blockhash fallback.`);
  }
}

/**
 * Option 2: Use Pyth Network for Randomness (Lower Cost)
 */
async function getRandomnessFromPyth() {
  try {
    // Install: npm install @pythnetwork/pyth-solana-js
    const pyth = await import('@pythnetwork/pyth-solana-js');
    
    // Pyth provides randomness through their oracle
    // Implementation would depend on their SDK
    // This is a placeholder - check Pyth docs for exact API
    
    throw new Error('Pyth implementation needed - check their docs');
  } catch (error) {
    console.error('[VRF] Pyth error:', error);
    throw error;
  }
}

/**
 * Option 3: Use Chain Blockhash for Pseudorandom (Free, Works Reliably)
 * 
 * This uses the current blockhash as randomness source
 * Not as secure as VRF but works immediately and reliably
 */
async function getRandomnessFromBlockhash() {
  try {
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    
    // Convert blockhash to number for randomness
    // Blockhash is base58 string, we'll use it as a seed
    // Create a hash of the blockhash for better distribution
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(blockhash).digest();
    
    // Convert first 8 bytes to BigInt
    const randomValue = BigInt('0x' + hash.slice(0, 8).toString('hex'));
    
    return {
      randomValue: randomValue.toString(),
      blockhash,
      verified: true, // Verifiable by checking the blockhash on-chain
      note: 'Uses blockhash - verifiable on Solana explorer',
    };
  } catch (error) {
    console.error('[Randomness] Blockhash error:', error);
    throw error;
  }
}

/**
 * Conduct raffle with on-chain randomness
 * 
 * @param {number} eligibleEntries - Number of eligible entries
 * @param {Array<number>} priorWinners - List of prior winning coin numbers
 * @param {number} totalEntries - Total coin numbers
 * @returns {Promise<{winnerCoin: number, randomnessProof: string, method: string}>}
 */
async function conductRaffleWithOnChainRandomness(
  eligibleEntries,
  priorWinners,
  totalEntries,
  useBlockhash = false
) {
  try {
    // Try to get randomness from Switchboard VRF first (unless blockhash is forced)
    let randomness;
    let method = 'switchboard-vrf';
    
    if (useBlockhash) {
      // Use blockhash if explicitly requested
      randomness = await getRandomnessFromBlockhash();
      method = 'blockhash';
    } else {
      try {
        randomness = await getRandomnessFromSwitchboard();
      } catch (switchboardError) {
        console.warn('[Raffle] Switchboard failed, using blockhash:', switchboardError.message);
        // Fallback to blockhash if Switchboard fails
        randomness = await getRandomnessFromBlockhash();
        method = 'blockhash';
      }
    }
    
    // Convert random value to index in eligible entries
    const randomIndex = BigInt(randomness.randomValue) % BigInt(eligibleEntries);
    const winnerIndex = Number(randomIndex);
    
    // Map index to coin number, skipping prior winners
    const priorWinnersSet = new Set(priorWinners);
    let nonWinnerCount = 0;
    let winnerCoin = null;
    
    for (let coinNum = 1; coinNum <= totalEntries; coinNum++) {
      if (!priorWinnersSet.has(coinNum)) {
        if (nonWinnerCount === winnerIndex) {
          winnerCoin = coinNum;
          break;
        }
        nonWinnerCount++;
      }
    }
    
    if (!winnerCoin) {
      throw new Error('Failed to select winner from eligible entries');
    }
    
    return {
      winnerCoin,
      randomnessProof: randomness.randomValue,
      randomnessMethod: method,
      vrfAccount: randomness.vrfAccount || null,
      blockhash: randomness.blockhash || null,
    };
  } catch (error) {
    console.error('[ConductRaffle] Error:', error);
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
    const { eligibleEntries, priorWinners, totalEntries, useBlockhash } = req.body;

    if (!eligibleEntries || !totalEntries) {
      return res.status(400).json({
        error: 'Missing required fields: eligibleEntries, totalEntries',
      });
    }

    const result = await conductRaffleWithOnChainRandomness(
      eligibleEntries,
      priorWinners || [],
      totalEntries,
      useBlockhash || false
    );

    return res.status(200).json({
      success: true,
      ...result,
      message: `Raffle conducted using ${result.randomnessMethod}`,
    });
  } catch (error) {
    console.error('[ConductRaffle] Handler error:', error);
    return res.status(500).json({
      error: 'Failed to conduct raffle',
      details: error.message,
    });
  }
}

