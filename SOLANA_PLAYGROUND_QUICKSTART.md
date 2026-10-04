# 🚀 Solana Playground Quick Start - Copy & Paste Ready

## Step 1: Open Solana Playground

👉 **Go to:** https://beta.solpg.io/

Click **"Create New Project"** → Select **"Anchor"**

---

## Step 2: Copy Your lib.rs Code

**In Solana Playground, find `src/lib.rs` and replace ALL code with this:**

```rust
use anchor_lang::prelude::*;
use std::collections::BTreeSet;

declare_id!("55jjagC6eNWDtESgC32RKE3DEuc7U2nGUVHVzjyK1WjW");

#[program]
pub mod charity_coin_raffle {
    use super::*;

    /// Initialize a new raffle
    pub fn initialize_raffle(
        ctx: Context<InitializeRaffle>,
        auto_draw_amount: u64,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        raffle.authority = ctx.accounts.authority.key();
        raffle.prize_pool = 0;
        raffle.auto_draw_amount = auto_draw_amount;
        raffle.total_entries = 0;
        raffle.winners = Vec::new();
        raffle.last_draw = None;
        raffle.created_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    /// Update the prize pool (called when donations are approved)
    pub fn update_prize_pool(
        ctx: Context<UpdatePrizePool>,
        amount: u64,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        raffle.prize_pool = raffle.prize_pool
            .checked_add(amount)
            .ok_or(RaffleError::Overflow)?;
        Ok(())
    }

    /// Update total entries count
    /// Called whenever new coins are issued (donations, airdrops, volunteer rewards)
    pub fn update_total_entries(
        ctx: Context<UpdateTotalEntries>,
        total_entries: u64,
    ) -> Result<()> {
        let raffle = &mut ctx.accounts.raffle;
        raffle.total_entries = total_entries;
        Ok(())
    }

    /// Conduct a raffle draw
    /// Uses on-chain total_entries (no parameter needed)
    /// Returns the winning coin number (1-indexed)
    /// Off-chain service must map this to wallet address via Firestore
    pub fn conduct_draw(ctx: Context<ConductDraw>) -> Result<u64> {
        let raffle = &mut ctx.accounts.raffle;
        
        // Verify draw conditions
        require!(
            raffle.prize_pool >= raffle.auto_draw_amount,
            RaffleError::PrizePoolInsufficient
        );

        require!(raffle.total_entries > 0, RaffleError::NoEligibleEntries);

        let eligible_entries = raffle.total_entries
            .checked_sub(raffle.winners.len() as u64)
            .ok_or(RaffleError::NoEligibleEntries)?;
        
        require!(eligible_entries > 0, RaffleError::NoEligibleEntries);

        // Generate random number using slot and clock
        // This is pseudorandom but unpredictable before execution
        let clock = Clock::get()?;
        let slot = clock.slot;
        
        // Use slot and unix_timestamp for randomness seed
        let mut seed = slot.wrapping_mul(31);
        seed = seed.wrapping_add(clock.unix_timestamp as u64);
        
        // Generate random number in range [1, eligible_entries]
        let random_index = (seed % eligible_entries) + 1;
        
        // Convert index to coin number, skipping winners
        // Since coin numbers are 1-indexed and sequential, we need to map
        // the random index to the actual coin number, accounting for excluded winners
        let winners_set: BTreeSet<u64> = raffle.winners.iter().cloned().collect();
        
        // Find the nth non-winning coin number
        let mut candidate = 0u64;
        let mut non_winner_count = 0u64;
        
        for coin_num in 1..=raffle.total_entries {
            if !winners_set.contains(&coin_num) {
                non_winner_count += 1;
                if non_winner_count == random_index {
                    candidate = coin_num;
                    break;
                }
            }
        }
        
        // Safety check
        require!(candidate > 0 && candidate <= raffle.total_entries, RaffleError::NoEligibleEntries);
        require!(!winners_set.contains(&candidate), RaffleError::NoEligibleEntries);

        // Record winner
        raffle.winners.push(candidate);
        raffle.prize_pool = raffle.prize_pool
            .checked_sub(raffle.auto_draw_amount)
            .ok_or(RaffleError::Underflow)?;
        raffle.last_draw = Some(clock.unix_timestamp);

        // Emit event
        emit!(RaffleDrawEvent {
            raffle: raffle.key(),
            winner_coin: candidate,
            prize_amount: raffle.auto_draw_amount,
            drawn_at: clock.unix_timestamp,
        });

        Ok(candidate)
    }
}

#[derive(Accounts)]
pub struct InitializeRaffle<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Raffle::LEN,
        seeds = [b"raffle"],
        bump
    )]
    pub raffle: Account<'info, Raffle>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePrizePool<'info> {
    #[account(
        mut,
        has_one = authority @ RaffleError::Unauthorized
    )]
    pub raffle: Account<'info, Raffle>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateTotalEntries<'info> {
    #[account(
        mut,
        has_one = authority @ RaffleError::Unauthorized
    )]
    pub raffle: Account<'info, Raffle>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ConductDraw<'info> {
    #[account(
        mut,
        has_one = authority @ RaffleError::Unauthorized
    )]
    pub raffle: Account<'info, Raffle>,
    pub authority: Signer<'info>,
    /// Clock sysvar for randomness seed
    /// Note: For production, consider using Switchboard VRF or Pyth Network for true randomness
    pub clock: Sysvar<'info, Clock>,
}

#[account]
pub struct Raffle {
    pub authority: Pubkey,           // Admin wallet that can trigger draws
    pub prize_pool: u64,              // Current prize pool (in lamports/SOL)
    pub auto_draw_amount: u64,        // Trigger amount for automatic draw
    pub total_entries: u64,           // Total eligible coin numbers (1 to total_entries)
    pub winners: Vec<u64>,            // List of winning coin numbers (excluded from future draws)
    pub last_draw: Option<i64>,       // Timestamp of last draw
    pub created_at: i64,              // Creation timestamp
}

impl Raffle {
    // Account size calculation
    // Base: 8 (discriminator)
    // authority: 32
    // prize_pool: 8
    // auto_draw_amount: 8
    // total_entries: 8
    // winners: 4 (length) + (winners.len() * 8)
    // last_draw: 1 + 8 (Option<i64>)
    // created_at: 8
    // Total: 8 + 32 + 8 + 8 + 8 + 4 + (max_winners * 8) + 9 + 8 = 93 + (max_winners * 8)
    // For ~1000 winners: 93 + 8000 = 8093 bytes (~8KB)
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 4 + (1000 * 8) + 9 + 8;
}

#[event]
pub struct RaffleDrawEvent {
    pub raffle: Pubkey,
    pub winner_coin: u64,
    pub prize_amount: u64,
    pub drawn_at: i64,
}

#[error_code]
pub enum RaffleError {
    #[msg("Unauthorized: Only raffle authority can perform this action")]
    Unauthorized,
    #[msg("Prize pool is insufficient for draw")]
    PrizePoolInsufficient,
    #[msg("No eligible entries remaining")]
    NoEligibleEntries,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Arithmetic underflow")]
    Underflow,
}
```

