# How to Get Your Raffle Program ID

The program ID is the unique identifier for your deployed Solana program. Here's how to get it:

## Option 1: After Building and Deploying (Recommended)

### Step 1: Build the Anchor Program

Navigate to your program directory and build:

```bash
cd programs/charity-coin-raffle
anchor build
```

This will:
- Generate a keypair for your program (if not already exists)
- Build the program
- Generate the IDL (Interface Definition Language)
- Show you the program ID in the build output

### Step 2: Check Build Output

After building, Anchor will display something like:

```
Building...
Program ID: <PROGRAM_ID_BASE58>
```

Copy this program ID!

### Step 3: Check Generated Keypair File

The program keypair is stored in:
```
programs/charity-coin-raffle/target/deploy/charity_coin_raffle-keypair.json
```

You can extract the program ID from this keypair:

```bash
# On Linux/Mac
solana address -k programs/charity-coin-raffle/target/deploy/charity_coin_raffle-keypair.json

# Or view the keypair file (public key = program ID)
cat programs/charity-coin-raffle/target/deploy/charity_coin_raffle-keypair.json
```

### Step 4: Check Anchor.toml (If Exists)

If you have an `Anchor.toml` file in the program directory, check for:

```toml
[programs.devnet]
charity_coin_raffle = "<PROGRAM_ID_BASE58>"
```

## Option 2: After Deploying

### Deploy to Devnet

```bash
cd programs/charity-coin-raffle
anchor deploy --provider.cluster devnet
```

The deploy command will:
1. Show the program ID being deployed
2. Display the deployment transaction signature
3. Confirm the program ID on-chain

Example output:
```
Deploying cluster: https://api.devnet.solana.com
Updating program...
Program Id: <PROGRAM_ID_BASE58>

Deploy success
```

### Check on Solscan

After deploying, visit Solscan and search for your program:
- **Devnet**: `https://solscan.io/account/<PROGRAM_ID>?cluster=devnet`
- The account page will show it's a "Program" account

## Option 3: From IDL File

The generated IDL file contains the program ID. Check:

```
programs/charity-coin-raffle/target/idl/charity_coin_raffle.json
```

Look for the `metadata` section:
```json
{
  "version": "0.1.0",
  "name": "charity_coin_raffle",
  "metadata": {
    "address": "<PROGRAM_ID_BASE58>"
  },
  ...
}
```

## Option 4: Generate New Keypair (If Needed)

If you don't have a program keypair yet:

```bash
# Generate a new keypair
solana-keygen new --outfile programs/charity-coin-raffle/target/deploy/charity_coin_raffle-keypair.json

# Get the program ID (public key)
solana address -k programs/charity-coin-raffle/target/deploy/charity_coin_raffle-keypair.json
```

## Once You Have the Program ID

Update these files with your program ID:

### 1. `programs/charity-coin-raffle/src/lib.rs`

```rust
declare_id!("<YOUR_PROGRAM_ID_BASE58>");
```

### 2. `api/conduct-raffle-draw.js`

```javascript
const RAFFLE_PROGRAM_ID = new PublicKey('<YOUR_PROGRAM_ID_BASE58>');
```

### 3. `api/update-raffle-state.js`

```javascript
const RAFFLE_PROGRAM_ID = new PublicKey('<YOUR_PROGRAM_ID_BASE58>');
```

### 4. `api/update-raffle-entries.js`

```javascript
const RAFFLE_PROGRAM_ID = new PublicKey('<YOUR_PROGRAM_ID_BASE58>');
```

### 5. `scripts/verify-raffle-state.js`

```javascript
const RAFFLE_PROGRAM_ID = new PublicKey('<YOUR_PROGRAM_ID_BASE58>');
```

### 6. `Anchor.toml` (if exists)

```toml
[programs.devnet]
charity_coin_raffle = "<YOUR_PROGRAM_ID_BASE58>"
```

## Important Notes

1. **Program ID is Permanent**: Once deployed, the program ID cannot be changed. Make sure to save it!

2. **Same ID for All Networks**: The program ID is the same for devnet and mainnet (different deployments of the same program)

3. **Keep Keypair Secure**: The keypair file (`-keypair.json`) is used to deploy upgrades. Keep it secure!

4. **Format**: Program IDs are Base58 encoded public keys (44 characters, like: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`)

## Quick Check: Is My Program Deployed?

To verify your program is deployed:

```bash
# Check if program exists on-chain
solana program show <PROGRAM_ID> --url devnet
```

If deployed, you'll see:
- Program Data Account
- Authority
- Last Deployed Slot
- Program Length

## Troubleshooting

### "Invalid program id" Error

- Make sure you've updated ALL files with the same program ID
- Ensure the program ID is Base58 encoded (44 characters)
- Verify the program is actually deployed: `solana program show <PROGRAM_ID> --url devnet`

### Program ID Mismatch

If you see errors about program ID mismatches:
1. Make sure `declare_id!()` in `lib.rs` matches your keypair's public key
2. Rebuild after updating: `anchor build`
3. Redeploy if needed: `anchor deploy --provider.cluster devnet`

### Can't Find Program ID

If you can't find the program ID:
1. Check if you've built the program: `cd programs/charity-coin-raffle && anchor build`
2. Look in build output
3. Check `target/deploy/charity_coin_raffle-keypair.json`
4. Check generated IDL file

## Example Program ID Format

A typical program ID looks like:
```
7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

It's:
- 32-44 characters long
- Base58 encoded
- Starts with a number or letter
- No special characters (except Base58 characters)

## Next Steps

Once you have your program ID:
1. Update all files listed above
2. Deploy the program (if not already deployed)
3. Initialize the raffle on-chain
4. Start verifying with `npm run verify:raffle`

