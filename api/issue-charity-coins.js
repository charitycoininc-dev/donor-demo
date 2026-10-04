import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import CryptoJS from 'crypto-js';

// Charity Coin configuration
const CHARITY_COIN_MINT = new PublicKey('C2d1xNx5cvQX7eeQQa1rQtSdQL5iCykYMEwWZgNTDyUr');
const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];

// Use devnet for testing
const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Encryption key - should be set as environment variable in production
// Generate a secure key: crypto.randomBytes(32).toString('hex')
const ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 'default-dev-key-change-in-production-min-32-chars';

// Helper function to encrypt private key using AES-256
function encryptPrivateKey(secretKeyUint8Array) {
  // Convert Uint8Array to hex string for encryption
  const secretKeyHex = Buffer.from(secretKeyUint8Array).toString('hex');
  
  // Encrypt using AES-256
  const encrypted = CryptoJS.AES.encrypt(secretKeyHex, ENCRYPTION_KEY).toString();
  
  return encrypted;
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { userId, coinsToSend, userWalletAddress } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        error: "Missing required field",
        details: "userId is required"
      });
    }

    // Validate and convert coinsToSend to a number
    const coinsToSendNum = typeof coinsToSend === 'string' ? parseInt(coinsToSend, 10) : Number(coinsToSend);
    if (!coinsToSend || isNaN(coinsToSendNum) || coinsToSendNum <= 0) {
      return res.status(400).json({ 
        error: "Invalid coinsToSend",
        details: `coinsToSend must be a positive number. Received: ${coinsToSend} (type: ${typeof coinsToSend})`
      });
    }

    console.log(`[IssueCharityCoins] Processing request for user ${userId}, coins: ${coinsToSendNum}`);

    // Initialize treasury keypair
    const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));
    const TREASURY_PUBLIC_KEY = TREASURY_KEYPAIR.publicKey;

    let walletAddress = userWalletAddress;
    let walletPrivateKey = null;
    let walletCreated = false;

    // If no wallet address provided, create a new custodial wallet
    if (!walletAddress) {
      console.log(`[IssueCharityCoins] Creating new custodial wallet for user ${userId}`);
      const newKeypair = Keypair.generate();
      walletAddress = newKeypair.publicKey.toBase58();
      walletPrivateKey = encryptPrivateKey(newKeypair.secretKey);
      walletCreated = true;
      console.log(`[IssueCharityCoins] New wallet created: ${walletAddress}`);
    } else {
      // Validate the provided wallet address
      walletAddress = walletAddress.trim();
      if (!walletAddress || walletAddress.length === 0) {
        console.log(`[IssueCharityCoins] Empty wallet address provided, creating new custodial wallet for user ${userId}`);
        const newKeypair = Keypair.generate();
        walletAddress = newKeypair.publicKey.toBase58();
        walletPrivateKey = encryptPrivateKey(newKeypair.secretKey);
        walletCreated = true;
        console.log(`[IssueCharityCoins] New wallet created: ${walletAddress}`);
      } else {
        // Validate that the wallet address is a valid Solana public key
        try {
          const testPublicKey = new PublicKey(walletAddress);
          // Verify it's a valid 32-byte public key by checking the base58 encoding
          if (testPublicKey.toBase58() !== walletAddress) {
            throw new Error(`Wallet address validation failed: address mismatch`);
          }
          console.log(`[IssueCharityCoins] Valid wallet address provided: ${walletAddress}`);
        } catch (validationError) {
          console.error(`[IssueCharityCoins] Invalid wallet address provided: ${walletAddress}`);
          console.error(`[IssueCharityCoins] Validation error: ${validationError.message}`);
          throw new Error(
            `Invalid Solana wallet address: "${walletAddress}". ` +
            `Please provide a valid Solana public key (base58 encoded, 32-44 characters). ` +
            `If you don't have a wallet, leave the field empty and one will be created for you.`
          );
        }
      }
    }

    // At this point, walletAddress is guaranteed to be valid
    const userPublicKey = new PublicKey(walletAddress);
    console.log(`[IssueCharityCoins] Using wallet address: ${walletAddress}`);
    console.log(`[IssueCharityCoins] Public key: ${userPublicKey.toBase58()}`);

    // Get or create the treasury's associated token account first
    console.log(`[IssueCharityCoins] Getting/creating treasury token account`);
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      TREASURY_KEYPAIR,
      CHARITY_COIN_MINT,
      TREASURY_PUBLIC_KEY
    );
    console.log(`[IssueCharityCoins] Treasury token account: ${treasuryTokenAccount.address.toBase58()}`);

    // Get or create the user's associated token account
    console.log(`[IssueCharityCoins] Getting/creating token account for user ${walletAddress}`);
    
    // Check treasury SOL balance before attempting to create token account
    const solBalance = await connection.getBalance(TREASURY_PUBLIC_KEY);
    const solBalanceInSol = solBalance / 1e9;
    console.log(`[IssueCharityCoins] Treasury SOL balance before token account creation: ${solBalanceInSol} SOL`);
    
    if (solBalanceInSol < 0.001) {
      throw new Error(`Insufficient SOL balance (${solBalanceInSol} SOL). Need at least 0.001 SOL for transaction fees. Please fund the treasury wallet.`);
    }

    // Get or create the user's associated token account
    // Use getOrCreateAssociatedTokenAccount - it handles ATA creation automatically and properly
    // This is simpler and more reliable than manually creating the instruction
    console.log(`[IssueCharityCoins] Getting/creating user token account for ${walletAddress}...`);
    console.log(`[IssueCharityCoins] User public key: ${userPublicKey.toBase58()}`);
    console.log(`[IssueCharityCoins] Mint: ${CHARITY_COIN_MINT.toBase58()}`);
    console.log(`[IssueCharityCoins] Payer (Treasury): ${TREASURY_PUBLIC_KEY.toBase58()}`);
    
    let userTokenAccount;
    try {
      // getOrCreateAssociatedTokenAccount will:
      // 1. Check if the ATA exists
      // 2. If it doesn't exist, create it automatically with all required accounts and instructions
      // 3. Return the account object
      // This handles all the complexity of ATA creation internally
      userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        TREASURY_KEYPAIR, // payer (treasury pays for account creation if needed)
        CHARITY_COIN_MINT, // mint
        userPublicKey // owner (the user's wallet)
      );
      
      console.log(`[IssueCharityCoins] User token account: ${userTokenAccount.address.toBase58()}`);
      console.log(`[IssueCharityCoins] Account owner: ${userTokenAccount.owner.toBase58()}`);
      console.log(`[IssueCharityCoins] Account mint: ${userTokenAccount.mint.toBase58()}`);
      console.log(`[IssueCharityCoins] Account balance: ${userTokenAccount.amount.toString()}`);
      
      // Verify the account owner matches the user's public key
      if (!userTokenAccount.owner.equals(userPublicKey)) {
        throw new Error(
          `Token account owner mismatch! Expected: ${userPublicKey.toBase58()}, ` +
          `Got: ${userTokenAccount.owner.toBase58()}. This indicates a critical error.`
        );
      }
      
      // Verify the account mint matches the charity coin mint
      if (!userTokenAccount.mint.equals(CHARITY_COIN_MINT)) {
        throw new Error(
          `Token account mint mismatch! Expected: ${CHARITY_COIN_MINT.toBase58()}, ` +
          `Got: ${userTokenAccount.mint.toBase58()}. This indicates a critical error.`
        );
      }
      
    } catch (error) {
      console.error(`[IssueCharityCoins] Error getting/creating user token account:`, error);
      console.error(`[IssueCharityCoins] Error name:`, error.name);
      console.error(`[IssueCharityCoins] Error message:`, error.message);
      console.error(`[IssueCharityCoins] Error code:`, error.code);
      
      // Check for specific error types
      if (error.message?.includes('Provided Owner Is Not Allowed') || 
          error.message?.includes('Program Error')) {
        throw new Error(
          `Failed to create Associated Token Account: The provided owner address "${userPublicKey.toBase58()}" is not allowed. ` +
          `This usually means:\n` +
          `1. The wallet address is invalid or malformed\n` +
          `2. The wallet address is not a valid Solana public key\n` +
          `3. The wallet address is from a different network (mainnet vs devnet)\n` +
          `4. The wallet address contains invalid characters\n\n` +
          `Please verify the wallet address is correct, or leave it empty to create a new custodial wallet. ` +
          `Error details: ${error.message}`
        );
      }
      
      if (error.message?.includes('insufficient funds') || error.message?.includes('SOL')) {
        throw new Error(`Treasury wallet has insufficient SOL for transaction fees. Current balance may be too low.`);
      }
      
      // Re-throw with additional context
      throw new Error(
        `Failed to get/create user token account: ${error.message}. ` +
        `Owner: ${userPublicKey.toBase58()}, Mint: ${CHARITY_COIN_MINT.toBase58()}, ` +
        `Network: ${SOLANA_NETWORK}. ` +
        `Please check the wallet address and try again.`
      );
    }

    // Check treasury balance
    const treasuryBalance = await connection.getTokenAccountBalance(treasuryTokenAccount.address);
    console.log(`[IssueCharityCoins] Treasury balance: ${treasuryBalance.value.uiAmount}`);

    if (treasuryBalance.value.uiAmount < coinsToSendNum) {
      console.warn(`[IssueCharityCoins] Warning: Treasury balance (${treasuryBalance.value.uiAmount}) is less than coins to send (${coinsToSendNum})`);
      // Continue anyway for devnet - tokens can be airdropped if needed
    }

    // Verify we have a valid token account object (should always be valid at this point)
    if (!userTokenAccount || !userTokenAccount.address) {
      throw new Error(`Invalid token account object. Cannot proceed with transfer.`);
    }

    // Transfer Charity Coins to the user
    // Note: Token amounts are in the smallest unit. Since Charity Coin has 0 decimals,
    // we pass the amount as-is. If decimals were > 0, we'd multiply by 10^decimals
    console.log(`[IssueCharityCoins] Transferring ${coinsToSendNum} coins to ${walletAddress}`);
    console.log(`[IssueCharityCoins] Destination token account: ${userTokenAccount.address.toBase58()}`);
    
    // Check SOL balance before attempting transfer (already checked above, but verify again)
    const solBalanceBeforeTransfer = await connection.getBalance(TREASURY_PUBLIC_KEY);
    const solBalanceInSolBeforeTransfer = solBalanceBeforeTransfer / 1e9;
    console.log(`[IssueCharityCoins] Treasury SOL balance before transfer: ${solBalanceInSolBeforeTransfer} SOL`);
    
    if (solBalanceInSolBeforeTransfer < 0.001) {
      throw new Error(`Insufficient SOL balance (${solBalanceInSolBeforeTransfer} SOL). Need at least 0.001 SOL for transaction fees.`);
    }

    try {
      // Convert coinsToSendNum to BigInt for the transfer
      const transferAmount = BigInt(Math.floor(coinsToSendNum));
      console.log(`[IssueCharityCoins] Transfer amount: ${transferAmount.toString()}`);
      
      const signature = await transfer(
        connection,
        TREASURY_KEYPAIR, // payer and signer
        treasuryTokenAccount.address, // source token account
        userTokenAccount.address, // destination token account
        TREASURY_KEYPAIR, // owner of source account
        transferAmount, // amount in smallest units
        [] // additional signers (none needed)
      );

      console.log(`[IssueCharityCoins] Transfer successful! Signature: ${signature}`);

      // Don't wait for confirmation in serverless function (can timeout)
      // The transaction is sent and will confirm on-chain
      // Return immediately with the signature
      console.log(`[IssueCharityCoins] Transaction submitted to ${SOLANA_NETWORK}`);

      return res.status(200).json({
        success: true,
        walletAddress,
        walletCreated,
        walletPrivateKey: walletCreated ? walletPrivateKey : undefined, // Only return if newly created
        signature,
        transactionUrl: `https://solscan.io/tx/${signature}?cluster=${SOLANA_NETWORK}`,
        coinsSent: coinsToSendNum,
        message: `Successfully transferred ${coinsToSendNum} Charity Coins to ${walletAddress}`
      });
    } catch (transferError) {
      console.error('[IssueCharityCoins] Transfer error:', transferError);
      console.error('[IssueCharityCoins] Transfer error name:', transferError.name);
      console.error('[IssueCharityCoins] Transfer error message:', transferError.message);
      console.error('[IssueCharityCoins] Transfer error logs:', transferError.logs);
      throw new Error(`Transfer failed: ${transferError.message}`);
    }

  } catch (error) {
    console.error('[IssueCharityCoins] Error:', error);
    console.error('[IssueCharityCoins] Error stack:', error.stack);
    
    // Provide more detailed error information
    let errorDetails = error.message;
    if (error.logs) {
      console.error('[IssueCharityCoins] Solana error logs:', error.logs);
      errorDetails += ` | Logs: ${JSON.stringify(error.logs)}`;
    }
    
    return res.status(500).json({
      error: "Failed to issue Charity Coins",
      details: errorDetails,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

