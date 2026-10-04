import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
  enableNetwork,
  disableNetwork,
} from "firebase/firestore";
import { db } from "./config/firebase.js";

// Retry configuration
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds
const REQUEST_TIMEOUT = 15000; // 15 seconds

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if Firebase is available with retry
const isFirebaseAvailable = async (retryCount = 0) => {
  // Check if db exists and has the necessary methods
  // For Firebase v12, we need to check different properties
  const isAvailable = db && 
         (typeof db.collection === 'function' || 
          typeof db.doc === 'function' ||
          (db._delegate && db._delegate._databaseId) ||
          (db._app && db._app.name) ||
          (db.type === 'firestore'));
  
  console.log('🔍 Firebase availability check:', {
    dbExists: !!db,
    hasCollection: typeof db?.collection === 'function',
    hasDoc: typeof db?.doc === 'function',
    hasDelegate: !!db?._delegate,
    hasDatabaseId: !!db?._delegate?._databaseId,
    hasApp: !!db?._app,
    appName: db?._app?.name,
    dbType: db?.type,
    isAvailable,
    retryCount
  });
  
  // If not available and we haven't retried too many times, wait and retry
  if (!isAvailable && retryCount < 3) {
    console.log(`⏳ Firebase not ready, retrying in 500ms... (attempt ${retryCount + 1})`);
    await delay(500);
    return isFirebaseAvailable(retryCount + 1);
  }
  
  // If we think it's available, do a simple test
  if (isAvailable && db) {
    try {
      // Try to access a simple property to verify it's working
      const testCollection = collection(db, 'test');
      console.log('✅ Firestore test collection created successfully');
      return true;
    } catch (testError) {
      console.warn('⚠️ Firestore test failed:', testError);
      if (retryCount < 3) {
        console.log(`⏳ Firestore test failed, retrying in 500ms... (attempt ${retryCount + 1})`);
        await delay(500);
        return isFirebaseAvailable(retryCount + 1);
      }
      return false;
    }
  }
  
  return isAvailable;
};

