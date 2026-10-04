import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronUp, ChevronDown, ExternalLink } from "lucide-react";
import { useAuth } from "../../stores";
import { firebaseService } from "../../stores";
import { db } from "../../stores/config/firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
  collectionGroup,
  limit,
} from "firebase/firestore";
import { formatCurrency } from "../../utils/currency";

const TRANSACTIONS_PER_PAGE = 25;

export default function AdminTransactionManagement() {
  const { user, isAuthenticated, loading } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState({}); // Map of userId -> user data
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState("date");
  const [sortAsc, setSortAsc] = useState(false); // Default to newest first
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [raffleHistoryMap, setRaffleHistoryMap] = useState({}); // Map coinNumber -> raffleHistory

  useEffect(() => {
    const fetchAllTransactions = async () => {
      if (!isAuthenticated || user?.role !== "admin") return;

      try {
        setLoadingTransactions(true);
        setError(null);

        console.log("[TransactionManagement] Fetching all transactions...");

        // First, fetch users with limit to reduce Firebase reads
        // Only fetch first 50 users - admins can use pagination for more
        const usersQuery = query(
          collection(db, "users"),
          limit(50) // Limit to 50 users to reduce Firebase reads
        );
        const usersSnap = await getDocs(usersQuery);
        const usersList = usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log(`[TransactionManagement] Found ${usersList.length} users (limited to 50)`);
        
        const usersMap = {};
        usersList.forEach((userData) => {
          usersMap[userData.id] = userData;
        });
        setUsers(usersMap);

        // Fetch all transactions from all users
        // Using per-user method (more reliable than collectionGroup which requires index)
        let allTransactions = [];
        
        // Pre-fetch donations to get accurate timestamps and proof URLs for transactions with donationId
        // For coin_reward and raffle_entry, we need the donation's confirmedAt or lastUpdated timestamp
        // since they're created when the donation is confirmed, not when it's created
        const donationsMap = new Map(); // Map donationId -> { timestamp, onChainProofUrl }
        try {
          const donationsQuery = query(
            collection(db, "donations"),
            orderBy("createdAt", "desc"),
            limit(100) // Reduced from 500 to 100 to reduce Firebase reads
          );
          const donationsSnap = await getDocs(donationsQuery);
          donationsSnap.forEach((doc) => {
            const donation = doc.data();
            // Prefer confirmedAt, then lastUpdated, then createdAt
            let timestamp = null;
            if (donation.confirmedAt) {
              timestamp = donation.confirmedAt;
            } else if (donation.lastUpdated) {
              // lastUpdated might be a string or timestamp
              timestamp = donation.lastUpdated;
            } else if (donation.createdAt) {
              timestamp = donation.createdAt;
            }
            
            if (doc.id) {
              donationsMap.set(doc.id, {
                timestamp,
                onChainProofUrl: donation.onChainProofUrl || null,
                onChainProofSignature: donation.onChainProofSignature || null,
              });
            }
          });
          console.log(`[TransactionManagement] Loaded ${donationsMap.size} donation records with timestamps and proof URLs`);
        } catch (err) {
          console.warn("[TransactionManagement] Could not fetch donations for timestamp lookup:", err);
        }
        
        console.log("[TransactionManagement] Fetching transactions per user...");
        let fetchedCount = 0;
        
        for (const userData of usersList) {
          try {
            // Fetch transactions directly to get document metadata (createTime)
            // Reduced limit to reduce Firebase reads
            const transactionsQuery = query(
              collection(db, "users", userData.id, "transactions"),
              orderBy("date", "desc"),
              limit(50) // Reduced from 1000 to 50 to reduce Firebase reads
            );
            const transactionsSnap = await getDocs(transactionsQuery);
            
            if (transactionsSnap.docs.length > 0) {
              console.log(`[TransactionManagement] User ${userData.email || userData.id}: ${transactionsSnap.docs.length} transactions`);
            }
            
            transactionsSnap.forEach((docSnap) => {
              const tx = {
                id: docSnap.id,
                ...docSnap.data(),
              };
              
              // Make sure we have the transaction data with proper structure
              if (tx && (tx.id || tx.date || tx.type || tx.amount)) {
                // For coin_reward and raffle_entry transactions without createdAt:
                // They are created when the donation is confirmed, so use the donation's timestamp
                // if available (prefer confirmedAt, then lastUpdated, then createdAt)
                if (!tx.createdAt && tx.donationId && donationsMap.has(tx.donationId)) {
                  const donationData = donationsMap.get(tx.donationId);
                  tx.createdAt = donationData.timestamp;
                }
                
                // For donation transactions: if transaction doesn't have onChainProofUrl but the donation does,
                // use the donation's proof URL as a fallback
                if (tx.type === "donation" && tx.donationId && donationsMap.has(tx.donationId)) {
                  const donationData = donationsMap.get(tx.donationId);
                  if (!tx.onChainProofUrl && donationData.onChainProofUrl) {
                    tx.onChainProofUrl = donationData.onChainProofUrl;
                    tx.onChainProofSignature = donationData.onChainProofSignature;
                  }
                }
                
                allTransactions.push({
                  id: tx.id || `${userData.id}-${Date.now()}-${Math.random()}`,
                  userId: userData.id,
                  userEmail: userData.email || "Unknown User",
                  userName: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "Unknown",
                  ...tx,
                });
                fetchedCount++;
              }
            });
          } catch (err) {
            console.error(`[TransactionManagement] Error fetching transactions for user ${userData.id}:`, err);
          }
        }
        
        console.log(`[TransactionManagement] Total fetched: ${fetchedCount} transactions from ${usersList.length} users`);

        // Sort transactions by date (most recent first)
        // Prefer createdAt (serverTimestamp) for accurate sorting
        allTransactions.sort((a, b) => {
          const getTimestamp = (tx) => {
            if (tx.createdAt) {
              if (tx.createdAt.toDate) {
                return tx.createdAt.toDate().getTime();
              } else if (tx.createdAt.seconds) {
                return tx.createdAt.seconds * 1000;
              } else {
                return new Date(tx.createdAt).getTime();
              }
            }
            return tx.date ? new Date(tx.date).getTime() : 0;
          };
          
          const dateA = getTimestamp(a);
          const dateB = getTimestamp(b);
          return dateB - dateA;
        });

        console.log(`[TransactionManagement] Total transactions found: ${allTransactions.length}`);
        
        // Fetch raffle history to link Prize Win transactions to verification links
        console.log("[TransactionManagement] Fetching raffle history for Prize Win links...");
        const raffleHistoryQuery = query(
          collection(db, "raffleHistory"),
          orderBy("date", "desc"),
          limit(500)
        );
        const raffleHistorySnap = await getDocs(raffleHistoryQuery);
        const historyMap = {};
        raffleHistorySnap.forEach((docSnap) => {
          const history = docSnap.data();
          // Map by coinNumber for easy lookup
          if (history.winningCoinNumber) {
            historyMap[history.winningCoinNumber] = history;
          }
        });
        console.log(`[TransactionManagement] Loaded ${Object.keys(historyMap).length} raffle history records`);
        setRaffleHistoryMap(historyMap);
        
        setTransactions(allTransactions);
        
        if (allTransactions.length === 0) {
          console.log("[TransactionManagement] No transactions found. This could mean:");
          console.log("1. No transactions have been created yet");
          console.log("2. Transactions are stored in a different location");
          console.log("3. There was an error fetching (check console for details)");
        }
      } catch (error) {
        console.error("[TransactionManagement] Error fetching transactions:", error);
        setError(`Failed to fetch transactions: ${error.message}`);
      } finally {
        setLoadingTransactions(false);
      }
    };

    fetchAllTransactions();
  }, [isAuthenticated, user]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.userEmail?.toLowerCase().includes(searchLower) ||
          tx.userName?.toLowerCase().includes(searchLower) ||
          tx.type?.toLowerCase().includes(searchLower) ||
          tx.description?.toLowerCase().includes(searchLower) ||
          tx.transactionNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortField) {
        case "date":
          // Prefer createdAt for accurate sorting
          aValue = a.createdAt 
            ? (a.createdAt.toDate ? a.createdAt.toDate().getTime() : (a.createdAt.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime()))
            : (a.date ? new Date(a.date).getTime() : 0);
          bValue = b.createdAt 
            ? (b.createdAt.toDate ? b.createdAt.toDate().getTime() : (b.createdAt.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime()))
            : (b.date ? new Date(b.date).getTime() : 0);
          break;
        case "email":
          aValue = (a.userEmail || "").toLowerCase();
          bValue = (b.userEmail || "").toLowerCase();
          break;
        case "type":
          aValue = (a.type || "").toLowerCase();
          bValue = (b.type || "").toLowerCase();
          break;
        case "amount":
          aValue = a.amount || 0;
          bValue = b.amount || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortAsc ? -1 : 1;
      if (aValue > bValue) return sortAsc ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchTerm, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedTransactions.length / TRANSACTIONS_PER_PAGE
  );
  const startIndex = (currentPage - 1) * TRANSACTIONS_PER_PAGE;
  const endIndex = startIndex + TRANSACTIONS_PER_PAGE;
  const paginatedTransactions = filteredAndSortedTransactions.slice(
    startIndex,
    endIndex
  );

  const formatTransactionAmount = (transaction) => {
    if (transaction.type === "donation" || transaction.type === "prize_win") {
      return formatCurrency(transaction.amount || 0);
    } else if (transaction.type === "coin_reward" || transaction.type === "raffle_entry") {
      return `${transaction.amount || 0} coins`;
    }
    return formatCurrency(transaction.amount || 0);
  };

  const formatDateTime = (transaction) => {
    try {
      // Prefer createdAt (serverTimestamp) for accurate timestamp
      let dateValue = null;
      
      if (transaction.createdAt) {
        // Handle Firestore Timestamp
        if (transaction.createdAt.toDate) {
          dateValue = transaction.createdAt.toDate();
        } else if (transaction.createdAt.seconds) {
          dateValue = new Date(transaction.createdAt.seconds * 1000);
        } else {
          dateValue = new Date(transaction.createdAt);
        }
      } else if (transaction.date) {
        // For date-only strings (YYYY-MM-DD), create a date at the start of that day in local timezone
        // This prevents timezone conversion issues
        const dateStr = transaction.date;
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // It's a date-only string, parse it as local date (not UTC)
          const [year, month, day] = dateStr.split('-').map(Number);
          dateValue = new Date(year, month - 1, day, 12, 0, 0); // Use noon local time to avoid timezone issues
        } else {
          // Try to parse as ISO string or other format
          dateValue = new Date(transaction.date);
        }
      }
      
      if (!dateValue || isNaN(dateValue.getTime())) {
        return "N/A";
      }
      
      return dateValue.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  const getTransactionTypeLabel = (type) => {
    const labels = {
      donation: "Donation",
      coin_reward: "Coin Reward",
      raffle_entry: "Raffle Entry",
      prize_win: "Prize Win",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl font-bold text-deep-red-800 mb-4">
          Please log in to access this page.
        </div>
        <Link to="/login?redirect=/admin/transactions" className="text-blue-600 underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-bold text-xl">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 max-w-7xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-deep-red-600 hover:text-deep-red-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Link>

      <h1 className="text-3xl font-bold mb-8 text-deep-red-800">
        Transaction Management
      </h1>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by email, name, type, or transaction number..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loadingTransactions ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading transactions...</p>
        </div>
      ) : (
        <>
          {/* Transactions Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center gap-2">
                        Date & Time
                        {sortField === "date" &&
                          (sortAsc ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("email")}
                    >
                      <div className="flex items-center gap-2">
                        Donor Email
                        {sortField === "email" &&
                          (sortAsc ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("type")}
                    >
                      <div className="flex items-center gap-2">
                        Transaction Type
                        {sortField === "type" &&
                          (sortAsc ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("amount")}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        {sortField === "amount" &&
                          (sortAsc ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          ))}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedTransactions.length > 0 ? (
                    paginatedTransactions.map((transaction) => (
                      <tr
                        key={`${transaction.userId}-${transaction.id}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDateTime(transaction)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {transaction.userEmail || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.type === "donation"
                                ? "bg-green-100 text-green-800"
                                : transaction.type === "coin_reward"
                                ? "bg-purple-100 text-purple-800"
                                : transaction.type === "prize_win"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {getTransactionTypeLabel(transaction.type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatTransactionAmount(transaction)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {transaction.description || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              transaction.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {transaction.status || "pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <div className="space-y-1">
                            {transaction.transactionNumber && (
                              <div>TX: {transaction.transactionNumber}</div>
                            )}
                            {transaction.nonprofitName && (
                              <div className="text-xs">
                                {transaction.nonprofitName}
                              </div>
                            )}
                            {/* For Donation transactions, check for on-chain proof */}
                            {transaction.type === "donation" && transaction.onChainProofUrl && (
                              <div className="text-xs text-blue-600">
                                <a
                                  href={transaction.onChainProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline inline-flex items-center gap-1"
                                  title="View donation proof on Solana Explorer"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Proof-of-Donation
                                </a>
                              </div>
                            )}
                            {/* For Prize Win transactions, check raffleHistory for verification link */}
                            {transaction.type === "prize_win" && transaction.coinNumber && raffleHistoryMap[transaction.coinNumber]?.onChainSignature && (
                              <div className="text-xs text-blue-600">
                                <a
                                  href={raffleHistoryMap[transaction.coinNumber].onChainUrl || `https://solscan.io/tx/${raffleHistoryMap[transaction.coinNumber].onChainSignature}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View on Solscan
                                </a>
                              </div>
                            )}
                            {/* For Coin Reward transactions, use stored signature */}
                            {transaction.type === "coin_reward" && transaction.solanaTransactionSignature && (
                              <div className="text-xs text-blue-600">
                                <a
                                  href={`https://solscan.io/tx/${transaction.solanaTransactionSignature}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View on Solscan
                                </a>
                              </div>
                            )}
                            {/* Fallback: if Prize Win has stored signature, use it */}
                            {transaction.type === "prize_win" && transaction.solanaTransactionSignature && !raffleHistoryMap[transaction.coinNumber]?.onChainSignature && (
                              <div className="text-xs text-blue-600">
                                <a
                                  href={`https://solscan.io/tx/${transaction.solanaTransactionSignature}?cluster=devnet`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline inline-flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View on Solscan
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {searchTerm
                          ? "No transactions found matching your search."
                          : "No transactions found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(endIndex, filteredAndSortedTransactions.length)} of{" "}
                  {filteredAndSortedTransactions.length} transactions
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-deep-red-800 mb-4">
              Transaction Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Total Transactions</div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedTransactions.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Donations</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(
                    filteredAndSortedTransactions
                      .filter((tx) => tx.type === "donation")
                      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Coins Issued</div>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredAndSortedTransactions
                    .filter((tx) => tx.type === "coin_reward")
                    .reduce((sum, tx) => sum + (tx.amount || 0), 0)
                    .toLocaleString()}{" "}
                  coins
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Prize Wins</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(
                    filteredAndSortedTransactions
                      .filter((tx) => tx.type === "prize_win")
                      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

