# Fix: Solana Installer "Please specify the release" Error

## The Problem
The installer needs a release version specified on the command line.

## Solution: Run with Release Version

### Option 1: Use Latest Stable Version

Run this in PowerShell:

```powershell
& "$env:TEMP\solana-installer.exe" 2.2.14
```

Or if you downloaded it to a different location:

```powershell
# Navigate to where you downloaded it
cd C:\Users\myrew\Downloads

# Run with version
.\solana-install-init-x86_64-pc-windows-msvc.exe 2.2.14
```

### Option 2: Use Latest Version

```powershell
& "$env:TEMP\solana-installer.exe" latest
```

### Option 3: Check Available Versions First

The installer should show available versions. Try:

```powershell
& "$env:TEMP\solana-installer.exe" --help
```

This will show you:
- Available versions
- How to specify a version
- Other options

---

## Recommended Command

Run this:

```powershell
& "$env:TEMP\solana-installer.exe" 2.2.14
```

This installs Solana version 2.2.14 (current stable version).

---

## After Installation

1. **Close and reopen PowerShell** (important!)
2. **Verify:**
   ```powershell
   solana --version
   cargo-build-sbf --version
   ```
3. **Build your program:**
   ```powershell
   cd C:\Users\myrew\charity-coin-2
   cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
   ```

---

## Alternative: Use Solana Install Script

If the installer continues to have issues, you can also install via the install script:

```powershell
# This downloads and runs the installer automatically
$url = "https://release.solana.com/v2.2.14/solana-install-init-x86_64-pc-windows-msvc.exe"
Invoke-WebRequest -Uri $url -OutFile "$env:TEMP\sol-install.exe"
& "$env:TEMP\sol-install.exe" 2.2.14
```

Try the recommended command first! 🚀

