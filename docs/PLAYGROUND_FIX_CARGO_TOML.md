# Fix: Solana Playground Build Error

## The Problem
**Build error: InvalidFile** - Usually means Cargo.toml has syntax issues

## Quick Fix

### Step 1: Fix Cargo.toml

**In Solana Playground, replace ALL content in `Cargo.toml` with this EXACT code:**

```toml
[package]
name = "charity_coin_raffle"
version = "0.1.0"
description = "Charity Coin Raffle Program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "charity_coin_raffle"
path = "src/lib.rs"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1

[dependencies]
anchor-lang = "0.32.1"
```

**Important:** 
- Make sure there's NO text before `[package]`
- Make sure there's NO `toml` keyword at the start
- Make sure all brackets `[]` are matched
- No extra spaces or characters

### Step 2: Verify lib.rs

Make sure `src/lib.rs` exists and has your code. In Playground:
1. Click on `src` folder in file explorer
2. Make sure `lib.rs` is there
3. If not, create it and paste your code

### Step 3: Check File Structure

Your file structure in Playground should look like:
```
📁 src/
  📄 lib.rs
📄 Cargo.toml
```

**NOT:**
- ❌ `programs/charity-coin-raffle/src/lib.rs` (Playground doesn't use that structure)
- ✅ `src/lib.rs` (Playground uses simple structure)

### Step 4: Try Build Again

1. Save the file (Ctrl+S)
2. Click **"Build"** button again
3. Check the console for any error messages

---

## Common Issues & Fixes

### Issue 1: Extra "toml" text
**Symptom:** File starts with `toml` keyword
**Fix:** Remove it - file should start with `[package]`

### Issue 2: Wrong file path
**Symptom:** `path = "programs/charity-coin-raffle/src/lib.rs"`
**Fix:** Change to `path = "src/lib.rs"`

### Issue 3: Missing lib.rs
**Symptom:** File doesn't exist
**Fix:** Create `src/lib.rs` and paste your code

### Issue 4: Anchor version mismatch
**Symptom:** Build fails with dependency errors
**Fix:** Try `anchor-lang = "0.30.0"` or check Playground's default version

---

## If Still Not Working

### Option A: Start Fresh in Playground

1. **Delete the project** (or create new one)
2. **Create new Anchor project**
3. **Copy ONLY the content** (not the file structure)
4. **Paste into Playground's files**

### Option B: Check Console Output

Look at the bottom console/terminal panel for the exact error message. Common messages:
- `InvalidFile` → Cargo.toml syntax issue
- `File not found` → lib.rs missing or wrong path
- `Dependency error` → anchor-lang version issue

### Option C: Use Playground's Default Template

1. Create new Anchor project
2. Don't modify Cargo.toml initially
3. Just update lib.rs with your code
4. Try building
5. If it works, then update Cargo.toml with your settings

---

## Working Cargo.toml (Minimal Version)

If the full version doesn't work, try this minimal one:

```toml
[package]
name = "charity_coin_raffle"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
path = "src/lib.rs"

[dependencies]
anchor-lang = "0.32.1"
```

This minimal version should work. You can add back the other settings later.

---

## Quick Checklist

- [ ] Cargo.toml starts with `[package]` (not `toml` or anything else)
- [ ] `src/lib.rs` exists and has your code
- [ ] File path in Cargo.toml is `"src/lib.rs"` (not `programs/...`)
- [ ] No syntax errors (check for red underlines)
- [ ] Saved the file before building

Try these fixes and let me know if you still see the error!

