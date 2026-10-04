/**
 * Update Raffle State API
 * 
 * NOTE: We're using off-chain raffles with blockchain verification now.
 * This endpoint is kept for backward compatibility but doesn't update on-chain state.
 * Prize pool and entries are tracked in Firestore, with verification recorded on-chain.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { action, amount } = req.body;

    // Since we're using off-chain raffles, we don't need to update on-chain state
    // This endpoint is kept for backward compatibility but just returns success
    if (action === 'update_prize_pool') {
      console.log(`[UpdateRaffleState] Prize pool update requested: ${amount} (off-chain only)`);
      
      // Prize pool is tracked in Firestore, not on-chain
      // Return success to maintain compatibility with existing code
      return res.status(200).json({ 
        success: true, 
        message: 'Prize pool tracked in Firestore (off-chain raffle system)',
        note: 'Raffle state is managed off-chain with blockchain verification for transparency'
      });
    }

    return res.status(400).json({ 
      error: 'Invalid action',
      note: 'Raffle state is managed off-chain. Prize pool and entries are tracked in Firestore.'
    });
  } catch (error) {
    console.error('[UpdateRaffleState] Error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
    });
  }
}
