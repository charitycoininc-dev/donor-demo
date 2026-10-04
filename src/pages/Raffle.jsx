import { useState, useEffect } from "react";
import {
  Gift,
  Clock,
  Coins,
  Trophy,
  Shield,
  ChevronLeft,
  ChevronRight,
  Users,
  ExternalLink,
} from "lucide-react";
import { useAuth, useRaffle } from "../stores";
import { formatCurrency } from "../utils/currency";
import { collection, getDocs, query, orderBy, limit, collectionGroup, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../stores/config/firebase.js";

// Remove mock pastDrawings
// const pastDrawings = [ ... ];

export default function Raffle() {
  const { user, loading, updateUser } = useAuth();
  const { currentRaffle, startRaffleListener, stopRaffleListener } = useRaffle();
  const [currentPage, setCurrentPage] = useState(1);
  const coinsPerPage = 100; // 10 rows × 10 columns = 100 coins per page
  // Past raffle drawings state
  const [raffleHistory, setRaffleHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  // Total eligible raffle entries state
  const [totalEligibleEntries, setTotalEligibleEntries] = useState(0);
  const [loadingEligibleEntries, setLoadingEligibleEntries] = useState(true);
  // User's actual coin numbers state
  const [userCoinNumbers, setUserCoinNumbers] = useState([]);
  const [loadingCoinNumbers, setLoadingCoinNumbers] = useState(true);
  // User's sweepstakes entries state
  const [userSweepstakesEntries, setUserSweepstakesEntries] = useState([]);
  const [loadingSweepstakesEntries, setLoadingSweepstakesEntries] = useState(true);
  const [sweepstakesCurrentPage, setSweepstakesCurrentPage] = useState(1);
  // Current sweepstakes state
  const [currentSweepstakes, setCurrentSweepstakes] = useState(null);
  const [loadingSweepstakes, setLoadingSweepstakes] = useState(true);

  // Add caching for raffle history
  const [lastHistoryFetch, setLastHistoryFetch] = useState(0);
  const HISTORY_CACHE_DURATION = 300000; // 5 minutes cache

  // Start raffle listener when component mounts
  useEffect(() => {
    startRaffleListener();
    return () => {
      stopRaffleListener();
    };
  }, [startRaffleListener, stopRaffleListener]);

  // Fetch raffle history from Firestore
  useEffect(() => {
    const fetchRaffleHistory = async () => {
      const now = Date.now();
      if (now - lastHistoryFetch < HISTORY_CACHE_DURATION) {
        return; // Use cached data
      }

      setLoadingHistory(true);
      try {
        // Limit to recent history and use ordering
        const historyQuery = query(
          collection(db, "raffleHistory"),
          orderBy("date", "desc"),
          limit(20), // Only fetch last 20 raffle drawings
        );
        const historySnap = await getDocs(historyQuery);
        const history = historySnap.docs
          .map((docSnap) => {
            const data = docSnap.data();
            const status = data.status || "finalized";
            if (status !== "finalized") return null;
            return {
              id: docSnap.id,
              ...data,
              status,
              kycVerification:
                data.kycVerification ||
                (status === "finalized" ? "Yes" : status === "rejected" ? "No" : "Pending"),
            };
          })
          .filter(Boolean);
        setRaffleHistory(history);
        setLastHistoryFetch(now);
      } catch {
        setRaffleHistory([]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchRaffleHistory();
  }, [lastHistoryFetch]);

  // Fetch total eligible raffle entries from Firestore
  // Calculate: (globalCoinCounter - 1) - winning entries
  // globalCoinCounter is the next coin number to assign, so (globalCoinCounter - 1) is total entries
  useEffect(() => {
    const fetchTotalEligibleEntries = async () => {
      setLoadingEligibleEntries(true);
      try {
        // Get globalCoinCounter from current raffle
        // globalCoinCounter - 1 = total number of coin entries issued
        const totalEntries = currentRaffle?.globalCoinCounter 
          ? currentRaffle.globalCoinCounter - 1 
          : 0;
        
        console.log("[Raffle] Total entries (globalCoinCounter - 1):", totalEntries);

        // Count winning entries from raffleHistory
        // Each drawing has one winner, so count all drawings
        const historySnap = await getDocs(collection(db, "raffleHistory"));
        const winningEntriesCount = historySnap.docs.filter((docSnap) => {
          const status = docSnap.data().status || "finalized";
          return status === "finalized";
        }).length;
        
        console.log("[Raffle] Winning entries count:", winningEntriesCount);

        // Calculate eligible entries: total - winners
        const eligibleEntries = Math.max(0, totalEntries - winningEntriesCount);
        
        console.log("[Raffle] Eligible entries:", eligibleEntries, "=", totalEntries, "-", winningEntriesCount);
        
        setTotalEligibleEntries(eligibleEntries);
      } catch (error) {
        console.error("Error fetching total eligible raffle entries:", error);
        console.error("Error details:", error.message, error.code);
        setTotalEligibleEntries(0);
      } finally {
        setLoadingEligibleEntries(false);
      }
    };
    
    // Only fetch when currentRaffle is available
    if (currentRaffle) {
      fetchTotalEligibleEntries();
    }
  }, [currentRaffle]);

  // Get charity coins count from user document (same as wallet page)
  const charityCoins = user?.charityCoins || 0;

  // Fetch user's actual coin numbers from Firestore
  useEffect(() => {
    const fetchUserCoinNumbers = async () => {
      // User object uses 'id' or 'uid' field (check both)
      const userId = user?.id || user?.uid;
      
      if (!userId) {
        console.log("[Raffle] No user ID found. User object:", user);
        console.log("[Raffle] User loading state:", loading);
        setUserCoinNumbers([]);
        setLoadingCoinNumbers(false);
        return;
      }

      console.log(`[Raffle] Fetching coin numbers for user: ${userId}`);
      setLoadingCoinNumbers(true);
      try {
        // OPTIMIZATION: Use coinNumbers array from user document instead of reading subcollection
        // This reduces Firestore reads from N documents to 1 document (where N = number of coins)
        // The user document is already loaded in the auth store, so we can use it directly
        const coinNumbersArray = user?.coinNumbers || [];
        
        if (coinNumbersArray.length > 0) {
          // Filter and sort the coin numbers
          const coinNumbers = coinNumbersArray
            .filter((num) => {
              const isValid = num != null && !isNaN(num);
              if (!isValid) {
                console.warn(`[Raffle] Filtered out invalid coin number:`, num);
              }
              return isValid;
            })
            .sort((a, b) => a - b);
          
          console.log(`[Raffle] ✅ Found ${coinNumbers.length} valid coin numbers from user document (1 read instead of ${coinNumbers.length} reads)`);
          setUserCoinNumbers(coinNumbers);
        } else {
          // Fallback: If user document doesn't have coinNumbers array, fetch from subcollection
          // This should rarely happen, but provides backward compatibility
          // Also update the user document with the array so future reads are optimized
          console.warn(`[Raffle] User document missing coinNumbers array, falling back to subcollection read`);
          const coinNumbersCol = collection(db, "users", userId, "coinNumbers");
          const coinNumbersSnap = await getDocs(coinNumbersCol);
          
          const coinNumbers = coinNumbersSnap.docs
            .map((docSnap) => {
              const data = docSnap.data();
              return data.coinNumber;
            })
            .filter((num) => {
              const isValid = num != null && !isNaN(num);
              return isValid;
            })
            .sort((a, b) => a - b);
          
          console.log(`[Raffle] ✅ Found ${coinNumbers.length} coin numbers from subcollection (fallback)`);
          setUserCoinNumbers(coinNumbers);
          
          // OPTIMIZATION: Update user document with coinNumbers array to avoid future subcollection reads
          // This is a one-time migration that happens automatically
          if (coinNumbers.length > 0) {
            try {
              const userRef = doc(db, "users", userId);
              await updateDoc(userRef, {
                coinNumbers: coinNumbers,
              });
              console.log(`[Raffle] ✅ Updated user document with coinNumbers array (${coinNumbers.length} coins) - future reads will be optimized`);
              
              // Update local user state in auth store
              updateUser({ coinNumbers: coinNumbers });
            } catch (updateError) {
              console.warn(`[Raffle] Failed to update user document with coinNumbers array (non-critical):`, updateError);
              // Non-critical - the page still works, just won't be optimized for next visit
            }
          }
        }
      } catch (error) {
        console.error("[Raffle] ❌ Error fetching user coin numbers:", error);
        console.error("[Raffle] Error details:", {
          message: error.message,
          code: error.code,
          stack: error.stack,
        });
        // If it's an index error, show helpful message
        if (error.code === 'failed-precondition') {
          console.warn("[Raffle] Firestore index may be missing. Check browser console for index creation link.");
        }
        // If it's a permission error
        if (error.code === 'permission-denied') {
          console.error("[Raffle] Permission denied - check Firestore security rules");
        }
        setUserCoinNumbers([]);
      } finally {
        setLoadingCoinNumbers(false);
      }
    };

    fetchUserCoinNumbers();
  }, [user?.id, user?.uid, user?.coinNumbers, loading]);

  // Fetch user's sweepstakes entries from Firestore
  useEffect(() => {
    const fetchUserSweepstakesEntries = async () => {
      const userId = user?.id || user?.uid;
      
      if (!userId) {
        setUserSweepstakesEntries([]);
        setLoadingSweepstakesEntries(false);
        return;
      }

      console.log(`[Raffle] Fetching sweepstakes entries for user: ${userId}`);
      setLoadingSweepstakesEntries(true);
      try {
        // Get all active sweepstakes
        const sweepstakesQuery = query(
          collection(db, "sweepstakes"),
          where("status", "==", "active")
        );
        const sweepstakesSnap = await getDocs(sweepstakesQuery);
        
        const allEntries = [];
        
        // For each active sweepstakes, get user's entries
        for (const sweepstakesDoc of sweepstakesSnap.docs) {
          const entriesQuery = query(
            collection(db, "sweepstakes", sweepstakesDoc.id, "entries"),
            where("userId", "==", userId)
          );
          const entriesSnap = await getDocs(entriesQuery);
          
          entriesSnap.docs.forEach((entryDoc) => {
            const entryData = entryDoc.data();
            if (entryData.entryNumber != null && !isNaN(entryData.entryNumber)) {
              allEntries.push({
                entryNumber: entryData.entryNumber,
                sweepstakesId: sweepstakesDoc.id,
                sweepstakesName: sweepstakesDoc.data().name || "Sweepstakes",
                donationId: entryData.donationId,
              });
            }
          });
        }
        
        // Sort by entry number
        allEntries.sort((a, b) => a.entryNumber - b.entryNumber);
        
        console.log(`[Raffle] ✅ Found ${allEntries.length} sweepstakes entries`);
        setUserSweepstakesEntries(allEntries);
      } catch (error) {
        console.error("[Raffle] ❌ Error fetching user sweepstakes entries:", error);
        setUserSweepstakesEntries([]);
      } finally {
        setLoadingSweepstakesEntries(false);
      }
    };

    fetchUserSweepstakesEntries();
  }, [user?.id, user?.uid, loading]);

  // Fetch current active sweepstakes
  useEffect(() => {
    const fetchCurrentSweepstakes = async () => {
      setLoadingSweepstakes(true);
      try {
        const sweepstakesQuery = query(
          collection(db, "sweepstakes"),
          where("status", "==", "active"),
          limit(1)
        );
        const sweepstakesSnap = await getDocs(sweepstakesQuery);
        
        if (!sweepstakesSnap.empty) {
          const sweepstakesDoc = sweepstakesSnap.docs[0];
          setCurrentSweepstakes({
            id: sweepstakesDoc.id,
            ...sweepstakesDoc.data(),
          });
        } else {
          setCurrentSweepstakes(null);
        }
      } catch (error) {
        console.error("[Raffle] Error fetching current sweepstakes:", error);
        setCurrentSweepstakes(null);
      } finally {
        setLoadingSweepstakes(false);
      }
    };

    fetchCurrentSweepstakes();
  }, []);

  // Only show coin numbers if the user has confirmed donations (coin numbers are only assigned on confirmation)
  // If no confirmed donations, show a message
  const hasConfirmedEntries = userCoinNumbers.length > 0;

  // Paginate the actual coin numbers
  const totalPages = Math.ceil(userCoinNumbers.length / coinsPerPage);
  const startIndex = (currentPage - 1) * coinsPerPage;
  const endIndex = Math.min(startIndex + coinsPerPage, userCoinNumbers.length);
  const paginatedCoinNumbers = userCoinNumbers.slice(startIndex, endIndex);
  
  // Paginate sweepstakes entries
  const sweepstakesTotalPages = Math.ceil(userSweepstakesEntries.length / coinsPerPage);
  const sweepstakesStartIndex = (sweepstakesCurrentPage - 1) * coinsPerPage;
  const sweepstakesEndIndex = Math.min(sweepstakesStartIndex + coinsPerPage, userSweepstakesEntries.length);
  const paginatedSweepstakesEntries = userSweepstakesEntries.slice(sweepstakesStartIndex, sweepstakesEndIndex);
  
  const handleSweepstakesPageChange = (newPage) => {
    setSweepstakesCurrentPage(newPage);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Reset to page 1 when user or coin numbers change
  useEffect(() => {
    setCurrentPage(1);
    setSweepstakesCurrentPage(1);
  }, [user?.id, user?.uid, userCoinNumbers.length, userSweepstakesEntries.length]);

  // Get tooltip text for randomness method
  const getRandomnessMethodTooltip = (method) => {
    switch (method) {
      case 'switchboard-vrf':
        return 'Switchboard VRF: Verifiable Random Function from Switchboard oracle. Uses cryptographically secure randomness from an on-chain oracle (most secure method).';
      case 'blockhash':
        return 'Blockhash: Uses Solana blockchain blockhash for randomness. Verifiable on-chain by checking the blockhash on Solana Explorer.';
      case 'fallback':
        return 'Fallback: Standard random number generator. Used when blockchain-based randomness methods are unavailable.';
      default:
        return 'Randomness method not specified.';
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-deep-red-800 mb-4">
            50/50 Community Raffle & Sweepstake
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your charity coins are earned automatically when you donate. Each
            coin earns an automatic entry into the raffle.* When the prize pool
            hits the Raffle Trigger Amount, a random entry is selected as the
            winner and the pool resets.
          </p>
        </div>

        {/* Current Raffle Info */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-3 mb-2">
              <Gift className="h-8 w-8 text-gold-500" />
              <span className="text-lg font-semibold text-deep-red-800">
                Current Raffle Prize Pool
              </span>
            </div>
            <div className="text-3xl font-bold text-gold-600">
              {formatCurrency(currentRaffle?.prizePool || 0)}
            </div>
            {/* Total Eligible Raffle Entries */}
            <div className="mt-4 flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-500" />
              <span className="text-lg font-semibold text-purple-800">
                Total Eligible Raffle Entries
              </span>
            </div>
            <div className="text-3xl font-bold text-purple-600 mt-1">
              {loadingEligibleEntries ? (
                <span className="text-lg">Loading...</span>
              ) : (
                totalEligibleEntries.toLocaleString()
              )}
            </div>
            {/* Raffle Trigger Amount */}
            <div className="mt-4 flex items-center space-x-2">
              <Clock className="h-8 w-8 text-blue-500" />
              <span className="text-lg font-semibold text-blue-800">
                Raffle Trigger Amount
              </span>
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-1">
              {formatCurrency(currentRaffle?.autoDrawAmount || 100000)}
            </div>
            
            {/* Current Sweepstake */}
            <div className="mt-4 flex items-center space-x-2">
              <Gift className="h-8 w-8 text-purple-500" />
              <span className="text-lg font-semibold text-purple-800">
                Current Sweepstake
              </span>
            </div>
            {loadingSweepstakes ? (
              <div className="text-lg text-gray-500 mt-1">Loading...</div>
            ) : currentSweepstakes ? (
              <>
                <div className="text-xl font-semibold text-purple-700 mt-1">
                  {currentSweepstakes.name || "Active Sweepstakes"}
                </div>
                <div className="text-2xl font-bold text-purple-600 mt-1">
                  {formatCurrency(currentSweepstakes.prizePool || 0)}
                </div>
              </>
            ) : (
              <div className="text-lg text-gray-500 mt-1">No active sweepstakes</div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Coins className="h-8 w-8 text-green-500" />
              <span className="text-lg font-semibold text-deep-red-800">
                Your Coins / Raffle & Sweepstake Entries
              </span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {(hasConfirmedEntries ? userCoinNumbers.length : 0) + (userSweepstakesEntries.length > 0 ? userSweepstakesEntries.length : 0)}
            </div>
            {loadingCoinNumbers ? (
              <div className="mt-4 text-sm text-gray-500">Loading your raffle entries...</div>
            ) : hasConfirmedEntries ? (
              <div className="mt-4">
                <div className="text-sm text-gray-700 mb-2">
                  Your confirmed raffle entry numbers ({userCoinNumbers.length}{" "}
                  total):
                </div>
                {/* Coin Numbers Grid */}
                <div className="grid grid-cols-10 gap-1 mb-4">
                  {paginatedCoinNumbers.map((coinNumber) => (
                    <div
                      key={coinNumber}
                      className="bg-gold-50 border border-gold-200 rounded p-1 text-center text-xs font-medium text-gold-700 hover:bg-gold-100 transition-colors"
                    >
                      #{coinNumber}
                    </div>
                  ))}
                </div>
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      Showing {startIndex + 1}-
                      {Math.min(endIndex, userCoinNumbers.length)} of{" "}
                      {userCoinNumbers.length} raffle entries
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Previous Page Button */}
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`p-1 rounded transition-colors ${
                          currentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, index) => {
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
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  currentPage === pageNum
                                    ? "bg-deep-red-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>
                      {/* Next Page Button */}
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`p-1 rounded transition-colors ${
                          currentPage === totalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 text-gray-500 text-sm">
                No confirmed raffle entries yet. Raffle entries are only issued
                after your donation is approved by an admin.
              </div>
            )}
            
            {/* Sweepstakes Entries - directly below raffle entries */}
            {loadingSweepstakesEntries ? (
              <div className="mt-6 text-sm text-gray-500">Loading your sweepstakes entries...</div>
            ) : userSweepstakesEntries.length > 0 ? (
              <div className="mt-6">
                <div className="text-sm text-gray-700 mb-2">
                  Your confirmed sweepstake entry numbers ({userSweepstakesEntries.length}{" "}
                  total):
                </div>
                {/* Sweepstakes Entry Numbers Grid */}
                <div className="grid grid-cols-10 gap-1 mb-4">
                  {paginatedSweepstakesEntries.map((entry) => (
                    <div
                      key={`${entry.sweepstakesId}-${entry.entryNumber}`}
                      className="bg-purple-50 border border-purple-200 rounded p-1 text-center text-xs font-medium text-purple-700 hover:bg-purple-100 transition-colors"
                    >
                      #{entry.entryNumber}
                    </div>
                  ))}
                </div>
                {/* Pagination Controls */}
                {sweepstakesTotalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-600">
                      Showing {sweepstakesStartIndex + 1}-
                      {Math.min(sweepstakesEndIndex, userSweepstakesEntries.length)} of{" "}
                      {userSweepstakesEntries.length} sweepstake entries
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Previous Page Button */}
                      <button
                        onClick={() => handleSweepstakesPageChange(sweepstakesCurrentPage - 1)}
                        disabled={sweepstakesCurrentPage === 1}
                        className={`p-1 rounded transition-colors ${
                          sweepstakesCurrentPage === 1
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {Array.from(
                          { length: Math.min(5, sweepstakesTotalPages) },
                          (_, index) => {
                            let pageNum;
                            if (sweepstakesTotalPages <= 5) {
                              pageNum = index + 1;
                            } else if (sweepstakesCurrentPage <= 3) {
                              pageNum = index + 1;
                            } else if (sweepstakesCurrentPage >= sweepstakesTotalPages - 2) {
                              pageNum = sweepstakesTotalPages - 4 + index;
                            } else {
                              pageNum = sweepstakesCurrentPage - 2 + index;
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handleSweepstakesPageChange(pageNum)}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  sweepstakesCurrentPage === pageNum
                                    ? "bg-deep-red-600 text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          },
                        )}
                      </div>
                      {/* Next Page Button */}
                      <button
                        onClick={() => handleSweepstakesPageChange(sweepstakesCurrentPage + 1)}
                        disabled={sweepstakesCurrentPage === sweepstakesTotalPages}
                        className={`p-1 rounded transition-colors ${
                          sweepstakesCurrentPage === sweepstakesTotalPages
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Past Raffle Drawings */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-deep-red-800 mb-4 flex items-center">
            <Trophy className="h-6 w-6 text-gold-500 mr-2" /> Past Raffle
            Drawings
          </h2>
          <div className="bg-white rounded-2xl shadow p-6 overflow-x-auto">
            {loadingHistory ? (
              <p className="text-gray-600">Loading past drawings...</p>
            ) : raffleHistory.length === 0 ? (
              <p className="text-gray-600">No past drawings yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Winning Entry
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prize Pool
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Winner Wallet
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Randomness Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {raffleHistory.map((drawing, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                          {new Date(drawing.date).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-700">
                          #{drawing.winningCoinNumber}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                          {formatCurrency(drawing.prizePool || 0)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {drawing.solanaWallet ? (
                            <span className="font-mono text-xs">
                              {drawing.solanaWallet.substring(0, 8)}...
                              {drawing.solanaWallet.substring(drawing.solanaWallet.length - 8)}
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span 
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                              drawing.randomnessMethod === 'switchboard-vrf' 
                                ? 'bg-purple-100 text-purple-800'
                                : drawing.randomnessMethod === 'blockhash'
                                ? 'bg-blue-100 text-blue-800'
                                : drawing.randomnessMethod === 'fallback'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                            title={getRandomnessMethodTooltip(drawing.randomnessMethod)}
                          >
                            {drawing.randomnessMethod || 'N/A'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {drawing.onChainUrl ? (
                            <a
                              href={drawing.onChainUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              title="Verify on Solana Explorer"
                            >
                              <span>Verify</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-gray-400 text-xs">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* How the Raffle Works */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-deep-red-800 mb-4">
            How the Raffle Works
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Donate to earn charity coins.</li>
            <li>Each coin earns you an automatic entry into the raffle.*</li>
            <li>
              When the prize pool reaches the Raffle Trigger Amount, a random
              entry is selected as the winner and the pool resets to $0.
            </li>
            <li>
              If you don&apos;t win, your entries remain as entries for the next
              drawing.
            </li>
          </ol>
        </div>

        {/* Fair Play Guarantee */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-blue-800 mb-2">
              Fair Play Guarantee
            </h3>
            <p className="text-blue-700 text-sm">
              All raffle drawings are conducted transparently and randomly.
              Every entry has an equal chance to win. The process is audited and
              verifiable for fairness.
            </p>
          </div>
        </div>

        {/* State Eligibility Disclaimer */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-4xl mx-auto">
          <p className="text-sm text-gray-700 leading-relaxed">
            *50/50 raffles are not allowed in all states. If it is determined that you are in a state that does not allow 50/50 raffles, your donation will be processed as a non-raffle-eligible donation. You will still earn Charity Coins for your donations, but you will not earn raffle entries. You will instead receive sweepstake entries (1 for every dollar donated). Your donation will be 100% tax deductible.
          </p>
        </div>
      </div>
    </div>
  );
}
