# Charity Coin API Documentation

This directory contains serverless API endpoints that power the Charity Coin platform—a gamified charitable giving platform that transforms donations into engaging community experiences.

## 🎯 What is Charity Coin?

**Charity Coin** is a blockchain-powered platform that gamifies charitable giving by:

- **Enabling donations** to vetted nonprofits through The Black History Foundation
- **Issuing digital Charity Coins** as rewards for all donations (1 coin = 1 perpetual entry, either raffle or sweepstakes depending on state eligibility)
- **Conducting transparent raffles** (raffle-eligible states) and sweepstakes (non-raffle states) where winners receive prizes funded by the community
- **Maintaining full transparency** with on-chain verification of all donations and raffle results

### The 50/50 Model (Raffle-Eligible States)

For donors in raffle-eligible states, when users donate:
- **50%** goes directly to the chosen nonprofit organization
- **50%** funds the prize pool for community raffles
- **Charity Coins are issued** (1 coin per $1 donated)
- **Raffle entries are assigned** (1 entry per coin)

This creates a sustainable model where nonprofits receive funding while donors have the chance to win prizes, making charitable giving more engaging and rewarding.

### State-Based Eligibility & Sweepstakes (Non-Raffle States)

The platform automatically determines if a donor is in a raffle-eligible state based on their location. For donors in states where 50/50 raffles are not permitted:

- **100% tax-deductible donation**: The entire donation amount goes to the nonprofit (not split 50/50)
- **Charity Coins are issued**: Donors still receive Charity Coins (1 coin per $1 donated)
- **Sweepstakes entries instead of raffle entries**: Each Charity Coin provides a sweepstakes entry (not a raffle entry)
- **Mail-in option**: The sweepstakes includes a no-purchase-necessary mail-in entry option for legal compliance

