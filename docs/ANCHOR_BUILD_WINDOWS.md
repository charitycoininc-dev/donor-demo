# Anchor Build on Windows - Administrator Privileges Required

## The Issue

When running `anchor build` on Windows, Anchor tries to install Solana platform tools (cargo-build-sbf) which requires administrator privileges to:

1. **Create symlinks** in the system directories
2. **Write to protected directories** like `C:\Users\<user>\.cache\solana\`
3. **Install platform binaries** that need to be in the PATH

## What Privileges Are Needed

Anchor needs admin rights to:

- **Install/download platform-tools**: Anchor downloads Solana build tools (platform-tools) to `~/.cache/solana/v1.47/platform-tools/`
- **Create symlinks**: Windows requires administrator privileges to create symbolic links
- **Set up build environment**: Installation of cargo-build-sbf and related tools

## Solutions

### Option 1: Run as Administrator (Recommended)

1. **Open PowerShell as Administrator**:
   - Right-click on PowerShell or Terminal
   - Select "Run as Administrator"
   - Click "Yes" when prompted

2. **Navigate to your project**:
   ```powershell
   cd C:\Users\myrew\charity-coin-2
   ```

3. **Build the program**:
   ```powershell
   anchor build
   ```

This will allow Anchor to install the required platform tools.

### Option 2: Pre-install Platform Tools (Alternative)

If you can't run as administrator, you can try manually installing the platform tools:

1. **Download Solana platform tools manually**:
   - Visit: https://github.com/solana-labs/platform-tools/releases
   - Download the Windows version
   - Extract to `C:\Users\<your-username>\.cache\solana\v1.47\platform-tools\`

2. **Add to PATH** (if needed):
   ```powershell
   $env:PATH += ";C:\Users\<your-username>\.cache\solana\v1.47\platform-tools\"
   ```

3. **Try building again**:
   ```powershell
   anchor build
   ```

### Option 3: Use WSL (Windows Subsystem for Linux)

If available, you can use WSL where symlink permissions work differently:

```bash
# In WSL
cd /mnt/c/Users/myrew/charity-coin-2
anchor build
```

### Option 4: Manual Build Without Platform Tools Installation

If the platform tools are already installed, you can try building directly with cargo:

```powershell
cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
```

## Verification

After successfully building, you should see:

```
✅ Compiled program
✅ Program ID: 55jjagC6eNWDtESgC32RKE3DEuc7U2nGUVHVzjyK1WjW
✅ IDL generated: target/idl/charity_coin_raffle.json
```

## Important Files Generated

After a successful build, these files will be created:

- `programs/charity-coin-raffle/target/deploy/charity_coin_raffle.so` - Compiled program
- `programs/charity-coin-raffle/target/idl/charity_coin_raffle.json` - Interface Definition Language
- `target/deploy/charity_coin_raffle-keypair.json` - Program keypair (keep secure!)

## Next Steps After Building

1. **Update API files** with the program ID:
   - `api/conduct-raffle-draw.js`
   - `api/update-raffle-state.js`
   - `api/update-raffle-entries.js`
   - `scripts/verify-raffle-state.js`

2. **Deploy to devnet** (optional for now):
   ```powershell
   anchor deploy --provider.cluster devnet
   ```

3. **Test verification script**:
   ```powershell
   npm run verify:raffle
   ```

## Troubleshooting

### "Failed to install platform-tools"

**Solution**: Run PowerShell/Terminal as Administrator and try again.

### "Not in workspace"

**Solution**: Make sure `Anchor.toml` exists in the project root.

### "Invalid Base58 string"

**Solution**: Make sure the program ID in `Anchor.toml` and `lib.rs` match the keypair.

### "Disk space" errors

**Solution**: Free up disk space. Anchor downloads ~500MB of platform tools.

## Summary

**For now, you have two choices:**

1. **Run PowerShell as Administrator** and run `anchor build` (recommended)
2. **Wait until you have admin access** or use a different machine/environment

The build process itself is working correctly - it just needs admin privileges to install the required Solana build tools on Windows.













