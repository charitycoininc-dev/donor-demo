import { useCallback } from "react";
import useTransactionStore from "../transactionStore";

// Custom hook for transaction management with common patterns
export const useTransactions = () => {
  const {
    transactions,
    loading,
    error,
    isOnline,
    setTransactions,
    setLoading,
    setError,
    setOnlineStatus,
    addTransaction,
    fetchTransactions,
    createDonationTransaction,
    createRaffleTransaction,
    createPurchaseTransaction,
    getTransactionsByType,
    getTransactionStats,
    clearTransactions,
    refreshTransactions,
    testConnection,
  } = useTransactionStore();

  // Paginated transactions
  const getPaginatedTransactions = useCallback((page = 1, perPage = 10, type = "all") => {
    const filteredTransactions = getTransactionsByType(type);
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;

    return {
      transactions: filteredTransactions.slice(startIndex, endIndex),
      totalCount: filteredTransactions.length,
      totalPages: Math.ceil(filteredTransactions.length / perPage),
      currentPage: page,
      hasNextPage: endIndex < filteredTransactions.length,
      hasPrevPage: page > 1,
    };
  }, [getTransactionsByType]);

  // Get recent transactions (last N transactions)
  const getRecentTransactions = (count = 5) => {
    return transactions.slice(0, count);
  };

  // Helper to create donation with transaction
  const processDonation = async (userId, donationData) => {
    try {
      setLoading(true);
      setError(null);

      const transaction = await createDonationTransaction(userId, donationData);

      return transaction;
    } catch (error) {
      console.error("Error processing donation:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper to initialize transactions for a user
  const initializeTransactions = useCallback(async (userId) => {
    if (!userId) {
      clearTransactions();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await fetchTransactions(userId);
    } catch (error) {
      console.error("Error initializing transactions:", error);
      setError(error.message);
      // Don't throw the error to prevent the app from freezing
    } finally {
      setLoading(false);
    }
  }, [fetchTransactions, setLoading, setError, clearTransactions]); // Include all dependencies

  // Memoize fetchTransactions to prevent infinite loops
  const memoizedFetchTransactions = useCallback(async (userId) => {
    return await fetchTransactions(userId);
  }, [fetchTransactions]);

  // Memoize testConnection to prevent infinite loops
  const memoizedTestConnection = useCallback(async () => {
    return await testConnection();
  }, [testConnection]);

  return {
    // State
    transactions,
    loading,
    error,
    isOnline,

    // Core actions
    setTransactions,
    addTransaction,
    fetchTransactions: memoizedFetchTransactions,
    clearTransactions,
    refreshTransactions,
    testConnection: memoizedTestConnection,

    // Transaction creators
    createDonationTransaction,
    createRaffleTransaction,
    createPurchaseTransaction,

    // Helper functions
    getTransactionsByType,
    getTransactionStats,
    getPaginatedTransactions,
    getRecentTransactions,
    processDonation,
    initializeTransactions,

    // State setters
    setLoading,
    setError,
    setOnlineStatus,
  };
};

export default useTransactions;
