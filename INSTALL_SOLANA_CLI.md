# Install Solana CLI Tools - Step by Step

## Current Status
Your Solana CLI installation is corrupted or incomplete. Let's fix it!

## Quick Installation Steps

### Step 1: Download Solana Installer

**Option A: Direct Download (Easiest)**
1. Open your browser
2. Go to: https://github.com/solana-labs/solana/releases/latest
3. Scroll down to "Assets"
4. Download: **solana-install-init-x86_64-pc-windows-msvc.exe**
5. Run the installer

**Option B: Use PowerShell**
Run this in PowerShell:

```powershell
# Download installer
$installerUrl = "https://release.solana.com/stable/solana-install-init-x86_64-pc-windows-msvc.exe"
$installerPath = "$env:TEMP\solana-installer.exe"
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

# Run installer
& $installerPath
```

### Step 2: Follow Installer Prompts

The installer will:
- Install Solana CLI to your user directory
- Add Solana to your PATH
- **No admin rights needed!**

### Step 3: Close and Reopen PowerShell

**Important:** Close your current PowerShell/Terminal and open a new one so PATH updates take effect.

### Step 4: Verify Installation

In the new PowerShell window:

```powershell
solana --version
cargo-build-sbf --version
```

You should see version numbers for both commands.

### Step 5: Build Your Program

```powershell
cd C:\Users\myrew\charity-coin-2
cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
```

---

## Alternative: Manual Installation

If the installer doesn't work, you can install manually:

### 1. Download Solana Release

```powershell
# Create Solana directory
$solanaDir = "$env:USERPROFILE\.local\share\solana"
New-Item -ItemType Directory -Force -Path $solanaDir

# Download Solana release
$releaseUrl = "https://github.com/solana-labs/solana/releases/download/v2.2.14/solana-release-x86_64-pc-windows-msvc.tar.bz2"
$releasePath = "$env:TEMP\solana-release.tar.bz2"
Invoke-WebRequest -Uri $releaseUrl -OutFile $releasePath

# Extract (you'll need 7-Zip or similar)
# Extract to: $env:USERPROFILE\.local\share\solana\install\releases\2.2.14\
```

### 2. Add to PATH

```powershell
# Add to user PATH
$solanaBin = "$env:USERPROFILE\.local\share\solana\install\active_release\bin"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$currentPath;$solanaBin", "User")
```

---

## Troubleshooting

### "command not found" after installation
**Fix:** Close and reopen PowerShell/Terminal

### "cargo-build-sbf not found"
**Fix:** Make sure you installed the full Solana release, not just the CLI

### Still having issues?
Try:
1. Uninstall Solana completely
2. Delete `$env:USERPROFILE\.local\share\solana`
3. Reinstall using Step 1

---

## Quick Test

After installation, run:
```powershell
solana --version
cargo-build-sbf --version
cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
```

All three should work! 🚀

