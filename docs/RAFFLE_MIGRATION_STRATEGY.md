# Raffle Migration Strategy: Firestore to Solana

## Migration Approach: Phased Rollout

### Phase 1: Research & Proof of Concept (Current)
- ✅ Document current raffle system
- ✅ Explore Solana program options
- ⏳ Create simple Anchor program demo
- ⏳ Test basic raffle operations on devnet

### Phase 2: Hybrid Implementation
- Store raffle state on-chain
- Keep detailed logs in Firestore
- Both systems update simultaneously
- Compare costs and performance

### Phase 3: Full Migration
- Move all raffle operations on-chain
- Firestore becomes read-only cache
- On-chain becomes source of truth

## Key Decisions Needed

1. **Randomness Source**: Switchboard VRF, Pyth, or chain-based?
2. **Storage Strategy**: Individual accounts vs. Merkle tree?
3. **Cost Tolerance**: How much SOL per raffle is acceptable?
4. **Timeline**: How quickly should this be implemented?

## Next Immediate Step

Create a minimal Anchor program to demonstrate:
- Creating a raffle on-chain
- Registering a coin entry
- Conducting a simple draw
- Retrieving raffle state

This will help evaluate feasibility and costs.