**Important**: 
- **All donors receive Charity Coins** regardless of state eligibility
- The difference is the type of entry: **raffle entries** (raffle-eligible states) vs **sweepstakes entries** (non-raffle states)
- Mail-in entrants (who don't make donations) do not receive Charity Coins

## 🔄 How Charity Coin Works

### 1. Donation Flow

1. **User Submits Donation**
   - User selects a nonprofit and enters donation amount
   - Donation is saved to Firebase Firestore with status "pending"
   - Initial confirmation email sent to donor
   - Admin notification email sent for review

2. **State Eligibility Check**
   - System determines if donor is in a raffle-eligible state
   - **Raffle-Eligible States**: Donation processed as 50/50 split
   - **Non-Raffle States**: Donation processed as 100% tax-deductible, enters sweepstakes

3. **Admin Approval**
   - Admin reviews donation and approves/rejects it
   - If approved:
     - **For Raffle-Eligible States**:
       - Charity Coins are issued to the user (1 coin per $1 donated)
       - Raffle entries are assigned (1 entry per coin)
       - 50% of donation goes to nonprofit, 50% to prize pool
     - **For Non-Raffle States**:
       - Charity Coins are issued to the user (1 coin per $1 donated)
       - Sweepstakes entries are assigned (1 entry per coin, instead of raffle entries)
       - 100% of donation goes to nonprofit (fully tax-deductible)
     - Donation proof is recorded on Solana blockchain for transparency
     - Approval confirmation email sent with rewards summary (including state-specific information)

4. **Coin Issuance** (All States)
   - Charity Coins are issued as Solana SPL tokens to all donors
   - If user doesn't have a wallet, a custodial wallet is created
   - Private keys are encrypted (AES-256) before storage
   - **For Raffle-Eligible States**: Each coin represents a perpetual raffle entry tied to a unique coin number
   - **For Non-Raffle States**: Each coin represents a sweepstakes entry (not a raffle entry)
   - **Note**: Mail-in entrants (who don't make donations) do not receive Charity Coins

### 2. Raffle System (Raffle-Eligible States Only)

- **Perpetual Entries**: Each Charity Coin provides a permanent raffle entry
- **Unique Coin Numbers**: Each coin gets a sequential number (1, 2, 3, ...)
- **Automatic Draws**: Raffles trigger when prize pool reaches threshold
- **Transparent Selection**: Uses verifiable randomness (blockhash or VRF)
- **Winner Exclusion**: Previous winners cannot win again
- **On-Chain Verification**: Raffle results recorded on Solana blockchain
- **State Restrictions**: Only available to donors in raffle-eligible states

### 3. Sweepstakes System (Non-Raffle States)

- **100% Tax-Deductible**: Entire donation goes to nonprofit
- **Charity Coins Issued**: Donors receive Charity Coins (1 coin per $1 donated)
- **Sweepstakes Entries**: Each Charity Coin provides a sweepstakes entry (instead of a raffle entry)
- **Mail-In Option**: No-purchase-necessary mail-in entries available for legal compliance (mail-in entrants don't receive Charity Coins)
- **Separate Prize Pool**: Sweepstakes has its own prize pool separate from raffles
- **Compliance**: Designed to comply with state laws prohibiting 50/50 raffles

### 4. Reward Tiers

Users progress through tiers based on total donations:
- **Bronze**: Entry level
- **Silver**: Better multipliers
- **Gold**: Enhanced benefits
- **Platinum**: Maximum rewards

## 📡 API Endpoints Overview

The API endpoints in this directory support the Charity Coin platform:

### Email Services
- **`send-contact-email.js`**: Handles contact form submissions
- **`send-donation-emails.js`**: Sends donation-related emails (initial, approval, rejection)
- **`send-raffle-notification.js`**: Notifies admins of raffle drawings

### Blockchain Operations
- **`issue-charity-coins.js`**: Issues Charity Coins as Solana SPL tokens, creates custodial wallets
- **`decrypt-wallet-key.js`**: Decrypts wallet private keys (admin only)
- **`record-donation-proof.js`**: Records donation proof on Solana blockchain
- **`record-raffle-verification.js`**: Records raffle results on-chain for transparency

### Raffle Management
- **`conduct-raffle-draw.js`**: Conducts raffle using on-chain Solana program
- **`conduct-raffle-with-vrf.js`**: Conducts raffle with verifiable randomness
- **`update-raffle-entries.js`**: Updates raffle entry counts (off-chain tracking)
- **`update-raffle-state.js`**: Updates raffle state (off-chain tracking)

## 🏗️ Technology Stack

- **Frontend**: React 19, Vite, React Router
- **Backend**: Firebase (Firestore, Authentication)
- **Blockchain**: Solana (SPL tokens, on-chain verification)
- **Email**: Resend.com
- **Deployment**: Vercel serverless functions

## 🔐 Security Features

- **Wallet Encryption**: Private keys encrypted with AES-256 before storage
- **On-Chain Verification**: All donations and raffles verified on Solana blockchain
- **Admin Oversight**: All donations require admin approval before coin issuance
- **Transparent Raffles**: Cryptographic randomness ensures fair selection

---

## Email API Setup

This API endpoint handles sending emails via Resend.com when users submit the contact form.

## Setup Instructions

### 1. Environment Variable

You need to set the `RESEND_API_KEY` environment variable:

**For Vercel Deployment:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new environment variable:
   - **Key:** `RESEND_API_KEY`
   - **Value:** `re_xxxxxxxx` (your Resend API key)
   - **Environment:** Production, Preview, Development (select all)

**For Local Development:**
Create a `.env.local` file in the root directory:
```
RESEND_API_KEY=re_xxxxxxxx
```

### 2. Email Domain Verification (Optional but Recommended)

Currently, emails are sent from `onboarding@resend.dev`. For production use, you should:
1. Verify your domain in Resend.com dashboard
2. Update the `from` field in `api/send-contact-email.js` to use your verified domain
3. Example: `Charity Coin <noreply@theblackhistoryfoundation.org>`

### 3. How It Works

When a user submits the contact form:
1. The form data is saved to Firebase Firestore
2. Two emails are sent via Resend:
   - **Notification email** to `Michael.Evans@TheBlackHistoryFoundation.org` with the submission details
   - **Confirmation email** to the submitter thanking them and including their message

### 4. Testing

To test the API endpoint locally, you'll need Vercel CLI:
```bash
npm install -g vercel
vercel dev
```

Then test with:
```bash
curl -X POST http://localhost:3000/api/send-contact-email \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","subject":"Test","message":"This is a test message"}'
```

## Wallet Encryption

The `issue-charity-coins.js` endpoint uses AES-256 encryption to encrypt custodial wallet private keys before storing them in Firestore.

### Environment Variable

Set the `WALLET_ENCRYPTION_KEY` environment variable in Vercel:

**For Vercel Deployment:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new environment variable:
   - **Key:** `WALLET_ENCRYPTION_KEY`
   - **Value:** A secure 32+ character encryption key
   - **Environment:** Production, Preview, Development (select all)

**Generate a Secure Key:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**For Local Development:**
Create a `.env.local` file in the root directory:
```
WALLET_ENCRYPTION_KEY=your-secure-32-plus-character-encryption-key-here
```

**Security Notes:**
- The encryption key must be at least 32 characters long
- Never commit the encryption key to version control
- Use a different key for production and development
- Rotate the key periodically for enhanced security

