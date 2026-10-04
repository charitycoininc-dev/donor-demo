import useRaffleStore from "../raffleStore";

// Custom hook for raffle management with common patterns
export const useRaffle = () => {
  const {
    currentRaffle,
    loading,
    error,
    setCurrentRaffle,
    setLoading,
    setError,
    updateRaffle,
    fetchCurrentRaffle,
    startRaffleListener,
    stopRaffleListener,
    enterRaffle,
    performRaffleDrawing,
    getRaffleStats,
    resetRaffle,
    clearRaffle,
  } = useRaffleStore();

  // Helper to check if raffle is active
  const isRaffleActive = () => {
    if (!currentRaffle.endDate) return true;
    const endDate = new Date(currentRaffle.endDate);
    const now = new Date();
    return now < endDate;
  };

  // Helper to get time remaining
  const getTimeRemaining = () => {
    if (!currentRaffle.endDate) return null;

    const endDate = new Date(currentRaffle.endDate);
    const now = new Date();
    const timeDiff = endDate.getTime() - now.getTime();

    if (timeDiff <= 0) return { expired: true };

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    return { days, hours, minutes, expired: false };
  };

  // Helper to format prize pool
  const getFormattedPrizePool = () => {
    const prizePool = currentRaffle.prizePool || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(prizePool);
  };

  // Helper to calculate user's winning chances
  const calculateWinningChances = (userCoinCount, totalCoins) => {
    if (!totalCoins || totalCoins === 0) return 0;
    return ((userCoinCount / totalCoins) * 100).toFixed(2);
  };

  // Helper to enter raffle with transaction creation
  const enterRaffleWithTransaction = async (userId, coinNumbers, cost = 0) => {
    try {
      setLoading(true);
      setError(null);

      // Enter the raffle
      const result = await enterRaffle(userId, coinNumbers, cost);

      // You could also create a raffle transaction here if needed
      // using the transaction store

      return result;
    } catch (error) {
      console.error("Error entering raffle with transaction:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Helper to initialize raffle for a user session
  const initializeRaffle = async () => {
    try {
      await fetchCurrentRaffle();
    } catch (error) {
      console.error("Error initializing raffle:", error);
      setError(error.message);
    }
  };

  return {
    // State
    currentRaffle,
    loading,
    error,

    // Core actions
    setCurrentRaffle,
    updateRaffle,
    fetchCurrentRaffle,
    enterRaffle,
    performRaffleDrawing,
    resetRaffle,
    clearRaffle,

    // Listener management
    startRaffleListener,
    stopRaffleListener,

    // Helper functions
    isRaffleActive,
    getTimeRemaining,
    getFormattedPrizePool,
    calculateWinningChances,
    getRaffleStats,
    enterRaffleWithTransaction,
    initializeRaffle,

    // State setters
    setLoading,
    setError,
  };
};

export default useRaffle;
