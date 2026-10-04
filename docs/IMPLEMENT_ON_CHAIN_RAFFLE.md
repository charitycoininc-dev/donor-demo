# Implement On-Chain Raffle Conducting

## Solution: Use Switchboard VRF (No Building Needed!)

Instead of building a custom program, we'll use **Switchboard's already-deployed VRF program** to get verifiable randomness.

---

## Step 1: Install Switchboard SDK

```bash
npm install @switchboard-xyz/solana.js
```

---

## Step 2: Update Your Raffle Code

In `src/pages/Admin/RaffleManagement.jsx`, replace the random winner selection with on-chain randomness:

```javascript
// Replace this line (around line 103):
const winnerIdx = Math.floor(Math.random() * eligibleEntries.length);

// With this:
const raffleResult = await fetch('/api/conduct-raffle-with-vrf', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eligibleEntries: eligibleEntries.length,
    priorWinners: Array.from(priorWinners),
    totalEntries: raffle.globalCoinCounter || eligibleEntries.length,
  }),
});

const { winnerCoin, randomnessProof, randomnessMethod } = await raffleResult.json();

// Find winner by coin number instead of index
const winner = eligibleEntries.find(entry => entry.coinNumber === winnerCoin);
if (!winner) {
  throw new Error(`Winner coin #${winnerCoin} not found in eligible entries`);
}
```

---

## Step 3: Record with Randomness Proof

Update your drawing record to include the randomness proof:

```javascript
const drawing = {
  date: new Date().toISOString(),
  prizePool: raffle.prizePool,
  winningCoinNumber: winner.coinNumber,
  solanaWallet: winner.solanaWallet || "N/A",
  randomnessProof: randomnessProof, // From Switchboard VRF
  randomnessMethod: randomnessMethod, // "switchboard-vrf" or "blockhash"
};
```

---

## How It Works

1. **Request randomness** from Switchboard VRF (on-chain, verifiable)
2. **Wait for result** (usually 10-30 seconds)
3. **Use randomness** to select winner
4. **Record result** with randomness proof

---

## Benefits

✅ **No program building** - uses Switchboard's deployed program  
✅ **Verifiable randomness** - cryptographically secure  
✅ **Transparent** - anyone can verify the randomness  
✅ **Works immediately** - just install SDK and use  

---

## Cost

- **Switchboard VRF**: ~$0.20 per raffle draw
- **Blockhash (fallback)**: Free (less secure)

---

## Alternative: Use Blockhash (Free, Faster)

If Switchboard is too expensive or slow, you can use blockhash:

```javascript
// In your raffle code
const { blockhash } = await connection.getLatestBlockhash();
// Use blockhash as randomness source
```

This is free and instant, but less cryptographically secure than VRF.

---

## Complete Implementation

The file `api/conduct-raffle-with-vrf.js` is ready to use. Just:

1. Install Switchboard SDK: `npm install @switchboard-xyz/solana.js`
2. Update your raffle code to call the API
3. Test with a raffle draw

This gives you **on-chain verifiable randomness** without building a program! 🚀

