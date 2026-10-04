# Solana Playground Quick Setup Guide

## Step-by-Step: Build Your Program in the Browser

### Step 1: Access Solana Playground

1. Open your browser and go to: **https://beta.solpg.io/**
2. Click **"Create New Project"** or **"New Project"**
3. Select **"Anchor"** as the project type

### Step 2: Copy Your Program Code

1. **Copy your `lib.rs` code:**
   - Open `programs/charity-coin-raffle/src/lib.rs`
   - Copy all the code (Ctrl+A, Ctrl+C)

2. **In Solana Playground:**
   - Find the `lib.rs` file in the file explorer
   - Paste your code (Ctrl+V)
   - Replace the default code

### Step 3: Update Cargo.toml

1. **Copy your Cargo.toml dependencies:**
   - Your current `Cargo.toml` has: `anchor-lang = "0.32.1"`
   
2. **In Solana Playground:**
   - Find `Cargo.toml` in the file explorer
   - Make sure it includes:
   ```toml
   [dependencies]
   anchor-lang = "0.32.1"
   ```

### Step 4: Update Program ID

1. **In Solana Playground's `lib.rs`:**
   - Find the `declare_id!` line
   - Update it to match your current program ID: `55jjagC6eNWDtESgC32RKE3DEuc7U2nGUVHVzjyK1WjW`
   - OR generate a new one (Playground will create one for you)

### Step 5: Build the Program

1. Click the **"Build"** button (or press Ctrl+Shift+B)
2. Wait for the build to complete (usually 30-60 seconds)
3. You'll see:
   - ✅ Build successful
   - Program ID displayed
   - IDL generated

### Step 6: Deploy to Devnet

1. Make sure you're connected to **Devnet** (top right corner)
2. Click **"Deploy"** button
3. Playground will:
   - Airdrop SOL to your wallet if needed
   - Deploy the program
   - Show you the transaction signature

### Step 7: Download Artifacts

1. **Download the IDL:**
   - Click on the file explorer
   - Find `target/idl/charity_coin_raffle.json`
   - Right-click → Download
   - Save it to your project (you can replace the existing one)

2. **Note your Program ID:**
   - Copy the program ID from the build output
   - Update it in your API files

### Step 8: Update Your API Files

Update these files with the new program ID (if it changed):

- `api/conduct-raffle-draw.js`
- `api/update-raffle-state.js`
- `api/update-raffle-entries.js`
- `scripts/verify-raffle-state.js`

Replace `YOUR_RAFFLE_PROGRAM_ID_HERE` with your actual program ID.

---

## Important Notes

### If You Generate a New Program ID:

1. **Update your program:**
   - The new program ID will be in the Playground output
   - Copy it and update `declare_id!` in your local `lib.rs` if you want to keep them in sync

2. **Update all references:**
   - Update `programs/charity-coin-raffle/src/lib.rs` (declare_id!)
   - Update all API files
   - Update any scripts

### Keeping Playground in Sync:

- **Option 1:** Always use Playground for builds (recommended for now)
- **Option 2:** Copy code back and forth between Playground and local files
- **Option 3:** Use Playground to generate IDL, keep local code in sync

---

## Troubleshooting

### Build Fails:
- Check that all dependencies are correct
- Make sure `declare_id!` has a valid program ID
- Check for syntax errors (Playground will highlight them)

### Deploy Fails:
- Make sure you're on Devnet (not localnet)
- Check that you have SOL in your wallet (Playground will airdrop if needed)
- Try deploying again

### Can't Find Files:
- Use the file explorer on the left side
- Look for `src/lib.rs` and `Cargo.toml`
- Use the search/filter if needed

---

## Next Steps After Deployment

1. **Test your program:**
   - Use Playground's test interface
   - Or test via your API endpoints

2. **Update your local project:**
   - Copy the IDL file to `target/idl/` (if you want to keep it locally)
   - Update program ID references

3. **Continue development:**
   - Make changes in Playground
   - Or make changes locally and copy to Playground for builds

---

## Quick Reference

**Solana Playground URL:** https://beta.solpg.io/

**Your Current Program ID:** `55jjagC6eNWDtESgC32RKE3DEuc7U2nGUVHVzjyK1WjW`

**Build Time:** ~30-60 seconds

**No Admin Rights Needed:** ✅ Works in browser!

---

## Need Help?

If you get stuck:
1. Check the Playground console for errors
2. Make sure your Rust syntax is correct
3. Verify all account structures match
4. Try building a simple test program first

Let me know if you need help with any specific step!

