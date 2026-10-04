import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  setDoc,
  increment,
  addDoc,
  query,
  where,
  writeBatch,
  limit,
  orderBy,
  serverTimestamp,
  collectionGroup,
} from "firebase/firestore";
import { db } from "../../stores/config/firebase.js";
import { Trash2, Check, ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";

const ACHIEVEMENTS = {
  FIRST_DONATION: {
    id: "first_donation",
    title: "First Steps",
    description: "Made your first donation to The Black History Foundation",
    icon: "🎯",
    category: "donation",
  },
  DONATION_100: {
    id: "donation_100",
    title: "Century Club",
    description: "Donated $100 or more total",
    icon: "💯",
    category: "donation",
  },
  DONATION_500: {
    id: "donation_500",
    title: "Gold Supporter",
    description: "Donated $500 or more total",
    icon: "🥇",
    category: "donation",
  },
  DONATION_1000: {
    id: "donation_1000",
    title: "Platinum Patron",
    description: "Donated $1,000 or more total",
    icon: "💎",
    category: "donation",
  },
  COIN_COLLECTOR_10: {
    id: "coin_collector_10",
    title: "Coin Collector",
    description: "Earned 10 or more Charity Coins",
    icon: "🪙",
    category: "coins",
  },
  COIN_COLLECTOR_50: {
    id: "coin_collector_50",
    title: "Coin Enthusiast",
    description: "Earned 50 or more Charity Coins",
    icon: "💰",
    category: "coins",
  },
  COIN_COLLECTOR_100: {
    id: "coin_collector_100",
    title: "Coin Master",
    description: "Earned 100 or more Charity Coins",
    icon: "🏆",
    category: "coins",
  },
  COMMUNITY_CHAMPION: {
    id: "community_champion",
    title: "Community Champion",
    description: "Made 5 or more donations",
    icon: "🌟",
    category: "community",
  },
  SILVER_TIER: {
    id: "silver_tier",
    title: "Silver Status",
    description: "Reached Silver membership tier",
    icon: "🥈",
    category: "tier",
  },
  GOLD_TIER: {
    id: "gold_tier",
    title: "Gold Status",
    description: "Reached Gold membership tier",
    icon: "🥇",
    category: "tier",
  },
  PLATINUM_TIER: {
    id: "platinum_tier",
    title: "Platinum Status",
    description: "Reached Platinum membership tier",
    icon: "💎",
    category: "tier",
  },
};

function generateTransactionNumber() {
  // Format: TXN-YYYYMMDD-random6
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${rand}`;
}

// Enhanced function to conduct multiple raffles until prize pool is below trigger amount
// OPTIMIZED: Cache reads to reduce Firebase operations
const conductMultipleRaffles = async (raffleRef) => {
  let raffleCount = 0;
  const maxRaffles = 10; // Safety limit to prevent infinite loops
  
  // OPTIMIZATION: Read eligibleCoinNumbers and raffleHistory ONCE at the start
  // Reuse these cached values in the loop to avoid excessive reads
  console.log("[MultipleRaffles] Fetching eligible entries and history (cached for all raffles)...");
  const eligibleSnap = await getDocs(
    collection(db, "raffles", "current", "eligibleCoinNumbers"),
  );
  let eligibleEntries = eligibleSnap.docs.map((docSnap) => ({
    ...docSnap.data(),
    _docId: docSnap.id,
  }));
  console.log(`[MultipleRaffles] Found ${eligibleEntries.length} eligible entries (cached)`);
  
  // Exclude prior winning coin numbers (read once, cache for all raffles)
  // CRITICAL: No limit - we need ALL prior winners to prevent duplicate winners
  // Even if this increases reads, correctness is more important
  const historyQuery = query(
    collection(db, "raffleHistory"),
    orderBy("date", "desc"),
    // Removed limit(100) - must read all winners to prevent duplicates
  );
  const historySnap = await getDocs(historyQuery);
  const historyDocs = historySnap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  const hasPendingRaffle = historyDocs.some(
    (doc) => doc.status === "pending"
  );
  if (hasPendingRaffle) {
    console.log(
      "[MultipleRaffles] Pending raffle awaiting KYC verification. Skipping all draws.",
    );
    return; // Exit early if pending raffle exists
  }
  const priorWinners = new Set(
    historyDocs.map((doc) => doc.winningCoinNumber)
  );
  console.log(`[MultipleRaffles] Found ${priorWinners.size} prior winners (cached)`);
  
  // Filter eligible entries once (cached for all raffles)
  const filteredEligibleEntries = eligibleEntries.filter(
    (entry) => !priorWinners.has(entry.coinNumber)
  );
  console.log(`[MultipleRaffles] ${filteredEligibleEntries.length} eligible entries after filtering prior winners`);
  
  while (raffleCount < maxRaffles) {
    // OPTIMIZATION: Only read raffle doc to check prize pool (lightweight)
    const raffleSnap = await getDoc(raffleRef);
    const raffleData = raffleSnap.data();
    const autoDrawAmount = Number(raffleData.autoDrawAmount);
    const currentPrizePool = Number(raffleData.prizePool);
    
    console.log(`[MultipleRaffles] Raffle ${raffleCount + 1}: Prize Pool: $${currentPrizePool}, Trigger: $${autoDrawAmount}`);
    
    // Check if we need to conduct another raffle
    if (!autoDrawAmount || currentPrizePool < autoDrawAmount) {
      console.log(`[MultipleRaffles] No more raffles needed. Final prize pool: $${currentPrizePool}`);
      break;
    }
    
    // Use cached filteredEligibleEntries (no need to re-read)
    if (filteredEligibleEntries.length === 0) {
      console.log("[MultipleRaffles] No eligible entries for drawing. Stopping raffles.");
      break;
    }
    
    // Get on-chain verifiable randomness (same as manual raffle)
    let randomnessResult;
    let winner;
    try {
      console.log(`[MultipleRaffles] Getting verifiable randomness for raffle ${raffleCount + 1}...`);
      const vrfResponse = await fetch('/api/conduct-raffle-with-vrf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eligibleEntries: filteredEligibleEntries.length,
          priorWinners: Array.from(priorWinners),
          totalEntries: raffleData.globalCoinCounter || filteredEligibleEntries.length,
        }),
      });
      
      if (vrfResponse.ok) {
        randomnessResult = await vrfResponse.json();
        console.log(`[MultipleRaffles] Using ${randomnessResult.randomnessMethod} for randomness`);
      } else {
        // Fallback to blockhash if VRF fails
        console.warn('[MultipleRaffles] VRF failed, using blockhash fallback...');
        const blockhashResponse = await fetch('/api/conduct-raffle-with-vrf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eligibleEntries: filteredEligibleEntries.length,
            priorWinners: Array.from(priorWinners),
            totalEntries: raffleData.globalCoinCounter || filteredEligibleEntries.length,
            useBlockhash: true,
          }),
        });
        randomnessResult = await blockhashResponse.json();
      }
      
      // Find winner by coin number from on-chain randomness
      winner = filteredEligibleEntries.find(
        (entry) => entry.coinNumber === randomnessResult.winnerCoin
      );
      
      if (!winner) {
        throw new Error(
          `Winner coin #${randomnessResult.winnerCoin} not found in eligible entries`
        );
      }
    } catch (randomnessError) {
      console.error('[MultipleRaffles] Randomness error, falling back to Math.random:', randomnessError);
      // Fallback to simple random if all else fails
      const winnerIdx = Math.floor(Math.random() * filteredEligibleEntries.length);
      winner = filteredEligibleEntries[winnerIdx];
      randomnessResult = {
        randomnessMethod: 'fallback',
        winnerCoin: winner.coinNumber,
      };
    }
    
    console.log(`[MultipleRaffles] Raffle ${raffleCount + 1} winner:`, winner);
    
    // Find the userId for this winner (from coinNumber or solanaWallet)
    let winnerUserId = winner.userId;
    if (!winnerUserId && winner.coinNumber) {
      // OPTIMIZATION: Try to find userId from cached eligibleEntries first
      const cachedWinner = eligibleEntries.find(e => e.coinNumber === winner.coinNumber);
      if (cachedWinner && cachedWinner.userId) {
        winnerUserId = cachedWinner.userId;
      } else {
        // Fallback: Query coinNumbers collection (only if not in cache)
        const coinNumbersQuery = query(
          collectionGroup(db, "coinNumbers"),
          where("coinNumber", "==", winner.coinNumber),
          limit(1)
        );
        const coinNumbersSnap = await getDocs(coinNumbersQuery);
        if (!coinNumbersSnap.empty) {
          const coinDoc = coinNumbersSnap.docs[0];
          const pathParts = coinDoc.ref.path.split("/");
          winnerUserId = pathParts[1]; // users/{userId}/coinNumbers/...
        }
      }
    }
    
    // Create prize_win transaction for the winner (will be updated with blockchain signature after verification)
    let prizeWinTxRef = null;
    if (winnerUserId) {
      try {
        const prizeWinTx = {
          transactionNumber: generateTransactionNumber(),
          type: "prize_win",
          amount: autoDrawAmount,
          date: new Date().toISOString().split("T")[0],
          description: `Raffle Prize Win - Coin #${winner.coinNumber}`,
          status: "pending",
          coinNumber: winner.coinNumber,
          raffleNumber: raffleCount + 1,
          createdAt: serverTimestamp(), // Accurate server-side timestamp
        };
        prizeWinTxRef = await addDoc(
          collection(db, "users", winnerUserId, "transactions"),
          prizeWinTx,
        );
        console.log(`[MultipleRaffles] Created prize_win transaction for user ${winnerUserId}`);
      } catch (error) {
        console.error(`[MultipleRaffles] Error creating prize_win transaction:`, error);
      }
    } else {
      console.warn(`[MultipleRaffles] Could not find userId for winner with coin #${winner.coinNumber}`);
    }
    
    let winnerEmail = null;
    if (winnerUserId) {
      try {
        const winnerUserSnap = await getDoc(doc(db, "users", winnerUserId));
        if (winnerUserSnap.exists()) {
          const winnerData = winnerUserSnap.data();
          winnerEmail =
            winnerData.email ||
            winnerData.userProfile?.email ||
            winnerData.contactEmail ||
            null;
        }
      } catch (userError) {
        console.warn(
          "[MultipleRaffles] Unable to fetch winner user profile:",
          userError,
        );
      }
    }
    
    // Save drawing to history with randomness proof and blockchain verification
    const drawing = {
      date: new Date().toISOString(),
      prizePool: autoDrawAmount,
      winningCoinNumber: winner.coinNumber,
      solanaWallet: winner.solanaWallet || "N/A",
      raffleNumber: raffleCount + 1,
      userId: winnerUserId || null,
      winnerEmail: winnerEmail,
      eligibleEntryDocId: winner._docId || null,
      randomnessProof: randomnessResult?.randomnessProof || null,
      randomnessMethod: randomnessResult?.randomnessMethod || "fallback",
      vrfAccount: randomnessResult?.vrfAccount || null,
      blockhash: randomnessResult?.blockhash || null,
      onChainSignature: null,
      onChainUrl: null,
      status: "pending",
      kycVerification: "Pending",
      createdAt: serverTimestamp(),
      prizeWinTransactionPath: prizeWinTxRef?.path || null,
    };
    const drawingRef = await addDoc(collection(db, "raffleHistory"), drawing);
    try {
      const emailResponse = await fetch("/api/send-raffle-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raffleId: drawingRef.id,
          status: "pending",
          prizePool: autoDrawAmount,
          winningCoinNumber: winner.coinNumber,
          winnerWallet: winner.solanaWallet || "N/A",
          randomnessMethod: drawing.randomnessMethod,
          triggeredBy: "automated",
        }),
      });
      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        console.warn(
          "[MultipleRaffles] Failed to send raffle notification email:",
          errorData,
        );
      }
    } catch (emailError) {
      console.warn(
        "[MultipleRaffles] Error sending raffle notification email:",
        emailError,
      );
    }
    
    // Note: prize_win transaction is already created with status: "pending"
    // No need to update it here - it will be updated to "finalized" when admin approves in RaffleManagement
    // This was a redundant update that didn't change anything
    
    // Update raffle with remaining prize pool
    const remainingPrizePool = currentPrizePool - autoDrawAmount;
    await updateDoc(raffleRef, {
      prizePool: remainingPrizePool,
      lastUpdated: new Date().toISOString(),
    });

    // --- Update on-chain prize pool after draw ---
    try {
      const remainingPrizePoolLamports = Math.floor(remainingPrizePool * 1e9);
      const updatePrizePoolResponse = await fetch('/api/update-raffle-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_prize_pool',
          amount: remainingPrizePoolLamports,
        }),
      });
      
      if (updatePrizePoolResponse.ok) {
        console.log(`[MultipleRaffles] On-chain prize pool updated after draw`);
      } else {
        console.warn('[MultipleRaffles] Failed to update on-chain prize pool after draw');
      }
    } catch (onChainError) {
      console.warn('[MultipleRaffles] Error updating on-chain prize pool:', onChainError.message);
    }
    
    console.log(`[MultipleRaffles] Raffle ${raffleCount + 1} completed. Remaining prize pool: $${remainingPrizePool}`);
    
    // OPTIMIZATION: Remove winner from cached filteredEligibleEntries for next raffle iteration
    // This prevents the same winner from being selected again (though we currently break after first raffle)
    const winnerIndex = filteredEligibleEntries.findIndex(e => e.coinNumber === winner.coinNumber);
    if (winnerIndex !== -1) {
      filteredEligibleEntries.splice(winnerIndex, 1);
      console.log(`[MultipleRaffles] Removed winner from eligible entries cache. ${filteredEligibleEntries.length} entries remaining.`);
    }
    
    // Add winner to priorWinners set to prevent re-selection
    priorWinners.add(winner.coinNumber);
    
    raffleCount++;
    console.log(
      "[MultipleRaffles] Created pending raffle entry. Awaiting KYC verification before running additional draws.",
    );
    break;
  }
  
  if (raffleCount >= maxRaffles) {
    console.warn(`[MultipleRaffles] Reached maximum raffle limit (${maxRaffles}). Stopping to prevent infinite loop.`);
  }
  
  console.log(`[MultipleRaffles] Total raffles conducted: ${raffleCount}`);
  return raffleCount;
};

