# How to Create Cargo.toml at Root in Solana Playground

## The Problem
Solana Playground won't let you create files at the root folder directly.

## Solutions

### Solution 1: Use the Terminal/Console

1. **Click on the terminal/console** at the bottom
2. **Type this command:**

```bash
touch Cargo.toml
```

3. **Press Enter**
4. **The file should appear** in the file explorer at the root
5. **Click on it** to edit
6. **Paste the Cargo.toml content**

---

### Solution 2: Edit Existing Cargo.toml

If there's already a `Cargo.toml` somewhere:

1. **Search for it** in the file explorer (look at all levels)
2. **If you find one at root**, click it and edit it
3. **If it's in src/**, you might be able to move it:
   - Right-click → Cut
   - Click on root folder
   - Right-click → Paste

---

### Solution 3: Use Playground's File Menu

1. **Look for a menu** at the top (File, Edit, etc.)
2. **Try:** File → New File
3. **Or:** Right-click on the **project name** (not inside src/)
4. **Look for "New File"** option

---

### Solution 4: Check if Cargo.toml Already Exists

Sometimes Playground creates it automatically. Check:

1. **Look at the root level** in file explorer
2. **Check if there's already a `Cargo.toml`** (maybe hidden or not highlighted)
3. **If it exists**, just click it and edit

---

### Solution 5: Use the + Icon

1. **Make sure you're clicked on the ROOT** (the project name "Charity Coin")
2. **Look for a `+` icon** or **"New File"** button
3. **Click it**
4. **Name it `Cargo.toml`**

---

### Solution 6: Rename/Move Existing File

If there's a `Cargo.toml` in `src/`:

1. **Right-click** on `src/Cargo.toml`
2. **Look for "Cut"** or "Move" option
3. **Click on root folder** (project name)
4. **Right-click → Paste**
5. **Or try:** Right-click → Rename, then change path

---

### Solution 7: Use Command Palette (if available)

1. **Press `Ctrl+Shift+P`** (or `Cmd+Shift+P` on Mac)
2. **Type "New File"**
3. **Select it**
4. **Name it `Cargo.toml`**

---

### Solution 8: Check Playground's Default Structure

Sometimes Playground creates files differently. Try:

1. **Create a NEW Anchor project** (don't delete current one, just open new tab)
2. **Check where it puts Cargo.toml** by default
3. **Copy that structure** back to your project

---

## Most Likely Solution: Terminal Command

**Try this first:**

1. Click the **terminal/console** at the bottom
2. Type: `touch Cargo.toml`
3. Press Enter
4. File should appear at root
5. Click it and paste your content

---

## If Nothing Works: Alternative Approach

If you absolutely can't create it at root:

1. **Keep Cargo.toml in src/** (for now)
2. **Update the path in Cargo.toml** to: `path = "lib.rs"` (remove "src/")
3. **Try building** - Playground might be flexible

Or:

1. **Check Playground's documentation** for file structure
2. **Maybe it expects Cargo.toml in a different location**
3. **Try building with default template** first, then modify

---

## Quick Test

To verify where Playground expects Cargo.toml:

1. **Create a brand new Anchor project** in Playground
2. **Don't modify anything**
3. **Check where Cargo.toml is located**
4. **Use that same structure** for your project

Let me know which method works for you!

