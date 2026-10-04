/**
 * Script to mint Charity Coins to the treasury account
 * Run this once to initially fund the treasury with Charity Coins
 * 
 * Usage: node scripts/mint-charity-coins.js [amount]
 * Example: node scripts/mint-charity-coins.js 1000000
 */

import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { 
  getMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  TOKEN_PROGRAM_ID 
} from '@solana/spl-token';
import { CHARITY_COIN_MINT, TREASURY_KEYPAIR, TREASURY_PUBLIC_KEY } from './solana.config.js';

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

async function mintCharityCoins(amount) {
  try {
    console.log(`[MintCharityCoins] Minting ${amount} Charity Coins to treasury...`);
    console.log(`[MintCharityCoins] Network: ${SOLANA_NETWORK}`);
    console.log(`[MintCharityCoins] Token Mint: ${CHARITY_COIN_MINT.toBase58()}`);
    console.log(`[MintCharityCoins] Treasury: ${TREASURY_PUBLIC_KEY.toBase58()}`);

    // Check if we have mint authority
    const mintInfo = await getMint(connection, CHARITY_COIN_MINT);
    console.log(`[MintCharityCoins] Mint Authority: ${mintInfo.mintAuthority?.toBase58() || 'NULL (Frozen)'}`);
    
    if (!mintInfo.mintAuthority) {
      throw new Error('Token mint authority is null - tokens cannot be minted. The mint may be frozen.');
    }

    // Check if treasury has mint authority
    if (!mintInfo.mintAuthority.equals(TREASURY_PUBLIC_KEY)) {
      console.warn(`[MintCharityCoins] WARNING: Treasury does not have mint authority!`);
      console.warn(`[MintCharityCoins] Mint authority is: ${mintInfo.mintAuthority.toBase58()}`);
      console.warn(`[MintCharityCoins] You may need to use a different wallet to mint.`);
    }

    // Get or create treasury token account
    console.log(`[MintCharityCoins] Getting/creating treasury token account...`);
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      TREASURY_KEYPAIR,
      CHARITY_COIN_MINT,
      TREASURY_PUBLIC_KEY
    );
    console.log(`[MintCharityCoins] Treasury token account: ${treasuryTokenAccount.address.toBase58()}`);

    // Check SOL balance
    const solBalance = await connection.getBalance(TREASURY_PUBLIC_KEY);
    const solBalanceInSol = solBalance / 1e9;
    console.log(`[MintCharityCoins] Treasury SOL balance: ${solBalanceInSol} SOL`);

    if (solBalanceInSol < 0.01) {
      throw new Error(`Insufficient SOL balance (${solBalanceInSol} SOL). Need at least 0.01 SOL for minting transaction.`);
    }

    // Mint tokens to treasury
    console.log(`[MintCharityCoins] Minting ${amount} tokens...`);
    const signature = await mintTo(
      connection,
      TREASURY_KEYPAIR, // payer and signer
      CHARITY_COIN_MINT, // mint
      treasuryTokenAccount.address, // destination token account
      TREASURY_KEYPAIR, // mint authority (must be the payer if treasury has mint authority)
      BigInt(amount) // amount (since decimals = 0, just the number)
    );

    console.log(`[MintCharityCoins] ✅ Mint successful!`);
    console.log(`[MintCharityCoins] Transaction signature: ${signature}`);
    console.log(`[MintCharityCoins] View on Solscan: https://solscan.io/tx/${signature}?cluster=${SOLANA_NETWORK}`);

    // Verify the balance
    const treasuryBalance = await connection.getTokenAccountBalance(treasuryTokenAccount.address);
    console.log(`[MintCharityCoins] Treasury balance after mint: ${treasuryBalance.value.uiAmount} coins`);

    return {
      success: true,
      signature,
      amount,
      treasuryBalance: treasuryBalance.value.uiAmount,
      url: `https://solscan.io/tx/${signature}?cluster=${SOLANA_NETWORK}`
    };

  } catch (error) {
    console.error('[MintCharityCoins] Error:', error);
    console.error('[MintCharityCoins] Error details:', {
      message: error.message,
      name: error.name,
      logs: error.logs
    });
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const amount = process.argv[2] ? parseInt(process.argv[2]) : 1000000; // Default 1 million coins
  
  mintCharityCoins(amount)
    .then((result) => {
      console.log('\n✅ Success:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

export { mintCharityCoins };

