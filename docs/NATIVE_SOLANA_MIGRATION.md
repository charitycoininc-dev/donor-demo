# Native Solana Migration Guide

## Step-by-Step Migration from Anchor to Native Solana

This guide shows exactly how to convert your Anchor raffle program to native Solana.

---

## Step 1: Update Cargo.toml

Replace your current `Cargo.toml` with this:

```toml
[package]
name = "charity_coin_raffle"
version = "0.1.0"
description = "Charity Coin Raffle Program (Native Solana)"
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
solana-program = "~1.18"
borsh = "1.5"
```

---

## Step 2: Convert lib.rs to Native Solana

Here's your program converted to native Solana:

```rust
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
    sysvar::{clock::Clock, Sysvar},
};
use borsh::{BorshDeserialize, BorshSerialize};
use std::collections::BTreeSet;

// Program ID (update this to your actual program ID)
solana_program::declare_id!("55jjagC6eNWDtESgC32RKE3DEuc7U2nGUVHVzjyK1WjW");

// Instruction enum
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub enum RaffleInstruction {
    /// Initialize a new raffle
    /// Accounts: [raffle, authority, system_program]
    Initialize { auto_draw_amount: u64 },
    
    /// Update the prize pool
    /// Accounts: [raffle, authority]
    UpdatePrizePool { amount: u64 },
    
    /// Update total entries count
    /// Accounts: [raffle, authority]
    UpdateTotalEntries { total_entries: u64 },
    
    /// Conduct a raffle draw
    /// Accounts: [raffle, authority, clock]
    ConductDraw,
}

// Raffle account structure
#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Raffle {
    pub authority: Pubkey,
    pub prize_pool: u64,
    pub auto_draw_amount: u64,
    pub total_entries: u64,
    pub winners: Vec<u64>,
    pub last_draw: Option<i64>,
    pub created_at: i64,
}

impl Raffle {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 8 + 4 + (1000 * 8) + 9 + 8; // Same as Anchor version
    
    pub fn is_initialized(&self) -> bool {
        self.authority != Pubkey::default()
    }
}

// Error types
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RaffleError {
    Unauthorized = 6000,
    PrizePoolInsufficient = 6001,
    NoEligibleEntries = 6002,
    Overflow = 6003,
    Underflow = 6004,
    InvalidAccount = 6005,
    NotInitialized = 6006,
}

impl From<RaffleError> for ProgramError {
    fn from(e: RaffleError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl std::fmt::Display for RaffleError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            RaffleError::Unauthorized => write!(f, "Unauthorized"),
            RaffleError::PrizePoolInsufficient => write!(f, "Prize pool insufficient"),
            RaffleError::NoEligibleEntries => write!(f, "No eligible entries"),
            RaffleError::Overflow => write!(f, "Overflow"),
            RaffleError::Underflow => write!(f, "Underflow"),
            RaffleError::InvalidAccount => write!(f, "Invalid account"),
            RaffleError::NotInitialized => write!(f, "Not initialized"),
        }
    }
}

// Entry point
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Deserialize instruction
    let instruction = RaffleInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        RaffleInstruction::Initialize { auto_draw_amount } => {
            process_initialize(program_id, accounts, auto_draw_amount)
        }
        RaffleInstruction::UpdatePrizePool { amount } => {
            process_update_prize_pool(accounts, amount)
        }
        RaffleInstruction::UpdateTotalEntries { total_entries } => {
            process_update_total_entries(accounts, total_entries)
        }
        RaffleInstruction::ConductDraw => {
            process_conduct_draw(accounts)
        }
    }
}

// PDA helpers
fn find_raffle_pda(program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"raffle"], program_id)
}

// Initialize raffle
fn process_initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    auto_draw_amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let raffle_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let system_program_info = next_account_info(account_info_iter)?;

    // Verify PDA
    let (expected_pda, bump) = find_raffle_pda(program_id);
    if *raffle_info.key != expected_pda {
        return Err(RaffleError::InvalidAccount.into());
    }

    // Verify authority is signer
    if !authority_info.is_signer {
        return Err(RaffleError::Unauthorized.into());
    }

    // Verify system program
    if *system_program_info.key != solana_program::system_program::id() {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Get clock for timestamp
    let clock = Clock::get()?;

    // Initialize raffle account
    let mut raffle_data = raffle_info.data.borrow_mut();
    let raffle = Raffle {
        authority: *authority_info.key,
        prize_pool: 0,
        auto_draw_amount,
        total_entries: 0,
        winners: Vec::new(),
        last_draw: None,
        created_at: clock.unix_timestamp,
    };

    // Serialize and write
    let serialized = raffle.try_to_vec()
        .map_err(|_| ProgramError::InvalidAccountData)?;
    
    if raffle_data.len() < serialized.len() {
        return Err(ProgramError::InvalidAccountData);
    }
    
    raffle_data[..serialized.len()].copy_from_slice(&serialized);

    Ok(())
}

// Update prize pool
fn process_update_prize_pool(
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let raffle_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;

    // Verify authority
    if !authority_info.is_signer {
        return Err(RaffleError::Unauthorized.into());
    }

    // Deserialize raffle
    let mut raffle_data = raffle_info.data.borrow_mut();
    let mut raffle = Raffle::try_from_slice(&raffle_data)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Verify authority matches
    if raffle.authority != *authority_info.key {
        return Err(RaffleError::Unauthorized.into());
    }

    // Update prize pool
    raffle.prize_pool = raffle.prize_pool
        .checked_add(amount)
        .ok_or(RaffleError::Overflow)?;

    // Serialize back
    let serialized = raffle.try_to_vec()
        .map_err(|_| ProgramError::InvalidAccountData)?;
    raffle_data[..serialized.len()].copy_from_slice(&serialized);

    Ok(())
}

// Update total entries
fn process_update_total_entries(
    accounts: &[AccountInfo],
    total_entries: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let raffle_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;

    // Verify authority
    if !authority_info.is_signer {
        return Err(RaffleError::Unauthorized.into());
    }

    // Deserialize raffle
    let mut raffle_data = raffle_info.data.borrow_mut();
    let mut raffle = Raffle::try_from_slice(&raffle_data)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Verify authority matches
    if raffle.authority != *authority_info.key {
        return Err(RaffleError::Unauthorized.into());
    }

    // Update total entries
    raffle.total_entries = total_entries;

    // Serialize back
    let serialized = raffle.try_to_vec()
        .map_err(|_| ProgramError::InvalidAccountData)?;
    raffle_data[..serialized.len()].copy_from_slice(&serialized);

    Ok(())
}

// Conduct draw
fn process_conduct_draw(
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    let raffle_info = next_account_info(account_info_iter)?;
    let authority_info = next_account_info(account_info_iter)?;
    let clock_info = next_account_info(account_info_iter)?;

    // Verify authority
    if !authority_info.is_signer {
        return Err(RaffleError::Unauthorized.into());
    }

    // Verify clock sysvar
    if *clock_info.key != Clock::id() {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Get clock
    let clock = Clock::from_account_info(clock_info)?;

    // Deserialize raffle
    let mut raffle_data = raffle_info.data.borrow_mut();
    let mut raffle = Raffle::try_from_slice(&raffle_data)
        .map_err(|_| ProgramError::InvalidAccountData)?;

    // Verify authority matches
    if raffle.authority != *authority_info.key {
        return Err(RaffleError::Unauthorized.into());
    }

    // Verify draw conditions
    if raffle.prize_pool < raffle.auto_draw_amount {
        return Err(RaffleError::PrizePoolInsufficient.into());
    }

    if raffle.total_entries == 0 {
        return Err(RaffleError::NoEligibleEntries.into());
    }

    let eligible_entries = raffle.total_entries
        .checked_sub(raffle.winners.len() as u64)
        .ok_or(RaffleError::NoEligibleEntries)?;
    
    if eligible_entries == 0 {
        return Err(RaffleError::NoEligibleEntries.into());
    }

    // Generate random number (same logic as Anchor version)
    let slot = clock.slot;
    let mut seed = slot.wrapping_mul(31);
    seed = seed.wrapping_add(clock.unix_timestamp as u64);
    let random_index = (seed % eligible_entries) + 1;

    // Find winning coin number
    let winners_set: BTreeSet<u64> = raffle.winners.iter().cloned().collect();
    
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
    
    // Safety checks
    if candidate == 0 || candidate > raffle.total_entries {
        return Err(RaffleError::NoEligibleEntries.into());
    }
    if winners_set.contains(&candidate) {
        return Err(RaffleError::NoEligibleEntries.into());
    }

    // Record winner
    raffle.winners.push(candidate);
    raffle.prize_pool = raffle.prize_pool
        .checked_sub(raffle.auto_draw_amount)
        .ok_or(RaffleError::Underflow)?;
    raffle.last_draw = Some(clock.unix_timestamp);

    // Serialize back
    let serialized = raffle.try_to_vec()
        .map_err(|_| ProgramError::InvalidAccountData)?;
    raffle_data[..serialized.len()].copy_from_slice(&serialized);

    // Note: Event emission is not available in native Solana
    // You'll need to parse transaction logs or use program logs instead
    
    Ok(())
}
```

