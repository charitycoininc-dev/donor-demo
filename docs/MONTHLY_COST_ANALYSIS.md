# Monthly Cost Analysis: 100 Donations/Day

## Assumptions
- **Volume**: 100 donations per day
- **Monthly Volume**: 3,000 donations (100 × 30 days)
- **SOL Price**: $184 USD
- **Network**: Solana devnet/mainnet

## Cost Breakdown Per Donation

### 1. Proof-of-Donation Transaction
- **Type**: Memo instruction (simple transaction)
- **Cost**: ~0.00001 SOL (~$0.00184)
- **Frequency**: Every donation

### 2. Charity Coin Token Issuance
- **Type**: SPL Token transfer
- **Cost**: ~0.000005 SOL (~$0.00092)
- **Frequency**: Every donation (when tokens are issued)
- **Note**: Creating token account (one-time per user) costs ~0.002 SOL (~$0.368)

### 3. Raffle Verification (When Raffles Are Drawn)
- **Type**: Memo instruction
- **Cost**: ~0.00001 SOL (~$0.00184)
- **Frequency**: Only when raffle is drawn (not per donation)
- **Estimated**: ~10-30 raffles/month (depending on trigger amount)

## Monthly Cost Calculation

### Scenario A: All Users Have Existing Token Accounts (Best Case)
```
Proof-of-Donation: 3,000 × $0.00184 = $5.52
Token Transfers:   3,000 × $0.00092 = $2.76
Raffle Verification: 20 × $0.00184 = $0.04
─────────────────────────────────────────────
Total Monthly Cost: ~$8.32/month
```

### Scenario B: 20% New Users, 80% Existing (Realistic)
```
Proof-of-Donation: 3,000 × $0.00184 = $5.52
Token Transfers (existing): 2,400 × $0.00092 = $2.21
Token Account Creation: 600 × $0.368 = $220.80
Token Transfers (new): 600 × $0.00092 = $0.55
Raffle Verification: 20 × $0.00184 = $0.04
─────────────────────────────────────────────
Total Monthly Cost: ~$229.12/month
```

### Scenario C: 50% New Users, 50% Existing (Worst Case)
```
Proof-of-Donation: 3,000 × $0.00184 = $5.52
Token Transfers (existing): 1,500 × $0.00092 = $1.38
Token Account Creation: 1,500 × $0.368 = $552.00
Token Transfers (new): 1,500 × $0.00092 = $1.38
Raffle Verification: 20 × $0.00184 = $0.04
─────────────────────────────────────────────
Total Monthly Cost: ~$560.32/month
```

## Cost Optimization Strategies

### 1. **Pre-create Token Accounts**
- Create token accounts when users sign up
- One-time cost: ~$0.368 per user
- **Benefit**: Reduces per-donation cost to ~$0.00276

### 2. **Batch Transactions** (Future Enhancement)
- Record multiple donation proofs in one transaction
- Could reduce costs by 50-70%
- **Benefit**: Lower per-donation cost

### 3. **Gas Optimization**
- Use versioned transactions (lower fees)
- Optimize transaction size
- **Benefit**: 10-20% cost reduction

### 4. **Lazy Token Account Creation**
- Only create accounts when absolutely necessary
- Use existing accounts when possible
- **Benefit**: Lower upfront costs

## Monthly Cost Summary

| Scenario | Monthly Cost | Cost Per Donation |
|----------|-------------|-------------------|
| All Existing Users | **$8.32** | $0.00277 |
| 20% New Users | **$229.12** | $0.076 |
| 50% New Users | **$560.32** | $0.187 |

## Realistic Monthly Estimate

**Recommended Budget: $200-300/month**
- Assumes 20-30% new users
- Accounts for occasional raffle verifications
- Includes buffer for network fluctuations

## Cost Per Donation (After Optimization)

Once all users have token accounts:
- **Proof-of-Donation**: $0.00184
- **Token Transfer**: $0.00092
- **Total**: **~$0.00276 per donation**

At 3,000 donations/month: **~$8.28/month** (very affordable!)

## Additional Costs to Consider

### Infrastructure (Non-Solana)
- **Firebase/Firestore**: Free tier covers most usage, ~$25-50/month for 3K donations
- **Vercel Hosting**: Free tier covers most API calls, ~$20/month for high traffic
- **Domain/SSL**: ~$10-15/year
- **Email Service**: ~$10-20/month (if using SendGrid, etc.)

### Total Platform Costs
- **Blockchain (Solana)**: $8-300/month (depending on new users)
- **Infrastructure**: $55-90/month
- **Total**: **~$63-390/month**

## Cost Efficiency Tips

1. **Pre-fund Treasury Wallet**: Keep 1-2 SOL in treasury for transaction fees
2. **Monitor SOL Balance**: Set up alerts if balance drops below 0.1 SOL
3. **Batch Operations**: When possible, batch multiple operations
4. **Optimize First**: Create token accounts proactively during signup

## Conclusion

At 100 donations/day:
- **Best Case** (all existing users): ~$8/month
- **Realistic Case** (20% new users): ~$229/month
- **Worst Case** (50% new users): ~$560/month

**Recommendation**: Budget $200-300/month for blockchain costs, decreasing to ~$10/month once user base is established.

