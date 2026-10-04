# Solana Install Workaround - No Admin Rights Needed

## The Problem
You're getting:
- `Unknown release: 2.2.14`
- `Error: Unable to symlink... A required privilege is not held by the client. (os error 1314)`

This is the same Windows admin rights issue you had with Anchor!

## Solution: Use WSL (Windows Subsystem for Linux) ⭐ RECOMMENDED

Since we've converted to native Solana, it works perfectly in WSL - **no admin rights needed!**

### Step 1: Install WSL (if not already installed)

```powershell
wsl --install
```

Then **restart your computer**.

### Step 2: Open WSL and Install Solana

In WSL (Ubuntu terminal):

```bash
# Install Solana CLI (works in Linux without admin!)
sh -c "$(curl -sSfL https://release.solana.com/v1.18.26/install)"

# Add to PATH
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify
solana --version
cargo-build-sbf --version
```

### Step 3: Build Your Program

```bash
# Navigate to your project (Windows files are accessible in WSL)
cd /mnt/c/Users/myrew/charity-coin-2

# Build!
cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml
```

**This works perfectly and requires NO admin rights!** ✅

---

## Alternative: Find Correct Solana Version

The installer might need a different version format. Try:

### Option 1: Check Available Versions

```powershell
# Try to see what versions are available
.\solana-install-init-x86_64-pc-windows-msvc.exe --help
```

### Option 2: Try Version Without "v" Prefix

```powershell
.\solana-install-init-x86_64-pc-windows-msvc.exe 1.18.26
```

### Option 3: Use Direct Download Instead

Instead of the installer, download the pre-built binaries:

1. Go to: https://github.com/solana-labs/solana/releases
2. Download the Windows release zip
3. Extract to `C:\Users\myrew\.local\share\solana\`
4. Add to PATH manually

---

## Alternative: Use GitHub Actions / CI/CD

If you can't install locally, you could:
1. Push code to GitHub
2. Use GitHub Actions to build
3. Download the built `.so` file

---

## My Recommendation

**Use WSL** - it's the easiest solution:
- ✅ No admin rights needed
- ✅ Solana installs easily in Linux
- ✅ Native Solana code works perfectly
- ✅ Your Windows files are accessible via `/mnt/c/`

Would you like me to guide you through WSL setup, or try finding the correct Solana version first?

