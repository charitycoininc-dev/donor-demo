# Proof-of-Donation System

## Overview

The Proof-of-Donation system records every confirmed donation on the Solana blockchain, creating a permanent, verifiable record that anyone can audit.

## How It Works

### 1. **Donation Approval Process**
When an admin approves a donation:
1. Donation is marked as "confirmed" in Firestore
2. Charity coins are issued to the user
3. Raffle entries are created
4. **Proof-of-Donation is recorded on-chain** (new!)

### 2. **On-Chain Recording**
The system uses Solana's **Memo Program** to record donation metadata:
- **Transaction Type**: `DONATION_PROOF`
- **Donation ID**: Unique Firestore document ID
- **Amount**: Formatted as "$250.00" (human-readable)
- **Nonprofit Name**: Which nonprofit received the donation
- **Donor Wallet**: Donor's Solana wallet address
- **Coins Earned**: Number of charity coins issued
- **Timestamp**: Formatted as "11/4/2025, 2:50:23 AM"
- **Network**: devnet/mainnet

### 3. **Data Format**
The on-chain instruction data is stored as JSON:
```json
{
  "type": "DONATION_PROOF",
  "donationId": "abc123...",
  "amount": "$250.00",
  "amountRaw": 250,
  "nonprofitName": "The Black History Foundation",
  "donorWallet": "ABC...XYZ",
  "donorEmail": "donor@example.com",
  "coinsEarned": 250,
  "timestamp": "11/4/2025, 2:50:23 AM",
  "timestampUnix": 1730703023000,
  "network": "devnet"
}
```

## Implementation

### API Endpoint
**`/api/record-donation-proof`**

**Request:**
```json
{
  "donationId": "abc123",
  "amount": 250,
  "nonprofitName": "The Black History Foundation",
  "donorWallet": "ABC...XYZ",
  "donorEmail": "donor@example.com",
  "coinsEarned": 250
}
```

**Response:**
```json
{
  "success": true,
  "signature": "5j7s...",
  "url": "https://solscan.io/tx/5j7s...?cluster=devnet",
  "message": "Donation proof recorded on-chain. Transaction: 5j7s..."
}
```

### Integration Points

1. **Admin Approval** (`src/pages/Admin/DataManagement.jsx`)
   - Calls `/api/record-donation-proof` after donation is confirmed
   - Updates donation document with `onChainProofSignature` and `onChainProofUrl`
   - Updates user transaction with proof link

2. **Display Links**
   - **Admin Donations Table**: Shows "Proof" link next to confirmed donations
   - **User Wallet Page**: Shows "Proof" link for donation transactions
   - **Admin Transactions**: Can show proof links (future enhancement)

## Benefits

### 1. **Transparency**
- Every donation is permanently recorded on-chain
- Anyone can verify donations via Solscan
- Immutable record of charitable giving

### 2. **Trust & Verification**
- Donors can prove their donations
- Nonprofits can verify funds received
- Platform can demonstrate transparency

### 3. **Audit Trail**
- Complete history of all donations
- Verifiable by third parties
- Useful for tax purposes and compliance

### 4. **Marketing Value**
- "Your donations are recorded on blockchain"
- "Fully transparent, verifiable giving"
- Builds trust with potential donors

## Cost

- **Transaction Fee**: ~0.00001 SOL per donation proof
- **Storage**: No additional storage (uses memo instruction data)
- **Scalability**: Can handle thousands of donations per day

## Verification

### Viewing on Solscan
1. Get the transaction signature from the donation record
2. Visit: `https://solscan.io/tx/{signature}?cluster=devnet`
3. Click on "Instruction Data" tab
4. View the JSON metadata in the memo instruction

### Example Verification URL
```
https://solscan.io/tx/5j7sK8L9M0N1P2Q3R4S5T6U7V8W9X0Y1Z2?cluster=devnet
```

## Error Handling

The system is designed to be **non-critical**:
- If blockchain recording fails, donation still succeeds
- Donation is processed normally in Firestore
- Proof recording is logged but doesn't block approval
- Errors are logged for debugging

This ensures the platform continues to function even if Solana network is unavailable.

## Future Enhancements

1. **Batch Recording**: Record multiple donations in one transaction
2. **NFT Certificates**: Mint NFT certificates for significant donations
3. **Verification Badges**: Issue on-chain badges for verified donors
4. **Cross-Chain**: Support other blockchains (Ethereum, Polygon)
5. **Public API**: Allow third parties to query donation proofs