const checkAndAwardAchievements = (
  user,
  newTotalDonated,
  newCharityCoins,
  donationCount,
) => {
  const newAchievements = [];
  const currentAchievements = user.achievements || [];
  const currentAchievementIds = currentAchievements.map((a) => a.id);
  if (
    newTotalDonated > 0 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.FIRST_DONATION.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.FIRST_DONATION,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newTotalDonated >= 100 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.DONATION_100.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.DONATION_100,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newTotalDonated >= 500 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.DONATION_500.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.DONATION_500,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newTotalDonated >= 1000 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.DONATION_1000.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.DONATION_1000,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newCharityCoins >= 10 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.COIN_COLLECTOR_10.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.COIN_COLLECTOR_10,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newCharityCoins >= 50 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.COIN_COLLECTOR_50.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.COIN_COLLECTOR_50,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newCharityCoins >= 100 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.COIN_COLLECTOR_100.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.COIN_COLLECTOR_100,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    donationCount >= 5 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.COMMUNITY_CHAMPION.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.COMMUNITY_CHAMPION,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newTotalDonated >= 100 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.SILVER_TIER.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.SILVER_TIER,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newTotalDonated >= 500 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.GOLD_TIER.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.GOLD_TIER,
      unlockedAt: new Date().toISOString(),
    });
  }
  if (
    newTotalDonated >= 1000 &&
    !currentAchievementIds.includes(ACHIEVEMENTS.PLATINUM_TIER.id)
  ) {
    newAchievements.push({
      ...ACHIEVEMENTS.PLATINUM_TIER,
      unlockedAt: new Date().toISOString(),
    });
  }
  return newAchievements;
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "N/A";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleString();
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleString();
  }
  if (typeof timestamp === "number") {
    return new Date(timestamp).toLocaleString();
  }
  if (typeof timestamp === "string") {
    return new Date(timestamp).toLocaleString();
  }
  return "N/A";
};

