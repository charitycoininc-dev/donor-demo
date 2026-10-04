import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Keypair } from '@solana/web3.js';

// Treasury configuration
const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];

const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

async function checkSolBalance() {
  try {
    const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));
    const TREASURY_PUBLIC_KEY = TREASURY_KEYPAIR.publicKey;

    console.log('🔍 Checking SOL balance for treasury wallet...');
    console.log(`Treasury Address: ${TREASURY_PUBLIC_KEY.toBase58()}`);
    console.log(`Network: ${SOLANA_NETWORK}\n`);

    const balance = await connection.getBalance(TREASURY_PUBLIC_KEY);
    const solBalance = balance / 1e9; // Convert lamports to SOL

    console.log(`Balance: ${balance} lamports`);
    console.log(`SOL Balance: ${solBalance} SOL`);

    if (solBalance < 0.01) {
      console.log('\n⚠️  WARNING: Treasury wallet has very little SOL!');
      console.log('   Transaction fees typically require ~0.000005 SOL per transaction.');
      console.log('   You may need to airdrop SOL to the treasury wallet for devnet.');
      console.log(`   Run: solana airdrop 1 ${TREASURY_PUBLIC_KEY.toBase58()} --url devnet`);
    } else {
      console.log('\n✅ Treasury has sufficient SOL for transaction fees.');
    }

    return solBalance;
  } catch (error) {
    console.error('❌ Error checking SOL balance:', error);
    throw error;
  }
}

checkSolBalance()
  .then((balance) => {
    console.log(`\n✅ Check complete. Balance: ${balance} SOL`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to check balance:', error);
    process.exit(1);
  });

