# Native Solana Build Guide - Windows

## ✅ What We've Done

Your program has been converted from Anchor to **native Solana**:
- ✅ Updated `Cargo.toml` to use `solana-program` and `borsh` (no Anchor!)
- ✅ Converted `lib.rs` to native Solana code
- ✅ Removed all Anchor dependencies

## 🚀 How to Build (No Admin Rights Needed!)

### Step 1: Install Solana CLI Tools

**Download and install Solana CLI:**
1. Go to: https://github.com/solana-labs/solana/releases
2. Download the **Windows installer** (latest release)
3. Run the installer
4. **No admin rights needed** - installs to user directory

**Or use PowerShell to install:**
```powershell
# Download Solana installer
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile "$env:TEMP\solana-installer.exe"

# Run installer (will install to user directory)
& "$env:TEMP\solana-installer.exe"
```

**Verify installation:**
```powershell
solana --version
cargo-build-sbf --version
```

### Step 2: Build Your Program

**Navigate to project root:**
```powershell
cd C:\Users\myrew\charity-coin-2
```

**Build the program:**
```powershell
cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
```

**This will:**
- ✅ Compile your Rust program
- ✅ Create `.so` file in `target/deploy/charity_coin_raffle.so`
- ✅ **No admin rights needed!**
- ✅ **No Anchor required!**

### Step 3: Deploy to Devnet (Optional)

**Set cluster to devnet:**
```powershell
solana config set --url devnet
```

**Deploy the program:**
```powershell
solana program deploy target/deploy/charity_coin_raffle.so --url devnet
```

**Note:** You'll need SOL in your wallet for deployment fees.

---

## 📝 Next Steps: Update Your API Code

Your API files currently use Anchor client. You'll need to update them to use native `@solana/web3.js`.

**Files to update:**
- `api/conduct-raffle-draw.js`
- `api/update-raffle-state.js`
- `api/update-raffle-entries.js`

**See:** `docs/NATIVE_SOLANA_MIGRATION.md` for JavaScript client examples.

---

## 🔍 Troubleshooting

### "cargo-build-sbf not found"
**Solution:** Install Solana CLI tools (Step 1 above)

### "solana program not found"
**Solution:** Add Solana to PATH, or restart terminal after installation

### Build errors
**Check:**
- Rust is installed: `rustc --version`
- Cargo is installed: `cargo --version`
- Dependencies are correct in `Cargo.toml`

### "Permission denied"
**Solution:** You shouldn't need admin rights with native Solana. If you see this, check:
- Solana tools installed to user directory (not system)
- You have write permissions to project folder

---

## ✅ Benefits of Native Solana

- ✅ **No Anchor dependency** - simpler stack
- ✅ **No admin rights needed** - works on Windows easily
- ✅ **Direct control** - understand every line of code
- ✅ **Smaller binary** - no framework overhead
- ✅ **Better for simple programs** - less abstraction

---

## 📚 Resources

- **Native Solana Docs:** https://docs.solana.com/developing/programming-model/overview
- **Solana Cookbook:** https://solanacookbook.com/
- **Borsh Serialization:** https://borsh.io/

Ready to build! Try `cargo build-sbf` now! 🚀