export default function AdminDataManagement() {
  const [donations, setDonations] = useState([]);
  const [sortField, setSortField] = useState("createdAt");
  const [sortAsc, setSortAsc] = useState(false); // Descending by default
  const [currentPage, setCurrentPage] = useState(1);
  const donationsPerPage = 15;
  const [loading, setLoading] = useState(false);
  const [perRowLoading, setPerRowLoading] = useState({});
  const [resetting, setResetting] = useState(false);
  const [selectedDonations, setSelectedDonations] = useState([]);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [showApprovalMessage, setShowApprovalMessage] = useState(false);
  const [deletedDonations, setDeletedDonations] = useState([]);
  const [deletedLoading, setDeletedLoading] = useState(false);
  const [restoring, setRestoring] = useState({});
  const deletedLastFetchRef = useRef(0);

  // Add caching for expensive operations
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const CACHE_DURATION = 30000; // 30 seconds cache

  // Helper: toggle selection
  const toggleSelectDonation = (id) => {
    setSelectedDonations((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };
  const selectAllOnPage = () => {
    const ids = paginatedDonations.map((d) => d.id);
    const allSelected = ids.every((id) => selectedDonations.includes(id));
    if (allSelected) {
      setSelectedDonations((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedDonations((prev) => Array.from(new Set([...prev, ...ids])));
    }
  };
  const clearSelection = () => setSelectedDonations([]);

  // Optimized fetch donations with caching
  const fetchDonations = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();
      if (!forceRefresh && now - lastFetchTime < CACHE_DURATION) {
        return; // Use cached data
      }

      setLoading(true);
      try {
        // Use pagination and ordering to limit reads
        const donationsQuery = query(
          collection(db, "donations"),
          orderBy("createdAt", "desc"),
          limit(100), // Limit to most recent 100 donations
        );
        const querySnapshot = await getDocs(donationsQuery);
        const donationList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDonations(donationList);
        setLastFetchTime(now);
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    },
    [lastFetchTime],
  );

  const fetchDeletedDonations = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();
      if (!forceRefresh && now - deletedLastFetchRef.current < CACHE_DURATION) {
        return;
      }
      setDeletedLoading(true);
      try {
        const deletedQuery = query(
          collection(db, "deletedDonations"),
          orderBy("deletedAt", "desc"),
          limit(50),
        );
        const querySnapshot = await getDocs(deletedQuery);
        const deletedList = querySnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setDeletedDonations(deletedList);
        deletedLastFetchRef.current = now;
      } catch (error) {
        console.error("Error fetching deleted donations:", error);
      } finally {
        setDeletedLoading(false);
      }
    },
    [CACHE_DURATION],
  );

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  useEffect(() => {
    fetchDeletedDonations(true);
  }, [fetchDeletedDonations]);

  const handleDeleteDonation = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this donation transaction?",
      )
    )
      return;
    setPerRowLoading((l) => ({ ...l, [id]: true }));
    try {
      // Fetch the donation doc
      const donationDocSnap = await getDoc(doc(db, "donations", id));
      if (!donationDocSnap.exists()) throw new Error("Donation not found");
      const donation = donationDocSnap.data();
      const donorEmail =
        donation.userProfile?.email ||
        donation.email ||
        donation.userEmail ||
        null;
      const donorName = [
        donation.userProfile?.firstName,
        donation.userProfile?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
        donation.userProfile?.name ||
        donation.name ||
        donation.fullName ||
        donorEmail;
      const restoreMetadata = {
        statusBeforeDeletion: donation.status || "pending",
      };
      const deletedRecord = {
        donationId: id,
        donationSnapshot: donation,
        donorEmail,
        nonprofitName: donation.nonprofitName || null,
        deletedAt: serverTimestamp(),
        restoreMetadata,
      };
      // Only process confirmed donations for full reversal
      if (donation.status === "confirmed") {
        const { userId, amount } = donation;
        // Fetch user doc
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) throw new Error("User not found");
        const userData = userSnap.data();
        // Fetch raffle doc
        const raffleRef = doc(db, "raffles", "current");
        const raffleSnap = await getDoc(raffleRef);
        if (!raffleSnap.exists()) throw new Error("Raffle not found");
        const raffleData = raffleSnap.data();
        // Fetch nonprofit wallet doc
        const walletRef = doc(db, "settings", "nonprofitWallet");
        const walletSnap = await getDoc(walletRef);
        const walletData = walletSnap.exists()
          ? walletSnap.data()
          : { balance: 0 };

        // Find the coin numbers issued for this donation
        // Look for the coin_reward and raffle_entry transactions for this donation
        let coinsEarned = 0;
        let coinNumbers = [];
        let donationTxId = null;
        let coinRewardTxId = null;
        let raffleEntryTxId = null;
        let donationDate = null;
        let donationTransaction = null;
        let coinRewardTransaction = null;
        let raffleEntryTransaction = null;
        const achievementsBefore = Array.isArray(userData.achievements)
          ? userData.achievements
          : [];
        // Find the donation transaction (should match amount, type, and status)
        (userData.transactions || []).forEach((tx) => {
          if (
            tx.type === "donation" &&
            tx.amount === amount &&
            tx.status === "confirmed" &&
            !donationTxId
          ) {
            donationTxId = tx.id;
            donationDate = tx.date;
            donationTransaction = tx;
          }
        });
        // Find the coin_reward and raffle_entry transactions for this donation
        (userData.transactions || []).forEach((tx) => {
          if (
            tx.type === "coin_reward" &&
            tx.date === donationDate &&
            tx.amount &&
            tx.coinNumbers &&
            !coinRewardTxId
          ) {
            coinsEarned = tx.amount;
            coinNumbers = tx.coinNumbers;
            coinRewardTxId = tx.id;
            coinRewardTransaction = tx;
          }
          if (
            tx.type === "raffle_entry" &&
            tx.date === donationDate &&
            tx.amount &&
            tx.coinNumbers &&
            !raffleEntryTxId
          ) {
            raffleEntryTxId = tx.id;
            raffleEntryTransaction = tx;
          }
        });
        const raffleEntriesRemoved = (raffleData.eligibleCoinNumbers || []).filter(
          (entry) =>
            (coinNumbers || []).includes(entry.coinNumber) &&
            entry.userId === userId,
        );
        const safeClone = (value) => {
          if (!value) return null;
          try {
            return JSON.parse(JSON.stringify(value));
          } catch {
            return value;
          }
        };
        restoreMetadata.userId = userId;
        restoreMetadata.amount = amount;
        restoreMetadata.coinsEarned = coinsEarned;
        restoreMetadata.coinNumbers = Array.isArray(coinNumbers)
          ? [...coinNumbers]
          : [];
        restoreMetadata.transactions = [
          donationTransaction,
          coinRewardTransaction,
          raffleEntryTransaction,
        ]
          .filter(Boolean)
          .map((item) => safeClone(item));
        restoreMetadata.achievementsBefore = achievementsBefore.map((item) =>
          safeClone(item),
        );
        restoreMetadata.raffleEntries = raffleEntriesRemoved.map((entry) =>
          safeClone(entry),
        );
        // Determine if donation was raffle-eligible to calculate correct contributions
        const isRaffleEligible = donation.isRaffleEligible !== false; // Default to true for backward compatibility
        restoreMetadata.isRaffleEligible = isRaffleEligible; // Store for restore
        restoreMetadata.walletContribution = isRaffleEligible ? amount * 0.5 : amount; // 50% for raffle, 100% for sweepstakes
        restoreMetadata.prizePoolContribution = isRaffleEligible ? amount * 0.5 : 0; // 50% for raffle, 0% for sweepstakes
        // Remove coin numbers from user
        const updatedCoinNumbers = (userData.coinNumbers || []).filter(
          (num) => !coinNumbers.includes(num),
        );
        // Remove coin numbers from raffle eligibleCoinNumbers
        const updatedEligibleCoinNumbers = (
          raffleData.eligibleCoinNumbers || []
        ).filter(
          (entry) =>
            !coinNumbers.includes(entry.coinNumber) || entry.userId !== userId,
        );
        // Remove related transactions from user
        const updatedTransactions = (userData.transactions || []).filter(
          (tx) =>
            tx.id !== donationTxId &&
            tx.id !== coinRewardTxId &&
            tx.id !== raffleEntryTxId,
        );
        // Subtract coins and donation amount from user
        const updatedCharityCoins = Math.max(
          0,
          (userData.charityCoins || 0) - coinsEarned,
        );
        const updatedTotalDonated = Math.max(
          0,
          (userData.totalDonated || 0) - amount,
        );
        // Recalculate membership tier
        let newTier = "Bronze";
        if (updatedTotalDonated >= 1000) newTier = "Platinum";
        else if (updatedTotalDonated >= 500) newTier = "Gold";
        else if (updatedTotalDonated >= 100) newTier = "Silver";
        // Optionally, recalculate achievements (not implemented here for brevity)
        // Update user doc (create if doesn't exist)
        await setDoc(userRef, {
          charityCoins: updatedCharityCoins,
          totalDonated: updatedTotalDonated,
          membershipTier: newTier,
          coinNumbers: updatedCoinNumbers,
          transactions: updatedTransactions,
        }, { merge: true });
        // Determine if donation was raffle-eligible to calculate correct contributions
        const isRaffleEligibleDelete = donation.isRaffleEligible !== false; // Default to true for backward compatibility
        const prizePoolContribution = isRaffleEligibleDelete ? amount * 0.5 : 0; // 50% for raffle, 0% for sweepstakes
        const walletContribution = isRaffleEligibleDelete ? amount * 0.5 : amount; // 50% for raffle, 100% for sweepstakes
        
        // Update raffle doc (only if raffle-eligible)
        if (isRaffleEligibleDelete) {
          await updateDoc(raffleRef, {
            prizePool: Math.max(0, (raffleData.prizePool || 0) - prizePoolContribution),
            eligibleCoinNumbers: updatedEligibleCoinNumbers,
          });
        }
        // Update nonprofit wallet
        await updateDoc(walletRef, {
          balance: Math.max(0, (walletData.balance || 0) - walletContribution),
        });
      }
      // Delete the donation doc (for both confirmed and pending)
      await deleteDoc(doc(db, "donations", id));
      setDonations(donations.filter((d) => d.id !== id));
      await setDoc(doc(db, "deletedDonations", id), deletedRecord);
      if (donation.status !== "confirmed" && donorEmail) {
        try {
          const rejectionPayload = {
            type: "rejected",
            donorEmail,
            donorName,
            donationAmount: donation.amount || 0,
            nonprofitName: donation.nonprofitName || "Selected nonprofit",
            donationId: id,
          };
          if (donation.rejectionReason || donation.adminNotes) {
            rejectionPayload.rejectionReason =
              donation.rejectionReason || donation.adminNotes;
          }
          const response = await fetch("/api/send-donation-emails", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(rejectionPayload),
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn(
              "[DonationDeletion] Failed to send rejection email:",
              errorData,
            );
          }
        } catch (emailError) {
          console.warn(
            "[DonationDeletion] Error sending rejection email:",
            emailError,
          );
        }
      }
      await fetchDeletedDonations(true);
    } catch (err) {
      alert("Error deleting donation: " + err.message);
    } finally {
      setPerRowLoading((l) => ({ ...l, [id]: false }));
    }
  };

  const handleRestoreDonation = async (id) => {
    setRestoring((prev) => ({ ...prev, [id]: true }));
    try {
      const deletedRef = doc(db, "deletedDonations", id);
      const deletedSnap = await getDoc(deletedRef);
      if (!deletedSnap.exists()) {
        throw new Error("Backup record not found");
      }
      const deletedData = deletedSnap.data();
      const donationSnapshot =
        deletedData.donationSnapshot || deletedData.donationData;
      if (!donationSnapshot) {
        throw new Error("Backup missing donation snapshot");
      }
      await setDoc(doc(db, "donations", id), donationSnapshot);
      const restoreInfo = deletedData.restoreMetadata || {};
      if (
        restoreInfo.statusBeforeDeletion === "confirmed" &&
        restoreInfo.userId
      ) {
        const userRef = doc(db, "users", restoreInfo.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};
        const coinsEarned = restoreInfo.coinsEarned || 0;
        const amount =
          restoreInfo.amount ||
          donationSnapshot.amount ||
          donationSnapshot.totalAmount ||
          0;
        const existingCoinNumbers = Array.isArray(userData.coinNumbers)
          ? userData.coinNumbers
          : [];
        const restoredCoinNumbers = Array.from(
          new Set([
            ...existingCoinNumbers,
            ...((restoreInfo.coinNumbers || []).filter(Boolean)),
          ]),
        );
        const existingTransactions = Array.isArray(userData.transactions)
          ? userData.transactions
          : [];
        const transactionsToRestore = Array.isArray(restoreInfo.transactions)
          ? restoreInfo.transactions.filter(Boolean)
          : [];
        const transactionsById = new Map(
          existingTransactions
            .filter((tx) => tx && tx.id)
            .map((tx) => [tx.id, tx]),
        );
        transactionsToRestore.forEach((tx) => {
          if (tx && tx.id) {
            transactionsById.set(tx.id, tx);
          }
        });
        const restoredTransactions = Array.from(transactionsById.values());
        const newCharityCoins = (userData.charityCoins || 0) + coinsEarned;
        const newTotalDonated = (userData.totalDonated || 0) + amount;
        let newTier = "Bronze";
        if (newTotalDonated >= 1000) newTier = "Platinum";
        else if (newTotalDonated >= 500) newTier = "Gold";
        else if (newTotalDonated >= 100) newTier = "Silver";
        const donationCount = restoredTransactions.filter(
          (tx) => tx?.type === "donation" && tx?.status === "confirmed",
        ).length;
        const newAchievements = checkAndAwardAchievements(
          userData,
          newTotalDonated,
          newCharityCoins,
          donationCount,
        );
        const achievementsBefore = Array.isArray(
          restoreInfo.achievementsBefore,
        )
          ? restoreInfo.achievementsBefore.filter(Boolean)
          : [];
        const achievementMap = new Map();
        [
          ...(userData.achievements || []),
          ...achievementsBefore,
          ...newAchievements,
        ]
          .filter((achievement) => achievement && achievement.id)
          .forEach((achievement) => {
            if (!achievementMap.has(achievement.id)) {
              achievementMap.set(achievement.id, achievement);
            }
          });
        await setDoc(
          userRef,
          {
            charityCoins: newCharityCoins,
            totalDonated: newTotalDonated,
            membershipTier: newTier,
            coinNumbers: restoredCoinNumbers,
            transactions: restoredTransactions,
            achievements: Array.from(achievementMap.values()),
          },
          { merge: true },
        );

        const raffleRef = doc(db, "raffles", "current");
        const raffleSnap = await getDoc(raffleRef);
        const raffleData = raffleSnap.exists() ? raffleSnap.data() : {};
        const existingEligible = Array.isArray(raffleData.eligibleCoinNumbers)
          ? raffleData.eligibleCoinNumbers
          : [];
        const combinedEntries = [...existingEligible];
        const seenEntries = new Set(
          combinedEntries.map(
            (entry) => `${entry?.userId || "user"}-${entry?.coinNumber}`,
          ),
        );
        (restoreInfo.raffleEntries || [])
          .filter(Boolean)
          .forEach((entry) => {
            const key = `${entry.userId || "user"}-${entry.coinNumber}`;
            if (!seenEntries.has(key)) {
              seenEntries.add(key);
              combinedEntries.push(entry);
            }
          });
        // Use stored contribution amounts from restoreInfo, or calculate based on donation eligibility
        const isRaffleEligibleRestore = restoreInfo.isRaffleEligible !== undefined 
          ? restoreInfo.isRaffleEligible !== false 
          : true; // Default to true for backward compatibility
        const prizePoolContribution = restoreInfo.prizePoolContribution !== undefined 
          ? restoreInfo.prizePoolContribution 
          : (isRaffleEligibleRestore ? amount * 0.5 : 0); // 50% for raffle, 0% for sweepstakes
        
        // Only update raffle if there was a prize pool contribution (raffle-eligible donation)
        if (prizePoolContribution > 0) {
          await setDoc(
            raffleRef,
            {
              prizePool: (raffleData.prizePool || 0) + prizePoolContribution,
              eligibleCoinNumbers: combinedEntries,
            },
            { merge: true },
          );
        }

        const walletRef = doc(db, "settings", "nonprofitWallet");
        const walletSnap = await getDoc(walletRef);
        const walletData = walletSnap.exists() ? walletSnap.data() : {};
        const walletContribution = restoreInfo.walletContribution !== undefined
          ? restoreInfo.walletContribution
          : (isRaffleEligibleRestore ? amount * 0.5 : amount); // 50% for raffle, 100% for sweepstakes
        await setDoc(
          walletRef,
          {
            balance: (walletData.balance || 0) + walletContribution,
          },
          { merge: true },
        );
      }
      await deleteDoc(deletedRef);
      await fetchDonations(true);
      await fetchDeletedDonations(true);
      alert("Donation restored successfully.");
    } catch (err) {
      console.error("Error restoring donation:", err);
      alert("Error restoring donation: " + err.message);
    } finally {
      setRestoring((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  // Helper function to retry Firestore operations with exponential backoff
  const retryFirestoreOperation = async (operation, maxRetries = 3, delay = 1000) => {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        // Check if it's a retryable error (network/connection errors)
        const isRetryable = error.code === 'unavailable' || 
                           error.code === 'deadline-exceeded' ||
                           error.message?.includes('QUIC') ||
                           error.message?.includes('network') ||
                           error.message?.includes('connection');
        
        if (!isRetryable || attempt === maxRetries - 1) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = delay * Math.pow(2, attempt);
        console.warn(`[Admin] Firestore operation failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${waitTime}ms...`, error.message);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw lastError;
  };

  const handleConfirmDonation = async (id) => {
    setPerRowLoading((l) => ({ ...l, [id]: true }));
    try {
      const donationSnap = await retryFirestoreOperation(() => getDoc(doc(db, "donations", id)));
      if (!donationSnap.exists()) {
        setPerRowLoading((l) => ({ ...l, [id]: false }));
        return;
      }
      const donationDoc = { id, ...donationSnap.data() };
      if (donationDoc.status !== "confirmed") {
        // Update donation status and record confirmation timestamp
        await retryFirestoreOperation(() => updateDoc(doc(db, "donations", id), { 
          status: "confirmed",
          confirmedAt: serverTimestamp(), // Track when donation was confirmed
        }));

        // Always fetch the latest raffle data for each confirmation
        const raffleRef = doc(db, "raffles", "current");
        const raffleSnap = await retryFirestoreOperation(() => getDoc(raffleRef));
        let startCoinNumber, endCoinNumber, coinsEarned;
        let solanaTransactionSignature = null;
        let custodialWalletAddress = null;
        let donationProof = null; // Declare at top level to avoid scope issues
        let userData = null; // Declare at top level to avoid scope issues
        let isRaffleEligible = true; // Declare at top level for use in success message
        
        // Fetch user data early so it's available throughout the function
        const userRef = doc(db, "users", donationDoc.userId);
        const userSnap = await retryFirestoreOperation(() => getDoc(userRef));
        userData = userSnap.exists() ? userSnap.data() : {};
        
        // Check if donation is raffle-eligible
        isRaffleEligible = donationDoc.isRaffleEligible !== false; // Default to true if not set (backward compatibility)
        const amount = donationDoc.amount;
        
        // Calculate coins earned (same for both raffle and sweepstakes)
        let baseCoins = Math.floor(amount * 1);
        let bonusMultiplier = 1;
        // Membership tier bonuses (userData already fetched above)
        if (userData.membershipTier === "Silver") bonusMultiplier = 1.1;
        else if (userData.membershipTier === "Gold") bonusMultiplier = 1.25;
        else if (userData.membershipTier === "Platinum")
          bonusMultiplier = 1.5;
        if (amount >= 500) bonusMultiplier += 0.2;
        else if (amount >= 250) bonusMultiplier += 0.1;
        coinsEarned = Math.floor(baseCoins * bonusMultiplier);
        
        if (isRaffleEligible) {
          // RAFFLE-ELIGIBLE DONATION: 50% to prize pool, issue raffle entries
          if (!raffleSnap.exists()) {
            // Create raffle if it doesn't exist
            await setDoc(raffleRef, {
              id: "current",
              name: "Monthly Community Support Raffle",
              prizePool: 0,
              endDate: "2024-12-31",
              participants: 0,
              description: "Support our community while having a chance to win amazing prizes!",
              lastUpdated: new Date().toISOString(),
              globalCoinCounter: 1,
            });
          }
          const raffleData = raffleSnap.exists() ? raffleSnap.data() : {
            prizePool: 0,
            globalCoinCounter: 1,
            participants: 0,
          };
          
          // --- Issue Charity Coins as Solana tokens ---
          // Note: API endpoint works on Vercel or with Vercel CLI (`vercel dev`)
          // In local dev without Vercel CLI, this will fail gracefully and coins will still be tracked in Firestore
          try {
            console.log(`[Admin] Issuing ${coinsEarned} Charity Coins as Solana tokens to user ${donationDoc.userId}`);
            
            // API calls are proxied to Vercel dev server (port 3001) via Vite proxy config
            // If Vercel dev isn't running, this will gracefully fail
            const solanaResponse = await fetch('/api/issue-charity-coins', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: donationDoc.userId,
                coinsToSend: coinsEarned,
                userWalletAddress: userData.solanaWallet || userData.solanaWalletAddress || null,
              }),
            });

            if (!solanaResponse.ok) {
              // Check if it's a 404 (local dev) or other error
              if (solanaResponse.status === 404) {
                console.warn('[Admin] API endpoint not found (local development). Solana token transfer skipped.');
                console.warn('[Admin] Install Vercel CLI and run "vercel dev" to test Solana transfers locally.');
                console.warn('[Admin] Coins are still tracked in Firestore and will be issued on Vercel deployment.');
              } else {
                let errorData;
                try {
                  errorData = await solanaResponse.json();
                } catch (parseError) {
                  const errorText = await solanaResponse.text().catch(() => 'Unable to read error response');
                  errorData = { 
                    error: `HTTP ${solanaResponse.status}: ${solanaResponse.statusText}`,
                    details: errorText,
                    status: solanaResponse.status
                  };
                }
                console.error('[Admin] Failed to issue Solana tokens:', errorData);
                console.error('[Admin] Error details:', errorData.details || errorData.message || 'No error details available');
                console.error('[Admin] Error status:', solanaResponse.status);
                // Log the full error for debugging
                if (errorData.stack) {
                  console.error('[Admin] Error stack:', errorData.stack);
                }
              }
              // Continue with the approval process even if Solana fails
              // The coins are still tracked in Firestore
            } else {
              const solanaData = await solanaResponse.json();
              solanaTransactionSignature = solanaData.signature;
              if (solanaData.walletCreated && solanaData.walletAddress) {
                custodialWalletAddress = solanaData.walletAddress;
                // Update user document with new custodial wallet and encrypted private key
                const walletUpdate = {
                  solanaWallet: solanaData.walletAddress,
                  solanaWalletAddress: solanaData.walletAddress,
                  walletType: 'custodial',
                };
                
                // Store encrypted private key if provided (only for newly created custodial wallets)
                if (solanaData.walletPrivateKey) {
                  walletUpdate.solanaWalletPrivateKey = solanaData.walletPrivateKey;
                  console.log(`[Admin] Storing encrypted private key for custodial wallet`);
                }
                
                // Use setDoc with merge to create document if it doesn't exist, or update if it does
                try {
                  await retryFirestoreOperation(() => setDoc(userRef, walletUpdate, { merge: true }));
                } catch (walletUpdateError) {
                  console.error('[Admin] Failed to update user wallet, continuing...', walletUpdateError);
                  // Continue - wallet can be updated manually if needed
                }
                // Update local userData reference
                if (userData) {
                  userData.solanaWallet = solanaData.walletAddress;
                  userData.solanaWalletAddress = solanaData.walletAddress;
                  if (solanaData.walletPrivateKey) {
                    userData.solanaWalletPrivateKey = solanaData.walletPrivateKey;
                  }
                }
                console.log(`[Admin] Created custodial wallet for user: ${solanaData.walletAddress}`);
              }
              console.log(`[Admin] Solana token transfer successful: ${solanaTransactionSignature}`);
            }
          } catch (solanaError) {
            // Handle network errors or JSON parse errors
            if (solanaError.name === 'SyntaxError' || solanaError.message.includes('JSON')) {
              console.warn('[Admin] API endpoint not available (local development). Solana token transfer skipped.');
              console.warn('[Admin] Coins are still tracked in Firestore and will be issued on Vercel deployment.');
            } else {
              console.error('[Admin] Error issuing Solana tokens:', solanaError);
            }
            // Continue with the approval process even if Solana fails
          }
          
          // Assign coin numbers using the latest globalCoinCounter
          startCoinNumber = raffleData.globalCoinCounter || 1;
          endCoinNumber = startCoinNumber + coinsEarned - 1;
          const newCoinNumbers = Array.from(
            { length: coinsEarned },
            (_, i) => startCoinNumber + i,
          );
          // Prepare eligible coin number entries for the raffle doc
          const solanaWallet = custodialWalletAddress || userData.solanaWallet || userData.solanaWalletAddress || null;
          const eligibleEntries = newCoinNumbers.map((num) => ({
            coinNumber: num,
            userId: donationDoc.userId,
            solanaWallet: solanaWallet,
          }));
          // Append to eligibleCoinNumbers in the raffle doc
          // Use batch writes to reduce the number of network operations
          const eligibleEntriesBatch = writeBatch(db);
          const eligibleEntriesCol = collection(db, "raffles", "current", "eligibleCoinNumbers");
          for (const entry of eligibleEntries) {
            const entryRef = doc(eligibleEntriesCol);
            eligibleEntriesBatch.set(entryRef, entry);
          }
          // Commit eligible entries in a single batch
          try {
            await retryFirestoreOperation(() => eligibleEntriesBatch.commit());
          } catch (eligibleEntriesError) {
            console.error('[Admin] Failed to add eligible entries, continuing...', eligibleEntriesError);
            // Continue - this is not critical for donation approval
          }
          
          // Update raffle globalCoinCounter, prizePool, participants
          const newPrizePool = (raffleData.prizePool || 0) + amount * 0.5;
          const newGlobalCoinCounter = endCoinNumber + 1;
          await retryFirestoreOperation(() => updateDoc(raffleRef, {
            globalCoinCounter: newGlobalCoinCounter,
            prizePool: newPrizePool,
            participants: (raffleData.participants || 0) + 1,
            lastUpdated: new Date().toISOString(),
          }));

          // --- Update on-chain raffle state (real-time sync) ---
          try {
            // Update prize pool on-chain (50% of donation goes to prize pool)
            const prizePoolLamports = Math.floor(newPrizePool * 1e9); // Convert to lamports
            const updatePrizePoolResponse = await fetch('/api/update-raffle-state', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update_prize_pool',
                amount: prizePoolLamports,
              }),
            });
            
            if (updatePrizePoolResponse.ok) {
              const prizePoolData = await updatePrizePoolResponse.json();
              console.log(`[Admin] Prize pool tracked: ${prizePoolData.message || 'success'}`);
            } else {
              console.warn('[Admin] Failed to update prize pool, continuing...');
            }

            // Update total entries (globalCoinCounter - 1 = total entries)
            // Note: This is now tracked in Firestore only, with blockchain verification for raffles
            const totalEntries = newGlobalCoinCounter - 1;
            const updateEntriesResponse = await fetch('/api/update-raffle-entries', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ totalEntries }),
            });
            
            if (updateEntriesResponse.ok) {
              const entriesData = await updateEntriesResponse.json();
              console.log(`[Admin] Total entries tracked: ${entriesData.message || 'success'}`);
            } else {
              console.warn('[Admin] Failed to update total entries, continuing...');
            }
          } catch (onChainError) {
            // Handle gracefully - Firestore is primary source of truth
            if (onChainError.name === 'SyntaxError' || onChainError.message.includes('JSON')) {
              console.warn('[Admin] On-chain updates skipped (local development or API unavailable)');
              console.warn('[Admin] Firestore remains source of truth. On-chain updates will sync on Vercel deployment.');
            } else {
              console.error('[Admin] Error updating on-chain raffle state:', onChainError);
            }
            // Continue with approval process even if on-chain updates fail
          }

          // --- Enhanced Auto-draw logic with multiple raffle support ---
          await conductMultipleRaffles(raffleRef);
          // Add 50% to nonprofit wallet balance
          try {
            const walletRef = doc(db, "settings", "nonprofitWallet");
            const walletSnap = await retryFirestoreOperation(() => getDoc(walletRef));
            const walletAmount = amount * 0.5;
            if (walletSnap.exists()) {
              await retryFirestoreOperation(() => updateDoc(walletRef, { balance: increment(walletAmount) }));
            } else {
              await retryFirestoreOperation(() => setDoc(walletRef, { balance: walletAmount }));
            }
          } catch (walletError) {
            console.error('[Admin] Failed to update nonprofit wallet balance, continuing...', walletError);
            // Continue - wallet balance can be updated manually if needed
          }
          // --- Refactored: Add transactions and coinNumbers as subcollections ---
          // 1. Add coin_reward and raffle_entry transactions to users/{userId}/transactions
          const now = new Date().toISOString().split("T")[0];
          const coinRewardTx = {
            transactionNumber: generateTransactionNumber(),
            type: "coin_reward",
            amount: coinsEarned,
            date: now,
            description: `Charity Coins Earned (${userData.membershipTier || "Bronze"} Tier)`,
            status: "confirmed",
            coinNumbers: newCoinNumbers,
            donationId: id,
            nonprofitId: donationDoc.nonprofitId,
            nonprofitName: donationDoc.nonprofitName,
            solanaTransactionSignature: solanaTransactionSignature || null,
            solanaWalletAddress: custodialWalletAddress || userData.solanaWallet || userData.solanaWalletAddress || null,
            createdAt: serverTimestamp(), // Accurate server-side timestamp
          };
          const raffleEntryTx = {
            transactionNumber: generateTransactionNumber(),
            type: "raffle_entry",
            amount: coinsEarned,
            date: now,
            description: `Raffle Entries (${coinsEarned} entries)`,
            status: "confirmed",
            coinNumbers: newCoinNumbers,
            donationId: id,
            nonprofitId: donationDoc.nonprofitId,
            nonprofitName: donationDoc.nonprofitName,
            createdAt: serverTimestamp(), // Accurate server-side timestamp
          };
          // Add transactions in a single batch to reduce network operations
          const transactionsBatch = writeBatch(db);
          const transactionsCol = collection(db, "users", donationDoc.userId, "transactions");
          const coinRewardTxRef = doc(transactionsCol);
          const raffleEntryTxRef = doc(transactionsCol);
          transactionsBatch.set(coinRewardTxRef, coinRewardTx);
          transactionsBatch.set(raffleEntryTxRef, raffleEntryTx);
          
          try {
            await retryFirestoreOperation(() => transactionsBatch.commit());
          } catch (transactionsError) {
            console.error('[Admin] Failed to add transactions, continuing...', transactionsError);
            // Try individual adds as fallback
            try {
              await retryFirestoreOperation(() => addDoc(transactionsCol, coinRewardTx));
              await retryFirestoreOperation(() => addDoc(transactionsCol, raffleEntryTx));
            } catch (fallbackError) {
              console.error('[Admin] Failed to add transactions (fallback), continuing...', fallbackError);
              // Continue - transactions can be manually added if needed
            }
          }
          // 2. Update the original donation transaction status in users/{userId}/transactions
          // (Optional: If you want to update the status, you need to query for the transaction with donationId === id and update it)
          // 3. Add coinNumbers as documents in users/{userId}/coinNumbers (batch in groups of 500)
          const coinNumbersCol = collection(
            db,
            "users",
            donationDoc.userId,
            "coinNumbers",
          );
          const batchSize = 500;
          for (let i = 0; i < newCoinNumbers.length; i += batchSize) {
            const batch = writeBatch(db);
            newCoinNumbers.slice(i, i + batchSize).forEach((num) => {
              const coinDocRef = doc(coinNumbersCol);
              batch.set(coinDocRef, {
                coinNumber: num,
                issuedAt: new Date().toISOString(),
                donationId: id,
              });
            });
            try {
              await retryFirestoreOperation(() => batch.commit());
              // Small delay between batches to avoid overwhelming Firestore
              if (i + batchSize < newCoinNumbers.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            } catch (batchError) {
              console.error(`[Admin] Failed to commit coin numbers batch (${i}-${i + batchSize}), continuing...`, batchError);
              // Continue with next batch - partial success is acceptable
            }
          }
          // 4. Update summary fields in user doc
          let updatedCharityCoins = (userData.charityCoins || 0) + coinsEarned;
          let updatedTotalDonated = (userData.totalDonated || 0) + amount;
          let newTier = userData.membershipTier || "Bronze";
          if (updatedTotalDonated >= 1000) newTier = "Platinum";
          else if (updatedTotalDonated >= 500) newTier = "Gold";
          else if (updatedTotalDonated >= 100) newTier = "Silver";
          else newTier = "Bronze";
          
          // Update coinNumbers array in user document (for efficient reads on Raffle page)
          // This avoids reading N documents from subcollection - reduces from 2122 reads to 1 read
          const existingCoinNumbers = userData.coinNumbers || [];
          const updatedCoinNumbers = [...existingCoinNumbers, ...newCoinNumbers].sort((a, b) => a - b);
          
          // --- Achievements logic (unchanged) ---
          // (You can keep the achievements logic as is, just update the user doc with the new achievements array)
          // Count confirmed donations for community champion
          // (You may want to count from the transactions subcollection instead of the array)
          // For now, just update the summary fields and achievements
          let updatedAchievements = userData.achievements || [];
          try {
            await retryFirestoreOperation(() => setDoc(userRef, {
              charityCoins: updatedCharityCoins,
              totalDonated: updatedTotalDonated,
              membershipTier: newTier,
              coinNumbers: updatedCoinNumbers,
              achievements: updatedAchievements,
            }, { merge: true }));
          } catch (userUpdateError) {
            console.error('[Admin] Failed to update user summary fields, continuing...', userUpdateError);
            // Continue - this will be retried or can be updated manually
          }

          // Update the original donation transaction status in user's transactions subcollection
          try {
            const txQuery = query(
              collection(db, "users", donationDoc.userId, "transactions"),
              where("donationId", "==", id),
              where("type", "==", "donation"),
            );
            const txSnap = await retryFirestoreOperation(() => getDocs(txQuery));
            for (const docSnap of txSnap.docs) {
              const updateData = { status: "confirmed" };
              // Include donation proof link if available
              if (donationProof?.signature) {
                updateData.onChainProofSignature = donationProof.signature;
                updateData.onChainProofUrl = donationProof.url;
              }
              try {
                await retryFirestoreOperation(() => updateDoc(docSnap.ref, updateData));
                console.log(
                  "[DonationStatusUpdate] Updated transaction",
                  docSnap.id,
                  "to confirmed",
                );
              } catch (txUpdateError) {
                console.error('[Admin] Failed to update transaction status, continuing...', txUpdateError);
                // Continue - transaction status can be updated later
              }
            }
          } catch (txQueryError) {
            console.error('[Admin] Failed to query transactions, continuing...', txQueryError);
            // Continue - transaction status update is not critical
          }

          // Optimized: Limit transaction reads for achievement calculation
          try {
            const txQueryAll = query(
              collection(db, "users", donationDoc.userId, "transactions"),
              orderBy("date", "desc"),
              limit(100), // Only check recent transactions for achievements
            );
            const txSnapAll = await retryFirestoreOperation(() => getDocs(txQueryAll));
            const allTransactions = txSnapAll.docs.map((doc) => doc.data());
            const confirmedDonations = allTransactions.filter(
              (tx) => tx.type === "donation" && tx.status === "confirmed",
            );
            const donationCount = confirmedDonations.length;
            const newTotalDonated = confirmedDonations.reduce(
              (sum, tx) => sum + (tx.amount || 0),
              0,
            );
            const newCharityCoins = allTransactions
              .filter(
                (tx) => tx.type === "coin_reward" && tx.status === "confirmed",
              )
              .reduce((sum, tx) => sum + (tx.amount || 0), 0);
            // Recalculate achievements
            const newAchievements = checkAndAwardAchievements(
              userData,
              newTotalDonated,
              newCharityCoins,
              donationCount,
            );
            let recalculatedAchievements = userData.achievements || [];
            if (newAchievements.length > 0) {
              recalculatedAchievements = [
                ...recalculatedAchievements,
                ...newAchievements,
              ];
            }
            // Update user doc with new achievements and summary fields (create if doesn't exist)
            await retryFirestoreOperation(() => setDoc(userRef, {
              charityCoins: newCharityCoins,
              totalDonated: newTotalDonated,
              membershipTier: newTier,
              achievements: recalculatedAchievements,
            }, { merge: true }));
          } catch (achievementsError) {
            console.error('[Admin] Failed to update achievements, continuing...', achievementsError);
            // Continue - achievements can be recalculated later
            // Still update basic fields without achievements
            try {
              await retryFirestoreOperation(() => setDoc(userRef, {
                charityCoins: updatedCharityCoins,
                totalDonated: updatedTotalDonated,
                membershipTier: newTier,
              }, { merge: true }));
            } catch (basicUpdateError) {
              console.error('[Admin] Failed to update basic user fields, continuing...', basicUpdateError);
            }
          }
        } else {
          // SWEEPSTAKES-ELIGIBLE DONATION: 100% to foundation, issue sweepstakes entries (1 per $1)
          console.log(`[Admin] Processing sweepstakes-eligible donation: ${amount}, entries: ${Math.floor(amount)}`);
          
          // Issue Charity Coins (same as raffle)
          try {
            console.log(`[Admin] Issuing ${coinsEarned} Charity Coins as Solana tokens to user ${donationDoc.userId}`);
            const solanaResponse = await fetch('/api/issue-charity-coins', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: donationDoc.userId,
                coinsToSend: coinsEarned,
                userWalletAddress: userData.solanaWallet || userData.solanaWalletAddress || null,
              }),
            });

            if (!solanaResponse.ok) {
              if (solanaResponse.status === 404) {
                console.warn('[Admin] API endpoint not found (local development). Solana token transfer skipped.');
              } else {
                let errorData;
                try {
                  errorData = await solanaResponse.json();
                } catch (e) {
                  errorData = { error: `HTTP ${solanaResponse.status}: ${solanaResponse.statusText}` };
                }
                console.error('[Admin] Failed to issue Solana tokens:', errorData);
              }
              // Continue with the approval process even if Solana fails
              // The coins are still tracked in Firestore
            } else {
              const solanaData = await solanaResponse.json();
              solanaTransactionSignature = solanaData.signature;
              if (solanaData.walletCreated && solanaData.walletAddress) {
                custodialWalletAddress = solanaData.walletAddress;
                const walletUpdate = {
                  solanaWallet: solanaData.walletAddress,
                  solanaWalletAddress: solanaData.walletAddress,
                  walletType: 'custodial',
                };
                if (solanaData.walletPrivateKey) {
                  walletUpdate.solanaWalletPrivateKey = solanaData.walletPrivateKey;
                }
                try {
                  await retryFirestoreOperation(() => setDoc(userRef, walletUpdate, { merge: true }));
                } catch (walletUpdateError) {
                  console.error('[Admin] Failed to update user wallet, continuing...', walletUpdateError);
                }
                if (userData) {
                  userData.solanaWallet = solanaData.walletAddress;
                  userData.solanaWalletAddress = solanaData.walletAddress;
                }
              }
            }
          } catch (solanaError) {
            console.warn('[Admin] Error issuing Solana tokens (non-critical):', solanaError);
            // Donation will still proceed - coins are tracked in Firestore
            // API endpoint may not be available in local development (requires 'vercel dev')
          }

          // Get current active sweepstakes
          const sweepstakesQuery = query(
            collection(db, "sweepstakes"),
            where("status", "==", "active"),
            limit(1)
          );
          const sweepstakesSnap = await retryFirestoreOperation(() => getDocs(sweepstakesQuery));
          
          if (!sweepstakesSnap.empty) {
            const currentSweepstakes = sweepstakesSnap.docs[0];
            const sweepstakesData = currentSweepstakes.data();
            const sweepstakesId = currentSweepstakes.id;
            
            // Calculate sweepstakes entries: 1 entry per $1 donated
            const sweepstakesEntries = Math.floor(amount);
            const solanaWallet = custodialWalletAddress || userData.solanaWallet || userData.solanaWalletAddress || null;
            
            // Get current global entry counter
            const startEntryNumber = sweepstakesData.globalEntryCounter || 1;
            const endEntryNumber = startEntryNumber + sweepstakesEntries - 1;
            
            // Add sweepstakes entries with unique numbers
            const entriesBatch = writeBatch(db);
            const entriesCol = collection(db, "sweepstakes", sweepstakesId, "entries");
            for (let i = 0; i < sweepstakesEntries; i++) {
              const entryRef = doc(entriesCol);
              const entryNumber = startEntryNumber + i;
              entriesBatch.set(entryRef, {
                entryNumber: entryNumber,
                userId: donationDoc.userId,
                solanaWallet: solanaWallet,
                donationId: id,
                amount: amount / sweepstakesEntries, // Split amount across entries
                createdAt: serverTimestamp(),
              });
            }
            
            try {
              await retryFirestoreOperation(() => entriesBatch.commit());
              // Update sweepstakes entry count and global counter
              const newGlobalEntryCounter = endEntryNumber + 1;
              await retryFirestoreOperation(() => updateDoc(doc(db, "sweepstakes", sweepstakesId), {
                entries: (sweepstakesData.entries || 0) + sweepstakesEntries,
                globalEntryCounter: newGlobalEntryCounter,
                lastUpdated: serverTimestamp(),
              }));
            } catch (entriesError) {
              console.error('[Admin] Failed to add sweepstakes entries, continuing...', entriesError);
            }
          } else {
            console.warn('[Admin] No active sweepstakes found. Entries will not be issued.');
          }

          // Add 100% to nonprofit wallet balance (instead of 50%)
          try {
            const walletRef = doc(db, "settings", "nonprofitWallet");
            const walletSnap = await retryFirestoreOperation(() => getDoc(walletRef));
            const walletAmount = amount; // 100% goes to foundation
            if (walletSnap.exists()) {
              await retryFirestoreOperation(() => updateDoc(walletRef, { balance: increment(walletAmount) }));
            } else {
              await retryFirestoreOperation(() => setDoc(walletRef, { balance: walletAmount }));
            }
          } catch (walletError) {
            console.error('[Admin] Failed to update nonprofit wallet balance, continuing...', walletError);
          }

          // Add transactions
          const now = new Date().toISOString().split("T")[0];
          const coinRewardTx = {
            transactionNumber: generateTransactionNumber(),
            type: "coin_reward",
            amount: coinsEarned,
            date: now,
            description: `Charity Coins Earned (${userData.membershipTier || "Bronze"} Tier)`,
            status: "confirmed",
            donationId: id,
            nonprofitId: donationDoc.nonprofitId,
            nonprofitName: donationDoc.nonprofitName,
            solanaTransactionSignature: solanaTransactionSignature || null,
            solanaWalletAddress: custodialWalletAddress || userData.solanaWallet || userData.solanaWalletAddress || null,
            createdAt: serverTimestamp(),
          };
          const sweepstakesEntryTx = {
            transactionNumber: generateTransactionNumber(),
            type: "sweepstakes_entry",
            amount: Math.floor(amount), // 1 entry per $1
            date: now,
            description: `Sweepstakes Entries (${Math.floor(amount)} entries)`,
            status: "confirmed",
            donationId: id,
            nonprofitId: donationDoc.nonprofitId,
            nonprofitName: donationDoc.nonprofitName,
            createdAt: serverTimestamp(),
          };
          
          const transactionsBatch = writeBatch(db);
          const transactionsCol = collection(db, "users", donationDoc.userId, "transactions");
          const coinRewardTxRef = doc(transactionsCol);
          const sweepstakesEntryTxRef = doc(transactionsCol);
          transactionsBatch.set(coinRewardTxRef, coinRewardTx);
          transactionsBatch.set(sweepstakesEntryTxRef, sweepstakesEntryTx);
          
          try {
            await retryFirestoreOperation(() => transactionsBatch.commit());
          } catch (transactionsError) {
            console.error('[Admin] Failed to add transactions, continuing...', transactionsError);
            try {
              await retryFirestoreOperation(() => addDoc(transactionsCol, coinRewardTx));
              await retryFirestoreOperation(() => addDoc(transactionsCol, sweepstakesEntryTx));
            } catch (fallbackError) {
              console.error('[Admin] Failed to add transactions (fallback), continuing...', fallbackError);
            }
          }

          // Update user summary fields
          let updatedCharityCoins = (userData.charityCoins || 0) + coinsEarned;
          let updatedTotalDonated = (userData.totalDonated || 0) + amount;
          let newTier = userData.membershipTier || "Bronze";
          if (updatedTotalDonated >= 1000) newTier = "Platinum";
          else if (updatedTotalDonated >= 500) newTier = "Gold";
          else if (updatedTotalDonated >= 100) newTier = "Silver";
          else newTier = "Bronze";
          
          try {
            await retryFirestoreOperation(() => setDoc(userRef, {
              charityCoins: updatedCharityCoins,
              totalDonated: updatedTotalDonated,
              membershipTier: newTier,
            }, { merge: true }));
          } catch (userUpdateError) {
            console.error('[Admin] Failed to update user summary fields, continuing...', userUpdateError);
          }

          // Update donation transaction status
          try {
            const txQuery = query(
              collection(db, "users", donationDoc.userId, "transactions"),
              where("donationId", "==", id),
              where("type", "==", "donation"),
            );
            const txSnap = await retryFirestoreOperation(() => getDocs(txQuery));
            for (const docSnap of txSnap.docs) {
              try {
                await retryFirestoreOperation(() => updateDoc(docSnap.ref, { status: "confirmed" }));
              } catch (txUpdateError) {
                console.error('[Admin] Failed to update transaction status, continuing...', txUpdateError);
              }
            }
          } catch (txQueryError) {
            console.error('[Admin] Failed to query transactions, continuing...', txQueryError);
          }
        }
        
        // Record donation proof on blockchain (non-critical - donation succeeds either way)
        try {
          const donorWallet = custodialWalletAddress || userData.solanaWallet || userData.solanaWalletAddress || null;
          const proofResponse = await fetch('/api/record-donation-proof', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              donationId: id,
              amount: donationDoc.amount,
              nonprofitName: donationDoc.nonprofitName || 'Unknown Nonprofit',
              donorWallet: donorWallet || 'N/A',
              donorEmail: userData.email || null,
              coinsEarned: coinsEarned || null,
            }),
          });
          
          if (proofResponse.ok) {
            donationProof = await proofResponse.json();
            console.log(`[Admin] Donation proof recorded on-chain: ${donationProof.signature}`);
          } else {
            const errorData = await proofResponse.json().catch(() => ({}));
            console.warn('[Admin] Donation proof recording failed (non-critical):', errorData);
          }
        } catch (proofError) {
          console.warn('[Admin] Donation proof error (non-critical):', proofError.message);
          // Continue - donation still succeeds without blockchain proof
        }
        
        // Update donation document with blockchain proof signature
        if (donationProof?.signature) {
          try {
            await retryFirestoreOperation(() => updateDoc(doc(db, "donations", id), {
              onChainProofSignature: donationProof.signature,
              onChainProofUrl: donationProof.url,
            }));
            console.log(`[Admin] Updated donation with blockchain proof: ${donationProof.signature}`);
            
            // Also update the transaction in user's transactions subcollection with proof URL
            // (This is a second update since the proof wasn't available during the first update)
            try {
              const txQueryForProof = query(
                collection(db, "users", donationDoc.userId, "transactions"),
                where("donationId", "==", id),
                where("type", "==", "donation"),
              );
              const txSnapForProof = await retryFirestoreOperation(() => getDocs(txQueryForProof));
              for (const docSnap of txSnapForProof.docs) {
                try {
                  await retryFirestoreOperation(() => updateDoc(docSnap.ref, {
                    onChainProofSignature: donationProof.signature,
                    onChainProofUrl: donationProof.url,
                  }));
                  console.log(`[Admin] Updated transaction ${docSnap.id} with donation proof URL`);
                } catch (txProofError) {
                  console.error('[Admin] Failed to update transaction with proof, continuing...', txProofError);
                }
              }
            } catch (txProofQueryError) {
              console.error('[Admin] Failed to query transactions for proof update, continuing...', txProofQueryError);
            }
          } catch (updateError) {
            console.warn('[Admin] Failed to update donation with proof:', updateError);
            // Continue - proof can be updated later
          }
        }

        // Send approval confirmation email to donor
        // userData is already fetched at the top of the function
        try {
          const donorName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || userData?.email || donationDoc.userProfile?.email || 'Valued Donor';
          // Calculate tax deductible amount based on eligibility
          const taxDeductibleAmount = isRaffleEligible ? donationDoc.amount * 0.5 : donationDoc.amount; // 50% for raffle, 100% for sweepstakes
          
          const emailResponse = await fetch('/api/send-donation-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'approved',
              donorEmail: userData?.email || donationDoc.userProfile?.email,
              donorName: donorName,
              donationAmount: donationDoc.amount,
              nonprofitName: donationDoc.nonprofitName || "Unknown Nonprofit",
              donationId: id,
              totalDonated: donationDoc.amount,
              taxDeductibleAmount: taxDeductibleAmount,
              charityCoinsEarned: coinsEarned || 0,
              raffleEntriesEarned: isRaffleEligible ? (coinsEarned || 0) : 0,
              sweepstakesEntriesEarned: !isRaffleEligible ? Math.floor(donationDoc.amount) : 0,
              isRaffleEligible: isRaffleEligible,
            }),
          });

          if (emailResponse.ok) {
            console.log('[Admin] Approval confirmation email sent successfully');
          } else {
            console.warn('[Admin] Failed to send approval confirmation email (non-critical)');
          }
        } catch (emailError) {
          console.warn('[Admin] Error sending approval confirmation email (non-critical):', emailError);
          // Don't block donation approval if email fails
        }

        // Show success message
        const nonprofitName =
          donationDoc.nonprofitName || "the selected nonprofit";
        const solanaStatus = solanaTransactionSignature 
          ? `✅ Solana tokens issued (tx: ${solanaTransactionSignature.slice(0, 8)}...)`
          : `⚠️ Solana token issuance failed (coins tracked in Firestore)`;
        const walletStatus = custodialWalletAddress 
          ? `✅ Custodial wallet created: ${custodialWalletAddress.slice(0, 8)}...${custodialWalletAddress.slice(-8)}`
          : '';
        
        // Get donation proof URL if available
        // OPTIMIZATION: Use already-fetched donationDoc instead of re-reading
        let donationProofStatus = '';
        try {
          // Use donationDoc that was already fetched at the start of the function
          const proofUrl = donationDoc.onChainProofUrl;
          if (proofUrl) {
            donationProofStatus = `• Blockchain proof recorded: Verify on Solscan`;
          }
        } catch (proofCheckError) {
          // Ignore errors - not critical
          console.warn('[Admin] Failed to check donation proof URL, continuing...', proofCheckError);
        }
        
        const entryType = isRaffleEligible ? 'Raffle entries' : 'Sweepstakes entries';
        setApprovalMessage(`✅ Donation of ${formatCurrency(donationDoc.amount)} to ${nonprofitName} has been approved! The system has been updated with:
• ${coinsEarned} Charity Coins issued
${walletStatus ? `• ${walletStatus}\n` : ''}• ${solanaStatus}
${donationProofStatus ? `• ${donationProofStatus}\n` : ''}• ${entryType} added
• User profile updated
• Nonprofit wallet balance updated
• All transactions recorded`);
        setShowApprovalMessage(true);

        // Hide message after 8 seconds
        setTimeout(() => {
          setShowApprovalMessage(false);
          setApprovalMessage("");
        }, 8000);

        // Refresh donations list after approval (non-blocking)
        // OPTIMIZATION: Don't force refresh - let cache handle it to reduce Firebase reads
        // The 30-second cache will refresh automatically if needed
        setTimeout(() => {
          fetchDonations(false).catch((fetchError) => {
            console.warn('[Admin] Failed to refresh donations list, continuing...', fetchError);
            // Non-critical - donations list will refresh on next page load
          });
        }, 500);
      }
    } catch (err) {
      console.error('[Admin] Error confirming donation:', err);
      console.error('[Admin] Error stack:', err.stack);
      
      // Provide more detailed error message
      let errorMessage = "Error confirming donation: " + err.message;
      if (err.code) {
        errorMessage += ` (Code: ${err.code})`;
      }
      if (err.message?.includes('QUIC') || err.message?.includes('network')) {
        errorMessage += "\n\nThis appears to be a network connection issue. The donation may still have been processed. Please check the donations list to confirm.";
      }
      
      alert(errorMessage);
    } finally {
      setPerRowLoading((l) => ({ ...l, [id]: false }));
    }
  };

  const handleResetRaffle = async () => {
    if (
      !window.confirm(
        "This will delete ALL donations, transactions (donations, charity coins earned, raffle entries, sweepstakes entries, prize wins), sweepstakes, and reset the current raffle. This action cannot be undone. Continue?",
      )
    )
      return;
    setResetting(true);
    try {
      console.log("[ResetRaffle] Starting complete system reset...");
      
      // Helper function to delete documents in batches (Firestore limit: 500 per batch)
      const deleteInBatches = async (docsToDelete, batchSize = 500) => {
        let deletedCount = 0;
        for (let i = 0; i < docsToDelete.length; i += batchSize) {
          const batch = writeBatch(db);
          const batchDocs = docsToDelete.slice(i, i + batchSize);
          
          for (const docRef of batchDocs) {
            batch.delete(docRef);
          }
          
          try {
            await batch.commit();
            deletedCount += batchDocs.length;
            // Small delay between batches to avoid rate limiting
            if (i + batchSize < docsToDelete.length) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          } catch (error) {
            console.warn(`[ResetRaffle] Batch deletion error (continuing):`, error);
            // Continue with next batch even if one fails
          }
        }
        return deletedCount;
      };

      // 1. Delete all donations
      console.log("[ResetRaffle] Deleting all donations...");
      const querySnapshot = await getDocs(collection(db, "donations"));
      const donationRefs = querySnapshot.docs.map((docSnap) => doc(db, "donations", docSnap.id));
      const donationsDeleted = await deleteInBatches(donationRefs);
      setDonations([]);
      console.log(`[ResetRaffle] Deleted ${donationsDeleted} donations`);
      
      // 2. Delete all raffleHistory documents
      console.log("[ResetRaffle] Deleting all raffle history...");
      const raffleHistorySnap = await getDocs(collection(db, "raffleHistory"));
      const raffleHistoryRefs = raffleHistorySnap.docs.map((docSnap) => doc(db, "raffleHistory", docSnap.id));
      const raffleHistoryDeleted = await deleteInBatches(raffleHistoryRefs);
      console.log(`[ResetRaffle] Deleted ${raffleHistoryDeleted} raffle history entries`);
      
      // 2a. Delete all sweepstakesHistory documents
      console.log("[ResetRaffle] Deleting all sweepstakes history...");
      const sweepstakesHistorySnap = await getDocs(collection(db, "sweepstakesHistory"));
      const sweepstakesHistoryRefs = sweepstakesHistorySnap.docs.map((docSnap) => doc(db, "sweepstakesHistory", docSnap.id));
      const sweepstakesHistoryDeleted = await deleteInBatches(sweepstakesHistoryRefs);
      console.log(`[ResetRaffle] Deleted ${sweepstakesHistoryDeleted} sweepstakes history entries`);
      
      // 2b. Delete all sweepstakes entries and sweepstakes
      console.log("[ResetRaffle] Deleting all sweepstakes and entries...");
      const sweepstakesSnap = await getDocs(collection(db, "sweepstakes"));
      let totalSweepstakesEntriesDeleted = 0;
      // For each sweepstakes, delete all entries in its subcollection
      for (const sweepstakesDoc of sweepstakesSnap.docs) {
        const entriesSnap = await getDocs(
          collection(db, "sweepstakes", sweepstakesDoc.id, "entries"),
        );
        const entriesRefs = entriesSnap.docs.map((docSnap) => docSnap.ref);
        const entriesDeleted = await deleteInBatches(entriesRefs);
        totalSweepstakesEntriesDeleted += entriesDeleted;
      }
      // Delete all sweepstakes documents
      const sweepstakesRefs = sweepstakesSnap.docs.map((docSnap) => doc(db, "sweepstakes", docSnap.id));
      const sweepstakesDeleted = await deleteInBatches(sweepstakesRefs);
      console.log(`[ResetRaffle] Deleted ${totalSweepstakesEntriesDeleted} sweepstakes entries and ${sweepstakesDeleted} sweepstakes`);
      
      // 3. Delete all raffles except 'current'
      console.log("[ResetRaffle] Cleaning up raffles...");
      const rafflesSnap = await getDocs(collection(db, "raffles"));
      // For each raffle, delete all eligibleCoinNumbers documents in its subcollection
      for (const raffleDoc of rafflesSnap.docs) {
        const eligibleSnap = await getDocs(
          collection(db, "raffles", raffleDoc.id, "eligibleCoinNumbers"),
        );
        const eligibleRefs = eligibleSnap.docs.map((docSnap) => docSnap.ref);
        await deleteInBatches(eligibleRefs);
      }
      const raffleRefsToDelete = rafflesSnap.docs
        .filter((docSnap) => docSnap.id !== "current")
        .map((docSnap) => doc(db, "raffles", docSnap.id));
      await deleteInBatches(raffleRefsToDelete);
      
      // 4. Reset the current raffle - prize pool to 0, globalCoinCounter to 1 (total entries = 0)
      console.log("[ResetRaffle] Resetting current raffle...");
      await updateDoc(doc(db, "raffles", "current"), {
        prizePool: 0,
        participants: 0,
        lastUpdated: new Date().toISOString(),
        globalCoinCounter: 1, // Reset to 1 (means total entries = 0)
      });
      
      // 5. Reset charityCoins, coinNumbers, totalDonated, transactions, and achievements for all users
      console.log("[ResetRaffle] Resetting all users...");
      const usersSnapshot = await getDocs(collection(db, "users"));
      let totalTransactionsDeleted = 0;
      let totalCoinNumbersDeleted = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        try {
          // Delete ALL transactions in subcollection (donations, coin_reward, raffle_entry, prize_win, etc.)
          const txSnap = await getDocs(
            collection(db, "users", userDoc.id, "transactions"),
          );
          const txRefs = txSnap.docs.map((docSnap) => docSnap.ref);
          const txDeleted = await deleteInBatches(txRefs);
          totalTransactionsDeleted += txDeleted;
          
          // Delete all coinNumbers in subcollection
          const coinSnap = await getDocs(
            collection(db, "users", userDoc.id, "coinNumbers"),
          );
          const coinRefs = coinSnap.docs.map((docSnap) => docSnap.ref);
          const coinDeleted = await deleteInBatches(coinRefs);
          totalCoinNumbersDeleted += coinDeleted;
          
          // Reset summary fields in user document
          await updateDoc(doc(db, "users", userDoc.id), {
            charityCoins: 0,
            coinNumbers: [], // Reset array field
            totalDonated: 0,
            achievements: [],
            membershipTier: "Bronze",
          });
        } catch (userError) {
          console.warn(`[ResetRaffle] Error resetting user ${userDoc.id}:`, userError);
          // Continue with next user even if one fails
        }
      }
      console.log(`[ResetRaffle] Deleted ${totalTransactionsDeleted} transactions and ${totalCoinNumbersDeleted} coin numbers from all users`);
      
      // 6. Reset Nonprofit Wallet Balance to $0
      console.log("[ResetRaffle] Resetting nonprofit wallet balance...");
      const walletRef = doc(db, "settings", "nonprofitWallet");
      await setDoc(walletRef, { balance: 0 });
      
      // 7. Reset on-chain raffle state
      console.log("[ResetRaffle] Resetting on-chain raffle state...");
      try {
        // Reset on-chain prize pool to 0
        const resetPrizePoolResponse = await fetch('/api/update-raffle-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_prize_pool',
            amount: 0, // Reset to 0
          }),
        });
        
        if (resetPrizePoolResponse.ok) {
          console.log('[ResetRaffle] On-chain prize pool reset to 0');
        } else {
          console.warn('[ResetRaffle] Failed to reset on-chain prize pool');
        }

        // Reset on-chain total entries to 0
        const resetEntriesResponse = await fetch('/api/update-raffle-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ totalEntries: 0 }), // Reset to 0
        });
        
        if (resetEntriesResponse.ok) {
          console.log('[ResetRaffle] On-chain total entries reset to 0');
        } else {
          console.warn('[ResetRaffle] Failed to reset on-chain total entries');
        }
      } catch (onChainError) {
        // Handle gracefully - Firestore is primary source of truth
        console.warn('[ResetRaffle] On-chain reset skipped (local development or API unavailable):', onChainError.message);
      }
      
      console.log("[ResetRaffle] Complete system reset finished successfully");
      alert(
        `✅ Complete System Reset Successful!\n\n` +
        `• ${donationsDeleted} donations deleted\n` +
        `• ${raffleHistoryDeleted} raffle history entries deleted\n` +
        `• ${sweepstakesHistoryDeleted} sweepstakes history entries deleted\n` +
        `• ${totalSweepstakesEntriesDeleted} sweepstakes entries deleted\n` +
        `• ${sweepstakesDeleted} sweepstakes deleted\n` +
        `• ${totalTransactionsDeleted} user transactions deleted (all types: donations, coin rewards, raffle entries, sweepstakes entries, prize wins)\n` +
        `• ${totalCoinNumbersDeleted} coin numbers deleted\n` +
        `• All user profiles reset (charity coins, donations, achievements)\n` +
        `• Raffle reset (prize pool: $0, total entries: 0)\n` +
        `• Nonprofit wallet balance reset to $0\n` +
        `• On-chain raffle state reset (if available)\n\n` +
        `Coin numbers will start from 1 for new donations.`,
      );
    } catch (err) {
      console.error("[ResetRaffle] Error:", err);
      alert("Error resetting raffle: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  // Add bulk action handlers (to be implemented)
  // Helper: get selected pending donations
  const handleBulkConfirm = async () => {
    setLoading(true);
    // Confirm all selected donations that are not already confirmed, across all pages
    const toConfirm = donations.filter(
      (d) => selectedDonations.includes(d.id) && d.status !== "confirmed",
    );
    for (const d of toConfirm) {
      await handleConfirmDonation(d.id);
    }
    // Refresh donations list
    const querySnapshot = await getDocs(collection(db, "donations"));
    const donationList = querySnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));
    donationList.sort((a, b) => {
      const aDate = a.createdAt?.seconds
        ? a.createdAt.seconds
        : a.createdAt || 0;
      const bDate = b.createdAt?.seconds
        ? b.createdAt.seconds
        : b.createdAt || 0;
      return bDate - aDate;
    });
    setDonations(donationList);
    clearSelection();
    setLoading(false);
  };
  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      for (const id of selectedDonations) {
        await handleDeleteDonation(id);
      }
      clearSelection();
    } finally {
      setLoading(false);
    }
  };

  // Sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1);
  };
  // Optimized sorting and pagination with useMemo
  const sortedDonations = useMemo(() => {
    return [...donations].sort((a, b) => {
      let aValue, bValue;
      if (sortField === "userProfile.email") {
        aValue = a.userProfile?.email || a.email || "";
        bValue = b.userProfile?.email || b.email || "";
      } else if (sortField === "createdAt") {
        aValue = a.createdAt?.seconds ? a.createdAt.seconds : a.createdAt || 0;
        bValue = b.createdAt?.seconds ? b.createdAt.seconds : b.createdAt || 0;
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      if (aValue < bValue) return sortAsc ? -1 : 1;
      if (aValue > bValue) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [donations, sortField, sortAsc]);

  // Pagination logic
  const totalDonations = sortedDonations.length;
  const totalPages = Math.ceil(totalDonations / donationsPerPage);
  const startIndex = (currentPage - 1) * donationsPerPage;
  const endIndex = startIndex + donationsPerPage;
  const paginatedDonations = sortedDonations.slice(startIndex, endIndex);

  // Now safe to use paginatedDonations
  const selectedPendingDonations = paginatedDonations.filter(
    (d) => selectedDonations.includes(d.id) && d.status !== "confirmed",
  );

  return (
    <div className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-deep-red-600 hover:text-deep-red-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8 text-deep-red-800">
        Data Management
      </h1>

      {/* Success Message */}
      {showApprovalMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Donation Approved Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700 whitespace-pre-line">
                {approvalMessage}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => {
                  setShowApprovalMessage(false);
                  setApprovalMessage("");
                }}
                className="inline-flex text-green-400 hover:text-green-600"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <button
          onClick={handleResetRaffle}
          disabled={resetting}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg shadow"
        >
          {resetting ? "Resetting..." : "Delete All Donations & Reset Raffle"}
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleBulkConfirm}
            disabled={selectedPendingDonations.length === 0 || loading}
            className={`px-4 py-2 rounded-lg font-semibold shadow ${selectedPendingDonations.length === 0 || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            Confirm Selected
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selectedDonations.length === 0 || loading}
            className={`px-4 py-2 rounded-lg font-semibold shadow ${selectedDonations.length === 0 || loading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"}`}
          >
            Delete Selected
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={
                    paginatedDonations.length > 0 &&
                    paginatedDonations.every((d) =>
                      selectedDonations.includes(d.id),
                    )
                  }
                  onChange={selectAllOnPage}
                />
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("userProfile.email")}
              >
                Donor Email
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("nonprofitName")}
              >
                Nonprofit
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("amount")}
              >
                Amount
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("createdAt")}
              >
                Date
              </th>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => handleSort("status")}
              >
                Status
              </th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDonations.map((donation) => (
              <tr key={donation.id} className="border-b">
                <td className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={selectedDonations.includes(donation.id)}
                    onChange={() => toggleSelectDonation(donation.id)}
                  />
                </td>
                <td className="px-4 py-2">
                  {donation.userProfile?.email || donation.email || "N/A"}
                </td>
                <td className="px-4 py-2">
                  <div>
                    <div className="font-medium text-gray-900">
                      {donation.nonprofitName || "Unknown Nonprofit"}
                    </div>
                    {donation.nonprofitCategory && (
                      <div className="text-sm text-gray-500">
                        {donation.nonprofitCategory}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2">{formatCurrency(donation.amount)}</td>
                <td className="px-4 py-2">
                  {donation.createdAt
                    ? new Date(
                        donation.createdAt.seconds
                          ? donation.createdAt.seconds * 1000
                          : donation.createdAt,
                      ).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        donation.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : donation.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {donation.status || "pending"}
                    </span>
                    {donation.onChainProofUrl && donation.status === "confirmed" && (
                      <a
                        href={donation.onChainProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        title="View donation proof on Solana Explorer"
                      >
                        <span>Proof</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2 space-x-2">
                  <div className="flex flex-row gap-2">
                    <button
                      onClick={() => handleDeleteDonation(donation.id)}
                      className="p-2 bg-red-100 hover:bg-red-200 rounded"
                      title="Delete"
                      disabled={!!perRowLoading[donation.id] || loading}
                    >
                      <Trash2 className="h-5 w-5 text-red-700" />
                    </button>
                    {donation.status !== "confirmed" && (
                      <button
                        onClick={() => handleConfirmDonation(donation.id)}
                        className="p-2 bg-green-100 hover:bg-green-200 rounded"
                        title="Confirm"
                        disabled={!!perRowLoading[donation.id] || loading}
                      >
                        <Check className="h-5 w-5 text-green-700" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {donations.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  No donations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between px-4 pb-4">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(endIndex, totalDonations)} of{" "}
              {totalDonations} donations
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {"<"}
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? "bg-deep-red-600 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {">"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-deep-red-800">
            Recently Deleted Donations
          </h2>
          <button
            onClick={() => fetchDeletedDonations(true)}
            className="px-3 py-1 text-sm font-medium text-white bg-deep-red-600 hover:bg-deep-red-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={deletedLoading}
          >
            {deletedLoading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Individual deletions appear here for quick recovery. Bulk resets are
          excluded automatically.
        </p>
        {deletedLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-500">
            Loading deleted donations...
          </div>
        ) : deletedDonations.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-500">
            No deleted donations available to restore.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Deleted On
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Donor Email
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Nonprofit
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Status Before Delete
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {deletedDonations.map((backup) => {
                  const donation =
                    backup.donationSnapshot || backup.donationData || {};
                  const restoreInfo = backup.restoreMetadata || {};
                  const deletionId = backup.donationId || backup.id;
                  return (
                    <tr key={deletionId}>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatTimestamp(backup.deletedAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {backup.donorEmail ||
                          donation.userProfile?.email ||
                          donation.email ||
                          "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {backup.nonprofitName ||
                          donation.nonprofitName ||
                          "Unknown Nonprofit"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        {donation.amount
                          ? formatCurrency(donation.amount)
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 capitalize">
                        {restoreInfo.statusBeforeDeletion || "pending"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800">
                        <button
                          onClick={() => handleRestoreDonation(deletionId)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={!!restoring[deletionId]}
                        >
                          {restoring[deletionId] ? "Restoring..." : "Restore"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
