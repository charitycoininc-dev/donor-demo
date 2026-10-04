/**
 * Update Raffle Entries API
 * 
 * NOTE: We're using off-chain raffles with blockchain verification now.
 * This endpoint is kept for backward compatibility but doesn't update on-chain state.
 * Total entries are tracked in Firestore (globalCoinCounter), with verification recorded on-chain.
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { totalEntries } = req.body;
    
    if (totalEntries === undefined || totalEntries === null) {
      return res.status(400).json({ 
        error: 'totalEntries is required',
        hint: 'Pass globalCoinCounter - 1 as totalEntries'
      });
    }

    const totalEntriesNum = Number(totalEntries);
    if (isNaN(totalEntriesNum) || totalEntriesNum < 0) {
      return res.status(400).json({ 
        error: 'totalEntries must be a non-negative number'
      });
    }

    // Since we're using off-chain raffles, we don't need to update on-chain state
    // Total entries are tracked in Firestore via globalCoinCounter
    // This endpoint is kept for backward compatibility but just returns success
    console.log(`[UpdateTotalEntries] Total entries update requested: ${totalEntriesNum} (off-chain only)`);
    
    return res.status(200).json({
      success: true,
      message: 'Total entries tracked in Firestore (off-chain raffle system)',
      note: 'Raffle entries are managed off-chain with blockchain verification for transparency',
      totalEntries: totalEntriesNum,
    });
  } catch (error) {
    console.error('[UpdateTotalEntries] Handler error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: error.message,
    });
  }
}
