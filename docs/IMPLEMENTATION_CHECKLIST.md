# Real-Time On-Chain Raffle Sync - Implementation Checklist

## ✅ Completed

1. **Anchor Program Updates**
   - ✅ Added `total_entries` back to `Raffle` struct
   - ✅ Added `update_total_entries()` function
   - ✅ Updated `conduct_draw()` to use on-chain `total_entries` (no parameter)
   - ✅ Updated account size calculation

2. **API Endpoints**
   - ✅ Created `/api/update-raffle-entries` endpoint
   - ✅ Updated `/api/conduct-raffle-draw` to use on-chain state (no parameter)
   - ✅ Fixed imports (added `anchor` to both files)

3. **Integration Points**
   - ✅ Updated `DataManagement.jsx` to sync prize pool and total entries on donation approval
   - ✅ Added error handling for on-chain updates (graceful fallback to Firestore)

## 🔄 Remaining Tasks

### 1. Update `conductMultipleRaffles` (Optional Enhancement)
Currently uses Firestore-based selection. Could optionally:
- Call on-chain draw via `/api/conduct-raffle-draw`
- Use on-chain winner, then sync back to Firestore
- **Recommendation**: Keep current Firestore-based logic (simpler, faster)

### 2. Update Manual Raffle Draw (RaffleManagement.jsx)
The `runRaffleDrawing` function could optionally:
- Call `/api/conduct-raffle-draw` for on-chain verification
- Use on-chain winner instead of JavaScript random selection
- **Recommendation**: Keep current logic, but add on-chain verification option

### 3. Handle Airdrops/Volunteer Rewards
When coins are issued outside of donations:
- Create endpoint or function to update only `total_entries`
- Call `/api/update-raffle-entries` with new `globalCoinCounter - 1`
- **Status**: Endpoint exists, needs integration point

### 4. Testing & Deployment
- [ ] Deploy updated Anchor program to devnet
- [ ] Test prize pool updates
- [ ] Test total entries updates
- [ ] Test raffle draws with on-chain state
- [ ] Verify cost estimates in production

## Cost Verification

After deployment, monitor:
- Transaction fees per update (~0.00001 SOL)
- Total monthly transactions
- Actual monthly cost vs estimated ($0.18/month)

## Notes

- Firestore remains primary source of truth
- On-chain updates are asynchronous (don't block operations)
- If on-chain update fails, Firestore state still correct
- On-chain provides transparency and verification
