# Reinstall Solana CLI Tools - Windows Fix

## The Problem
You're getting this error:
```
error: not a directory: '\\?\C:\Users\myrew\.local\share\solana\install\releases\2.2.14\solana-release\bin\platform-tools-sdk\sbf\dependencies\platform-tools\rust\lib'
```

This means the Solana platform tools installation is corrupted or incomplete.

## Solution: Reinstall Solana CLI

### Option 1: Download and Reinstall (Recommended)

1. **Uninstall current Solana:**
   - Go to Windows Settings → Apps
   - Search for "Solana" and uninstall

2. **Download fresh installer:**
   - Go to: https://github.com/solana-labs/solana/releases
   - Download the latest **Windows installer** (`.exe` file)
   - Or use the direct link: https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe

3. **Install:**
   - Run the installer
   - Follow the prompts
   - **No admin rights needed** - it installs to user directory

4. **Verify:**
   ```powershell
   solana --version
   cargo-build-sbf --version
   ```

### Option 2: Use PowerShell to Reinstall

```powershell
# Remove old installation
Remove-Item -Recurse -Force "$env:USERPROFILE\.local\share\solana" -ErrorAction SilentlyContinue

# Download installer
$installerPath = "$env:TEMP\solana-installer.exe"
Invoke-WebRequest -Uri "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe" -OutFile $installerPath

# Run installer
& $installerPath

# After installation, close and reopen PowerShell
# Then verify:
solana --version
```

### Option 3: Use Solana Install Script (If Available)

If you have `solana-install` available:
```powershell
solana-install init
```

Or specify version:
```powershell
solana-install init 2.2.14
```

## After Reinstallation

1. **Restart your terminal/PowerShell**
2. **Verify installation:**
   ```powershell
   solana --version
   cargo-build-sbf --version
   ```

3. **Try building again:**
   ```powershell
   cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
   ```

## Alternative: Use WSL (Windows Subsystem for Linux)

If Solana continues to have issues on Windows:

1. **Install WSL2:**
   ```powershell
   wsl --install
   ```

2. **In WSL, install Solana:**
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   ```

3. **Build in WSL:**
   ```bash
   cd /mnt/c/Users/myrew/charity-coin-2
   cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
   ```

## Quick Fix: Try This First

Sometimes the issue is just a corrupted toolchain. Try:

```powershell
# Remove corrupted toolchain
Remove-Item -Recurse -Force "$env:USERPROFILE\.local\share\solana\install\releases\2.2.14" -ErrorAction SilentlyContinue

# Try building again - it should re-download
cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
```

This will force Solana to re-download the platform tools.

---

## Need Help?

If none of these work, share the error message and we'll troubleshoot further!