---

## Step 3: Update Cargo.toml

**In Solana Playground, find `Cargo.toml` and make sure it has:**

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

---

## Step 4: Build! 🎯

1. Click the **"Build"** button (or press `Ctrl+Shift+B`)
2. Wait ~30-60 seconds
3. You should see: ✅ **Build successful**

---

## Step 5: Deploy to Devnet 🚀

1. Make sure you're on **Devnet** (check top-right corner)
2. Click **"Deploy"** button
3. Playground will automatically:
   - Airdrop SOL if needed
   - Deploy your program
   - Show transaction signature

---

## Step 6: Download IDL 📥

1. In the file explorer, find: `target/idl/charity_coin_raffle.json`
2. Right-click → **Download**
3. Save it to your project (you can replace the existing one if you want)

---

## Step 7: Note Your Program ID 📝

After deployment, **copy the Program ID** from the output.

**If it's different from `55jjagC6eNWDtESgC32RKE3DEuc7U2nGUVHVzjyK1WjW`, update:**
- Your local `programs/charity-coin-raffle/src/lib.rs` (the `declare_id!` line)
- Your API files (replace `YOUR_RAFFLE_PROGRAM_ID_HERE`)

---

## ✅ That's It!

Your program is now built and deployed without needing admin rights on Windows!

**Next time you need to build:**
1. Make changes in Playground (or copy your local code)
2. Click "Build"
3. Click "Deploy" (if you made changes)

---

## 💡 Tips

- **Save your Playground project:** You can save it in Playground for future use
- **Keep local code in sync:** After building in Playground, you can copy code back to your local files
- **Use Playground for testing:** You can test instructions directly in Playground

---

## 🆘 Troubleshooting

**Build fails?**
- Check for syntax errors (red underlines)
- Make sure `Cargo.toml` dependencies are correct

**Deploy fails?**
- Make sure you're on Devnet
- Try again (sometimes network issues)

**Need help?** Check the Playground console for error messages!