// Helper function to retry Firebase operations
const retryOperation = async (operation, attempts = RETRY_ATTEMPTS) => {
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed:`, error);
      
      // If this is the last attempt, throw the error
      if (i === attempts - 1) {
        throw error;
      }
      
      // Check if it's a network-related error
      if (error.code === 'unavailable' || error.code === 'deadline-exceeded' || 
          error.message?.includes('timeout') || error.message?.includes('network')) {
        
        // Try to re-enable network
        if (await isFirebaseAvailable()) { // Use await here
          try {
            await enableNetwork(db);
            console.log('Re-enabled Firebase network connection');
          } catch (networkError) {
            console.warn('Failed to re-enable network:', networkError);
          }
        }
        
        // Wait before retrying
        await delay(RETRY_DELAY * (i + 1)); // Exponential backoff
      } else {
        // For non-network errors, don't retry
        throw error;
      }
    }
  }
};

const useTransactionStore = create(
  devtools(
    (set, get) => ({
      // State
      transactions: [],
      loading: false,
      error: null,
      lastFetch: 0,
      cacheDuration: 300000, // 5 minutes cache (increased from 1 minute to reduce Firebase reads)
      isOnline: true,

      // Actions
      setTransactions: (transactions) =>
        set({ transactions }, false, "setTransactions"),

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      setOnlineStatus: (isOnline) => set({ isOnline }, false, "setOnlineStatus"),

      // Add transaction to local state
      addTransaction: (transaction) =>
        set(
          (state) => ({
            transactions: [transaction, ...state.transactions],
          }),
          false,
          "addTransaction",
        ),

      // Fetch transactions from Firestore with improved error handling
      fetchTransactions: async (userId) => {
        const state = get();
        const now = Date.now();

        // Check cache
        if (
          now - state.lastFetch < state.cacheDuration &&
          state.transactions.length > 0
        ) {
          return state.transactions;
        }

        // Check if Firebase is available
        if (!await isFirebaseAvailable()) { // Use await here
          console.error('Firebase is not available. DB object:', db);
          console.error('DB collection method:', typeof db?.collection);
          console.error('DB doc method:', typeof db?.doc);
          console.error('DB delegate:', db?._delegate);
          const error = new Error("Firebase is not available");
          set({ error: error.message, loading: false });
          throw error;
        }

        try {
          set({ loading: true, error: null });

          const fetchOperation = async () => {
            try {
              // CRITICAL: Fetch prize_win transactions separately to ensure they're always included
              // Prize wins are rare but important, and might be older than the 50 most recent transactions
              let prizeWinTransactions = [];
              try {
                const prizeWinQuery = query(
                  collection(db, "users", userId, "transactions"),
                  where("type", "==", "prize_win"),
                  orderBy("createdAt", "desc"),
                  // No limit - prize wins are rare, we want all of them
                );
                const prizeWinSnap = await getDocs(prizeWinQuery);
                prizeWinTransactions = prizeWinSnap.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                console.log(`[TransactionStore] Fetched ${prizeWinTransactions.length} prize_win transactions separately`);
              } catch (prizeWinError) {
                // If prize_win query fails (e.g., no index), try without orderBy
                console.warn("[TransactionStore] Prize win query failed, trying without orderBy:", prizeWinError.message);
                try {
                  const prizeWinQueryNoOrder = query(
                    collection(db, "users", userId, "transactions"),
                    where("type", "==", "prize_win"),
                  );
                  const prizeWinSnap = await getDocs(prizeWinQueryNoOrder);
                  prizeWinTransactions = prizeWinSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                } catch (prizeWinError2) {
                  console.warn("[TransactionStore] Prize win query failed completely, continuing without prize wins:", prizeWinError2.message);
                  prizeWinTransactions = [];
                }
              }
              
              // Try to fetch transactions with orderBy on createdAt (more reliable than date)
              // Prize win transactions might have createdAt but not date, so prefer createdAt
              // If this fails, try orderBy on date, then try without orderBy
              let txQuery = null;
              let txSnap = null;
              let recentTransactions = [];
              
              // Add timeout to prevent hanging
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Request timeout")), REQUEST_TIMEOUT);
              });

              // Strategy 1: Try orderBy createdAt first (most accurate for server timestamps)
              // Limit to 50 most recent transactions to reduce Firebase reads
              // Prize win transactions should be recent, so this limit is reasonable
              try {
                txQuery = query(
                  collection(db, "users", userId, "transactions"),
                  orderBy("createdAt", "desc"),
                  limit(50), // Limit to 50 most recent to reduce Firebase reads
                );
                
                txSnap = await Promise.race([
                  getDocs(txQuery),
                  timeoutPromise
                ]);

                if (!txSnap.empty) {
                  recentTransactions = txSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                  
                  console.log("[TransactionStore] Fetched transactions with createdAt orderBy:", recentTransactions.length, "total");
                  
                  // Combine recent transactions with prize wins, removing duplicates
                  const allTransactions = [
                    ...recentTransactions,
                    ...prizeWinTransactions.filter(tx => 
                      !recentTransactions.some(rt => rt.id === tx.id)
                    )
                  ];
                  
                  // Log prize_win transactions for debugging
                  const prizeWins = allTransactions.filter((tx) => tx.type === "prize_win");
                  if (prizeWins.length > 0) {
                    console.log("[TransactionStore] Total prize_win transactions (combined):", prizeWins.length, prizeWins.map(tx => ({
                      id: tx.id,
                      status: tx.status,
                      coinNumber: tx.coinNumber,
                      date: tx.date,
                      createdAt: tx.createdAt ? (tx.createdAt.toDate ? tx.createdAt.toDate().toISOString() : tx.createdAt) : null,
                    })));
                  } else {
                    console.log("[TransactionStore] No prize_win transactions found (combined)");
                    console.log("[TransactionStore] Transaction types:", [...new Set(allTransactions.map(tx => tx.type))]);
                  }
                  
                  return allTransactions;
                }
              } catch (createdAtError) {
                // If createdAt orderBy fails (e.g., no index), try date orderBy
                if (createdAtError.code === 'failed-precondition' || 
                    createdAtError.message?.includes('index') ||
                    createdAtError.message?.includes('requires an index')) {
                  console.warn("[TransactionStore] createdAt orderBy failed (missing index), trying date orderBy:", createdAtError.message);
                } else {
                  console.warn("[TransactionStore] createdAt orderBy failed, trying date orderBy:", createdAtError.message);
                }
                
                try {
                  txQuery = query(
                    collection(db, "users", userId, "transactions"),
                    orderBy("date", "desc"),
                    limit(50), // Limit to 50 most recent to reduce Firebase reads
                  );
                  
                  txSnap = await Promise.race([
                    getDocs(txQuery),
                    timeoutPromise
                  ]);

                  if (!txSnap.empty) {
                    recentTransactions = txSnap.docs.map((doc) => ({
                      id: doc.id,
                      ...doc.data(),
                    }));
                    
                    console.log("[TransactionStore] Fetched transactions with date orderBy:", recentTransactions.length, "total");
                    
                    // Combine recent transactions with prize wins, removing duplicates
                    const allTransactions = [
                      ...recentTransactions,
                      ...prizeWinTransactions.filter(tx => 
                        !recentTransactions.some(rt => rt.id === tx.id)
                      )
                    ];
                    
                    // Log prize_win transactions for debugging
                    const prizeWins = allTransactions.filter((tx) => tx.type === "prize_win");
                    if (prizeWins.length > 0) {
                      console.log("[TransactionStore] Total prize_win transactions (combined):", prizeWins.length, prizeWins.map(tx => ({
                        id: tx.id,
                        status: tx.status,
                        coinNumber: tx.coinNumber,
                        date: tx.date,
                      })));
                    } else {
                      console.log("[TransactionStore] No prize_win transactions found (combined)");
                      console.log("[TransactionStore] Transaction types:", [...new Set(allTransactions.map(tx => tx.type))]);
                    }
                    
                    return allTransactions;
                  }
                } catch (dateError) {
                  // If date orderBy also fails (e.g., no index), fetch without orderBy
                  if (dateError.code === 'failed-precondition' || 
                      dateError.message?.includes('index') ||
                      dateError.message?.includes('requires an index')) {
                    console.warn("[TransactionStore] date orderBy failed (missing index), fetching ALL transactions without orderBy:", dateError.message);
                  } else {
                    console.warn("[TransactionStore] date orderBy failed, fetching ALL transactions without orderBy:", dateError.message);
                  }
                  
                  // Fallback: fetch transactions without orderBy but with limit
                  // Limit to reduce Firebase reads while still getting recent transactions
                  txQuery = query(
                    collection(db, "users", userId, "transactions"),
                    limit(50), // Limit to 50 to reduce Firebase reads
                  );
                  
                  txSnap = await Promise.race([
                    getDocs(txQuery),
                    timeoutPromise
                  ]);

                  if (txSnap.empty) {
                    console.log("[TransactionStore] No transactions found for user");
                    return [];
                  }

                  // Sort manually by createdAt or date, preferring createdAt
                  recentTransactions = txSnap.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                  }));

                  console.log("[TransactionStore] Fetched ALL transactions (no orderBy):", recentTransactions.length, "total");
                  
                  // Combine recent transactions with prize wins, removing duplicates
                  const allTransactions = [
                    ...recentTransactions,
                    ...prizeWinTransactions.filter(tx => 
                      !recentTransactions.some(rt => rt.id === tx.id)
                    )
                  ];
                  
                  // Log prize_win transactions for debugging
                  const prizeWins = allTransactions.filter((tx) => tx.type === "prize_win");
                  if (prizeWins.length > 0) {
                    console.log("[TransactionStore] Total prize_win transactions (combined):", prizeWins.length, prizeWins.map(tx => ({
                      id: tx.id,
                      status: tx.status,
                      coinNumber: tx.coinNumber,
                      date: tx.date,
                      createdAt: tx.createdAt,
                    })));
                  } else {
                    console.log("[TransactionStore] No prize_win transactions found (combined)");
                    console.log("[TransactionStore] Transaction types found:", [...new Set(allTransactions.map(tx => tx.type))]);
                  }

                  // Sort by createdAt (preferred) or date descending
                  return allTransactions.sort((a, b) => {
                    // Helper to get timestamp from createdAt or date
                    const getTimestamp = (tx) => {
                      // Prefer createdAt (serverTimestamp) as it's more accurate
                      if (tx.createdAt) {
                        if (tx.createdAt.toDate) {
                          return tx.createdAt.toDate().getTime();
                        } else if (tx.createdAt.seconds) {
                          return tx.createdAt.seconds * 1000;
                        } else if (typeof tx.createdAt === 'string' || typeof tx.createdAt === 'number') {
                          return new Date(tx.createdAt).getTime();
                        }
                      }
                      // Fallback to date field
                      if (tx.date) {
                        return new Date(tx.date).getTime();
                      }
                      return 0;
                    };
                    
                    const timeA = getTimestamp(a);
                    const timeB = getTimestamp(b);
                    return timeB - timeA; // Most recent first
                  });
                }
              }

              // If we got here, both orderBy attempts failed or returned empty
              // This shouldn't happen, but return empty array as fallback
              if (!txSnap || txSnap.empty) {
                console.log("[TransactionStore] No transactions found for user (all orderBy attempts failed or empty)");
                return [];
              }

              return [];
            } catch (queryError) {
              // Check if it's a permission error - return empty array
              if (queryError.code === 'permission-denied') {
                console.warn("[TransactionStore] Permission denied for transactions - user may not have transactions yet");
                return [];
              }
              
              // Check if collection doesn't exist - return empty array
              if (queryError.code === 'not-found') {
                console.log("[TransactionStore] Transactions collection not found - this is normal for new users");
                return [];
              }
              
              // Check if it's a timeout - return empty array so UI can render
              if (queryError.message?.includes('timeout') || queryError.message === 'Request timeout') {
                console.warn("[TransactionStore] Transaction fetch timed out - returning empty array");
                return [];
              }
              
              // For other errors, log and return empty array (don't block UI)
              console.warn("[TransactionStore] Error fetching transactions:", queryError.message || queryError);
              return [];
            }
          };

          // Don't use retryOperation - just try once to avoid delays
          // If it fails, return empty array so UI can render
          const transactions = await fetchOperation();

          set({
            transactions: transactions || [],
            loading: false,
            lastFetch: now,
            isOnline: true,
            error: null, // Clear any previous errors on success
          });

          return transactions || [];
        } catch (error) {
          console.error("Error fetching transactions:", error);
          
          // Always return empty array on error - don't block UI
          // This allows wallet to render even if transactions fail
          set({
            transactions: [],
            loading: false,
            isOnline: true,
            error: null, // Don't show error - transactions are optional
          });
          
          return [];
        }
      },

      // Create donation transaction with improved error handling
      createDonationTransaction: async (userId, donationData) => {
        if (!await isFirebaseAvailable()) { // Use await here
          const error = new Error("Firebase is not available");
          get().setError(error.message);
          throw error;
        }

        try {
          const donationTransaction = {
            id: Date.now().toString(),
            transactionNumber: donationData.transactionNumber,
            type: "donation",
            amount: donationData.amount,
            date: new Date().toISOString().split("T")[0],
            createdAt: serverTimestamp(),
            description: `Donation to ${donationData.nonprofitName || "Nonprofit"}`,
            status: "pending",
            donationId: donationData.donationId,
            nonprofitId: donationData.nonprofitId,
            nonprofitName: donationData.nonprofitName || "Unknown Nonprofit",
          };

          // Add to Firestore with retry logic
          const addOperation = async () => {
            return await addDoc(
              collection(db, "users", userId, "transactions"),
              donationTransaction,
            );
          };

          await retryOperation(addOperation);

          // Add to local state
          get().addTransaction(donationTransaction);

          return donationTransaction;
        } catch (error) {
          console.error("Error creating donation transaction:", error);
          get().setError(error.message);
          throw error;
        }
      },

      // Create raffle entry transaction
      createRaffleTransaction: (raffleData) => {
        const raffleTransaction = {
          id: Date.now().toString(),
          type: "raffle_entry",
          amount: 0,
          date: new Date().toISOString().split("T")[0],
          description: `Entered ${raffleData.raffleName || "Monthly Raffle"}`,
          status: "completed",
          raffleId: raffleData.raffleId,
          coinNumbers: raffleData.coinNumbers || [],
        };

        get().addTransaction(raffleTransaction);
        return raffleTransaction;
      },

      // Create purchase transaction (for future use)
      createPurchaseTransaction: (purchaseData) => {
        const purchaseTransaction = {
          id: Date.now().toString(),
          type: "purchase",
          amount: purchaseData.amount,
          date: new Date().toISOString().split("T")[0],
          description: `Purchase: ${purchaseData.itemName}`,
          status: "completed",
          itemId: purchaseData.itemId,
          itemName: purchaseData.itemName,
        };

        get().addTransaction(purchaseTransaction);
        return purchaseTransaction;
      },

      // Filter transactions by type
      getTransactionsByType: (type) => {
        const state = get();
        return type === "all"
          ? state.transactions
          : state.transactions.filter((t) => t.type === type);
      },

      // Get transaction statistics
      getTransactionStats: () => {
        const state = get();
        const stats = {
          total: state.transactions.length,
          donations: 0,
          totalDonated: 0,
          pending: 0,
          completed: 0,
        };

        state.transactions.forEach((tx) => {
          if (tx.type === "donation") {
            stats.donations++;
            stats.totalDonated += tx.amount || 0;
          }
          if (tx.status === "pending") stats.pending++;
          if (tx.status === "completed") stats.completed++;
        });

        return stats;
      },

      // Clear transactions (for logout)
      clearTransactions: () =>
        set(
          {
            transactions: [],
            loading: false,
            error: null,
            lastFetch: 0,
            isOnline: true,
          },
          false,
          "clearTransactions",
        ),

      // Refresh transactions (force refetch)
      refreshTransactions: async (userId) => {
        set({ lastFetch: 0 }); // Reset cache
        return get().fetchTransactions(userId);
      },

      // Test Firebase connection
      testConnection: async () => {
        if (!await isFirebaseAvailable()) { // Use await here
          return false;
        }

        try {
          // Try to enable network
          await enableNetwork(db);
          set({ isOnline: true });
          return true;
        } catch (error) {
          console.error("Failed to test Firebase connection:", error);
          set({ isOnline: false });
          return false;
        }
      },
    }),
    {
      name: "transaction-store", // DevTools name
    },
  ),
);

export default useTransactionStore;
