# Fix: Cargo.toml File Type Not Recognized

## The Problem
The `?` icon on `Cargo.toml` means Solana Playground doesn't recognize it as a TOML file.

## The Issue: Wrong File Location

**❌ WRONG:** `Cargo.toml` is inside the `src/` folder
```
📁 src/
  📄 Cargo.toml  ← WRONG LOCATION
  📄 lib.rs
```

**✅ CORRECT:** `Cargo.toml` should be at the **ROOT** of the project
```
📁 src/
  📄 lib.rs
📄 Cargo.toml  ← CORRECT LOCATION (at root)
```

---

## How to Fix

### Step 1: Delete Cargo.toml from src/ folder

1. In the file explorer, find `src/Cargo.toml`
2. Right-click on it
3. Click **Delete** or press Delete key
4. Confirm deletion

### Step 2: Create Cargo.toml at Root

1. **Click on the root folder** (the project name "Charity Coin" or the top-level folder)
2. **Right-click** → **New File** (or use the + icon)
3. **Name it exactly:** `Cargo.toml` (case-sensitive!)
4. **Paste this content:**

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

### Step 3: Verify File Location

After creating, your file structure should look like:
```
📁 Charity Coin (or project root)
  📁 src/
    📄 lib.rs
  📄 Cargo.toml  ← Should be here, at root level
  📁 client/
  📁 tests/
```

The `Cargo.toml` should be at the **same level** as the `src/` folder, not inside it.

### Step 4: Check File Icon

After moving it to the root:
- The icon should change from `?` to a proper TOML file icon
- It should be recognized as a TOML file
- Syntax highlighting should work

### Step 5: Build Again

1. Save the file (Ctrl+S)
2. Click **Build**
3. It should work now!

---

## Alternative: If You Can't Delete

If you can't delete the file in `src/`:

1. **Create a NEW file at the root** named `Cargo.toml`
2. **Paste the content** above
3. **Ignore the one in src/** (it won't be used)
4. **Build** - it should use the root one

---

## File Structure Reference

**Correct structure for Solana Playground:**
```
Project Root/
├── Cargo.toml          ← HERE (at root)
├── src/
│   └── lib.rs
├── client/
│   └── client.ts
└── tests/
    └── anchor.test.ts
```

**NOT:**
```
Project Root/
├── src/
│   ├── Cargo.toml     ← WRONG (shouldn't be here)
│   └── lib.rs
```

---

## Quick Checklist

- [ ] `Cargo.toml` is at the **root level** (same level as `src/` folder)
- [ ] `Cargo.toml` is **NOT** inside the `src/` folder
- [ ] File name is exactly `Cargo.toml` (capital C, lowercase rest)
- [ ] File has proper TOML icon (not `?`)
- [ ] Syntax highlighting works in the editor

Try this and let me know if it works!

