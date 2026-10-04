import { Keypair, Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token';
import admin from 'firebase-admin';
import bs58 from 'bs58';
import { CHARITY_COIN_MINT, TREASURY_KEYPAIR, TREASURY_PUBLIC_KEY } from './solana.config.js';

// Initialize Firebase Admin elsewhere in your app
const db = admin.firestore();

// CONFIGURATION
const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

// Util: Encrypt/Decrypt private keys (replace with real encryption in production)
function encryptPrivateKey(secretKeyUint8Array) {
  return bs58.encode(secretKeyUint8Array);
}
function decryptPrivateKey(encoded) {
  return bs58.decode(encoded);
}

// Main function
async function handleDonation(userId, coinsToSend) {
  // 1. Get user profile
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();
  let userData = userDoc.data();

  let walletAddress = userData?.solanaWalletAddress;
  let walletPrivateKey = userData?.solanaWalletPrivateKey;

  // 2. If no wallet, create one and store in Firestore
  if (!walletAddress) {
    const newKeypair = Keypair.generate();
    walletAddress = newKeypair.publicKey.toBase58();
    walletPrivateKey = encryptPrivateKey(newKeypair.secretKey);

    await userRef.update({
      solanaWalletAddress: walletAddress,
      solanaWalletPrivateKey: walletPrivateKey, // Store encrypted!
      walletType: 'custodial',
    });
    userData = { ...userData, solanaWalletAddress: walletAddress, solanaWalletPrivateKey: walletPrivateKey };
  }

  // 3. Get or create the user's associated token account
  const userPublicKey = new PublicKey(walletAddress);
  const userTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    TREASURY_KEYPAIR, // payer
    CHARITY_COIN_MINT,
    userPublicKey
  );

  // 4. Get or create the treasury's associated token account
  const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    TREASURY_KEYPAIR,
    CHARITY_COIN_MINT,
    TREASURY_KEYPAIR.publicKey
  );

  // 5. Transfer Charity Coins to the user
  const signature = await transfer(
    connection,
    TREASURY_KEYPAIR,
    treasuryTokenAccount.address,
    userTokenAccount.address,
    TREASURY_KEYPAIR.publicKey,
    coinsToSend // amount in smallest units (e.g., if decimals=0, just the number of coins)
  );

  // 6. Optionally, log the transaction in Firestore
  await userRef.collection('transactions').add({
    type: 'coin_transfer',
    amount: coinsToSend,
    to: walletAddress,
    signature,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { walletAddress, signature };
}

export { handleDonation }; 