---

## Step 3: Build the Program

**On Windows (no admin needed):**

```powershell
# Install Solana CLI tools first (one-time setup)
# Download from: https://github.com/solana-labs/solana/releases

# Build the program
cargo build-sbf --manifest-path programs/charity-coin-raffle/Cargo.toml

# Deploy to devnet
solana program deploy target/deploy/charity_coin_raffle.so --url devnet
```

---

## Step 4: Update Client Code (JavaScript)

Instead of using Anchor client, use native `@solana/web3.js`:

```javascript
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
} from '@solana/web3.js';
import { serialize } from 'borsh';

// Program ID
const PROGRAM_ID = new PublicKey('55jjagC6eNWDtESgC32RKE3DEuc7U2nGUVHVzjyK1WjW');

// Instruction enum (matches Rust)
const RaffleInstruction = {
  Initialize: 0,
  UpdatePrizePool: 1,
  UpdateTotalEntries: 2,
  ConductDraw: 3,
};

// Find PDA
async function findRafflePDA() {
  return PublicKey.findProgramAddress(
    [Buffer.from('raffle')],
    PROGRAM_ID
  );
}

// Create initialize instruction
async function createInitializeInstruction(autoDrawAmount, payer) {
  const [rafflePDA] = await findRafflePDA();
  
  const instructionData = {
    variant: RaffleInstruction.Initialize,
    autoDrawAmount,
  };
  
  const data = Buffer.from([
    RaffleInstruction.Initialize,
    ...Buffer.from(autoDrawAmount.toString(16).padStart(16, '0'), 'hex'),
  ]);
  
  return {
    keys: [
      { pubkey: rafflePDA, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  };
}

// Create conduct draw instruction
async function createConductDrawInstruction(authority) {
  const [rafflePDA] = await findRafflePDA();
  
  const data = Buffer.from([RaffleInstruction.ConductDraw]);
  
  return {
    keys: [
      { pubkey: rafflePDA, isSigner: false, isWritable: true },
      { pubkey: authority, isSigner: true, isWritable: false },
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false },
    ],
    programId: PROGRAM_ID,
    data,
  };
}

// Execute transaction
async function conductDraw(connection, wallet) {
  const instruction = await createConductDrawInstruction(wallet.publicKey);
  const transaction = new Transaction().add(instruction);
  
  const signature = await connection.sendTransaction(
    transaction,
    [wallet],
    { skipPreflight: false }
  );
  
  await connection.confirmTransaction(signature);
  return signature;
}
```

---

## Benefits of This Approach

1. ✅ **No Admin Rights Needed** - Direct cargo build-sbf
2. ✅ **Simpler Dependencies** - Just solana-program and borsh
3. ✅ **Better Control** - Understand every line of code
4. ✅ **Smaller Binary** - No Anchor framework overhead
5. ✅ **Windows Compatible** - Works without symlinks

---

## Migration Checklist

- [ ] Update `Cargo.toml` with native dependencies
- [ ] Convert `lib.rs` to native Solana code
- [ ] Test build with `cargo build-sbf`
- [ ] Deploy to devnet
- [ ] Update API endpoints to use native web3.js
- [ ] Test all instructions
- [ ] Update documentation

---

## Need Help?

If you want me to:
1. Complete the full migration
2. Create helper functions for client-side
3. Add tests
4. Set up build scripts

Let me know!

