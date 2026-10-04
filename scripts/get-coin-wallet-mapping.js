import admin from 'firebase-admin';
import { initializeApp, getApps } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  // You'll need to set GOOGLE_APPLICATION_CREDENTIALS or use service account
  initializeApp();
}

const db = admin.firestore();

/**
 * Get wallet address for a given coin number
 * This is called after on-chain raffle draw to map winning coin number to wallet
 * 
 * @param {number} coinNumber - The winning coin number from on-chain raffle
 * @returns {Promise<string|null>} - The wallet address, or null if not found
 */
async function getWalletForCoinNumber(coinNumber) {
  try {
    console.log(`[GetCoinWallet] Looking up wallet for coin #${coinNumber}...`);

    // Query coinNumbers collection group to find the coin
    // Structure: users/{userId}/coinNumbers/{coinDoc}
    const coinQuery = db.collectionGroup('coinNumbers')
      .where('coinNumber', '==', coinNumber)
      .limit(1);

    const coinSnap = await coinQuery.get();

    if (coinSnap.empty) {
      console.warn(`[GetCoinWallet] Coin #${coinNumber} not found in Firestore`);
      return null;
    }

    // Extract userId from document path: users/{userId}/coinNumbers/{docId}
    const coinDoc = coinSnap.docs[0];
    const pathParts = coinDoc.ref.path.split('/');
    const userId = pathParts[1]; // users/{userId}/...

    console.log(`[GetCoinWallet] Found coin #${coinNumber} for user ${userId}`);

    // Get user document to retrieve wallet address
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.warn(`[GetCoinWallet] User ${userId} not found`);
      return null;
    }

    const userData = userDoc.data();
    const walletAddress = userData.solanaWallet || 
                         userData.solanaWalletAddress || 
                         null;

    console.log(`[GetCoinWallet] Wallet address: ${walletAddress}`);
    return walletAddress;

  } catch (error) {
    console.error(`[GetCoinWallet] Error:`, error);
    throw error;
  }
}

/**
 * Get full winner information including wallet and user details
 */
async function getWinnerInfo(coinNumber) {
  try {
    const walletAddress = await getWalletForCoinNumber(coinNumber);
    
    if (!walletAddress) {
      return {
        coinNumber,
        walletAddress: null,
        userId: null,
        userEmail: null,
      };
    }

    // Find user by wallet address
    const userQuery = db.collection('users')
      .where('solanaWallet', '==', walletAddress)
      .limit(1);

    const userSnap = await userQuery.get();
    
    if (userSnap.empty) {
      return {
        coinNumber,
        walletAddress,
        userId: null,
        userEmail: null,
      };
    }

    const userDoc = userSnap.docs[0];
    const userData = userDoc.data();

    return {
      coinNumber,
      walletAddress,
      userId: userDoc.id,
      userEmail: userData.email || null,
      userName: userData.firstName && userData.lastName 
        ? `${userData.firstName} ${userData.lastName}`
        : null,
    };
  } catch (error) {
    console.error(`[GetWinnerInfo] Error:`, error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const coinNumber = parseInt(process.argv[2]);
  
  if (!coinNumber) {
    console.error('Usage: node get-coin-wallet-mapping.js <coinNumber>');
    process.exit(1);
  }

  getWinnerInfo(coinNumber)
    .then((info) => {
      console.log('\nWinner Information:');
      console.log(JSON.stringify(info, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { getWalletForCoinNumber, getWinnerInfo };
