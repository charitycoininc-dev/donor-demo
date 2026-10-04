import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, transfer, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

// Charity Coin configuration
const CHARITY_COIN_MINT = new PublicKey('C2d1xNx5cvQX7eeQQa1rQtSdQL5iCykYMEwWZgNTDyUr');
const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];

const SOLANA_NETWORK = 'devnet';
const connection = new Connection(clusterApiUrl(SOLANA_NETWORK));

async function testTokenTransfer() {
  try {
    console.log('🧪 Testing Charity Coin token transfer...\n');

    // Initialize treasury keypair
    const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));
    const TREASURY_PUBLIC_KEY = TREASURY_KEYPAIR.publicKey;

    // Create a test recipient wallet (simulating a user)
    const testRecipientKeypair = Keypair.generate();
    const testRecipientAddress = testRecipientKeypair.publicKey.toBase58();
    const coinsToSend = 100; // Simulating 100 coins for $100 donation

    console.log(`Treasury: ${TREASURY_PUBLIC_KEY.toBase58()}`);
    console.log(`Recipient: ${testRecipientAddress}`);
    console.log(`Coins to send: ${coinsToSend}\n`);

    // Check SOL balances
    const treasurySolBalance = await connection.getBalance(TREASURY_PUBLIC_KEY);
    const treasurySolBalanceInSol = treasurySolBalance / 1e9;
    console.log(`Treasury SOL: ${treasurySolBalanceInSol} SOL`);

    if (treasurySolBalanceInSol < 0.001) {
      throw new Error(`Insufficient SOL in treasury (${treasurySolBalanceInSol} SOL)`);
    }

    // Get or create token accounts
    console.log('\n📝 Step 1: Getting/creating token accounts...');
    
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      TREASURY_KEYPAIR,
      CHARITY_COIN_MINT,
      TREASURY_PUBLIC_KEY
    );
    console.log(`✅ Treasury token account: ${treasuryTokenAccount.address.toBase58()}`);

    let recipientTokenAccount;
    try {
      recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        TREASURY_KEYPAIR, // payer
        CHARITY_COIN_MINT,
        testRecipientKeypair.publicKey
      );
      console.log(`✅ Recipient token account: ${recipientTokenAccount.address.toBase58()}`);
    } catch (error) {
      if (error.name === 'TokenAccountNotFoundError') {
        console.log('ℹ️  Recipient token account does not exist, will be created during transfer');
        // We'll create it during the transfer process
      } else {
        throw error;
      }
    }

    // Check token balances
    const treasuryTokenBalance = await connection.getTokenAccountBalance(treasuryTokenAccount.address);
    console.log(`\n💰 Treasury token balance: ${treasuryTokenBalance.value.uiAmount} coins`);

    if (treasuryTokenBalance.value.uiAmount < coinsToSend) {
      throw new Error(`Insufficient tokens in treasury (${treasuryTokenBalance.value.uiAmount} < ${coinsToSend})`);
    }

    // Ensure recipient token account exists
    if (!recipientTokenAccount) {
      console.log(`\n📝 Creating recipient token account...`);
      const recipientTokenAccountAddress = await getAssociatedTokenAddress(
        CHARITY_COIN_MINT,
        testRecipientKeypair.publicKey
      );
      
      const createAccountIx = createAssociatedTokenAccountInstruction(
        TREASURY_KEYPAIR.publicKey, // payer
        recipientTokenAccountAddress, // account to create
        testRecipientKeypair.publicKey, // owner
        CHARITY_COIN_MINT
      );
      
      const transaction = new Transaction().add(createAccountIx);
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [TREASURY_KEYPAIR]
      );
      
      console.log(`✅ Created recipient token account: ${recipientTokenAccountAddress.toBase58()}`);
      
      // Get the account after creation
      recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        TREASURY_KEYPAIR,
        CHARITY_COIN_MINT,
        testRecipientKeypair.publicKey
      );
    }

    // Perform transfer
    console.log(`\n📤 Step 2: Transferring ${coinsToSend} coins...`);
    
    try {
      const signature = await transfer(
        connection,
        TREASURY_KEYPAIR,
        treasuryTokenAccount.address,
        recipientTokenAccount.address,
        TREASURY_KEYPAIR,
        BigInt(coinsToSend),
        []
      );

      console.log(`✅ Transfer successful!`);
      console.log(`Transaction signature: ${signature}`);
      console.log(`View on Solscan: https://solscan.io/tx/${signature}?cluster=${SOLANA_NETWORK}`);

      // Wait for confirmation
      console.log(`\n⏳ Waiting for confirmation...`);
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log(`✅ Transaction confirmed!`);

      // Verify final balances
      console.log(`\n📊 Step 3: Verifying balances...`);
      const finalTreasuryBalance = await connection.getTokenAccountBalance(treasuryTokenAccount.address);
      const finalRecipientBalance = await connection.getTokenAccountBalance(recipientTokenAccount.address);
      
      console.log(`Treasury balance: ${finalTreasuryBalance.value.uiAmount} coins`);
      console.log(`Recipient balance: ${finalRecipientBalance.value.uiAmount} coins`);

      if (finalRecipientBalance.value.uiAmount === coinsToSend) {
        console.log(`\n🎉 Test PASSED! Recipient received ${coinsToSend} coins.`);
      } else {
        console.log(`\n⚠️  Test WARNING: Expected ${coinsToSend} coins but recipient has ${finalRecipientBalance.value.uiAmount}`);
      }

    } catch (transferError) {
      console.error('\n❌ Transfer failed!');
      console.error('Error:', transferError.message);
      console.error('Stack:', transferError.stack);
      
      if (transferError.logs) {
        console.error('Solana error logs:');
        transferError.logs.forEach(log => console.error('  ', log));
      }
      
      throw transferError;
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testTokenTransfer()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });

