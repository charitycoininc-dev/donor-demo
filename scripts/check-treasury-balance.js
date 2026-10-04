/**
 * Script to check the treasury wallet's Charity Coin token balance
 */

import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { CHARITY_COIN_MINT, TREASURY_PUBLIC_KEY } from './solana.config.js';

const SOLANA_NETWORK = process.env.SOLANA_NETWORK || 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

async function checkTreasuryBalance() {
  try {
    console.log(`[CheckTreasuryBalance] Checking treasury balance...`);
    console.log(`[CheckTreasuryBalance] Network: ${SOLANA_NETWORK}`);
    console.log(`[CheckTreasuryBalance] Treasury Wallet: ${TREASURY_PUBLIC_KEY.toBase58()}`);
    console.log(`[CheckTreasuryBalance] Token Mint: ${CHARITY_COIN_MINT.toBase58()}`);

    // Check SOL balance first
    const solBalance = await connection.getBalance(TREASURY_PUBLIC_KEY);
    const solBalanceInSol = solBalance / 1e9;
    console.log(`\n[CheckTreasuryBalance] Treasury SOL Balance: ${solBalanceInSol} SOL`);

    // Get the associated token account address
    const treasuryTokenAccountAddress = await getAssociatedTokenAddress(
      CHARITY_COIN_MINT,
      TREASURY_PUBLIC_KEY
    );
    console.log(`[CheckTreasuryBalance] Treasury Token Account: ${treasuryTokenAccountAddress.toBase58()}`);

    // Try to get the token account
    try {
      const tokenAccount = await getAccount(connection, treasuryTokenAccountAddress);
      
      // Get token balance
      const balance = await connection.getTokenAccountBalance(treasuryTokenAccountAddress);
      
      console.log(`\n✅ Token Account Found!`);
      console.log(`[CheckTreasuryBalance] Token Account Balance: ${balance.value.uiAmount} Charity Coins`);
      console.log(`[CheckTreasuryBalance] Raw Balance: ${balance.value.amount} (decimals: ${balance.value.decimals})`);
      console.log(`[CheckTreasuryBalance] Token Account Owner: ${tokenAccount.owner.toBase58()}`);
      console.log(`[CheckTreasuryBalance] Token Account Mint: ${tokenAccount.mint.toBase58()}`);
      
      // View on Solscan
      console.log(`\n[CheckTreasuryBalance] View on Solscan:`);
      console.log(`  Token Account: https://solscan.io/account/${treasuryTokenAccountAddress.toBase58()}?cluster=${SOLANA_NETWORK}`);
      console.log(`  Treasury Wallet: https://solscan.io/account/${TREASURY_PUBLIC_KEY.toBase58()}?cluster=${SOLANA_NETWORK}`);
      console.log(`  Token: https://solscan.io/token/${CHARITY_COIN_MINT.toBase58()}?cluster=${SOLANA_NETWORK}`);

      return {
        success: true,
        solBalance: solBalanceInSol,
        tokenBalance: balance.value.uiAmount,
        rawBalance: balance.value.amount,
        tokenAccountAddress: treasuryTokenAccountAddress.toBase58(),
      };
    } catch (accountError) {
      if (accountError.message.includes('InvalidAccount') || accountError.message.includes('not found')) {
        console.log(`\n❌ Token Account Not Found!`);
        console.log(`[CheckTreasuryBalance] The treasury wallet does not have a token account for Charity Coins yet.`);
        console.log(`[CheckTreasuryBalance] This means no tokens have been transferred to the treasury yet.`);
        console.log(`\n[CheckTreasuryBalance] To fix this:`);
        console.log(`  1. Mint tokens to the treasury`);
        console.log(`  2. Or transfer tokens to: ${treasuryTokenAccountAddress.toBase58()}`);
        
        return {
          success: false,
          solBalance: solBalanceInSol,
          tokenBalance: 0,
          error: 'Token account does not exist',
          tokenAccountAddress: treasuryTokenAccountAddress.toBase58(),
        };
      } else {
        throw accountError;
      }
    }
  } catch (error) {
    console.error('[CheckTreasuryBalance] Error:', error);
    console.error('[CheckTreasuryBalance] Error details:', {
      message: error.message,
      name: error.name,
      logs: error.logs
    });
    throw error;
  }
}

// Run if called directly
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
                     import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule || process.argv[1]?.includes('check-treasury-balance')) {
  checkTreasuryBalance()
    .then((result) => {
      console.log('\n✅ Check complete:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

export { checkTreasuryBalance };
