# Raffle Implementation Cost Comparison

## Scenario: 100 Updates/Month + 1 Draw/Month

### Option 1: Current Design (Parameter-Based)
- Prize pool updates: ~50/month
- Raffle draws: 1/month
- **Total**: 51 transactions/month
- **Cost**: 51 × 0.00001 SOL = 0.00051 SOL/month = **~$0.09/month**

### Option 2: Real-Time On-Chain Sync (Proposed)
- Prize pool updates: ~50/month
- Total entries updates: ~50/month
- Raffle draws: 1/month
- **Total**: 101 transactions/month
- **Cost**: 101 × 0.00001 SOL = 0.00101 SOL/month = **~$0.18/month**

### Option 3: Store All Entries On-Chain (Not Recommended)
- 1000 entries stored: 2 SOL = **$368** (one-time)
- Updates: Same as Option 2
- **Total**: $368 + $0.18/month = **$370.16 first year**

## Annual Cost Comparison

| Design | Year 1 | Year 2+ | 5-Year Total |
|--------|--------|---------|--------------|
| Current (Parameter) | $1.08 | $1.08 | $5.40 |
| Real-Time Sync | $2.16 | $2.16 | $10.80 |
| Store All Entries | $370.16 | $2.16 | $378.64 |

## Recommendation

**Real-Time Sync (Option 2)** is recommended because:
- ✅ Only **$0.09/month more** than current design
- ✅ Provides **real-time transparency** (anyone can verify on-chain)
- ✅ **Simpler draw logic** (no parameter passing)
- ✅ **Audit trail** (all changes recorded)
- ✅ Still **170x cheaper** than storing all entries

The additional $0.09/month is negligible compared to the benefits of having a single, verifiable source of truth on-chain.
