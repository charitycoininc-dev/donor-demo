import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./useAuth";
import useTransactionStore from "../transactionStore";

/**
 * Custom hook to detect and manage active prize wins for the current user
 * 
 * @returns {Object} { activePrizeWin, isDismissing, dismissPrizeWin, isLoading }
 */
export function usePrizeWin() {
  const { user, updateUser } = useAuth();
  const { transactions, fetchTransactions, refreshTransactions, loading } = useTransactionStore();
  const [activePrizeWin, setActivePrizeWin] = useState(null);
  const [isDismissing, setIsDismissing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Track the last dismissed prize win ID to prevent showing it again
  const lastDismissedRef = useRef(null);

  // Fetch transactions when user is authenticated
  useEffect(() => {
    if (user?.id || user?.uid) {
      const userId = user.id || user.uid;
      setIsLoading(true);
      
      // Fetch transactions in the background
      const fetchInBackground = async () => {
        try {
          console.log("[usePrizeWin] Fetching transactions for user:", userId);
          const fetchedTransactions = await fetchTransactions(userId);
          console.log("[usePrizeWin] Fetched transactions:", fetchedTransactions?.length || 0, "transactions");
          
          // Log all prize_win transactions for debugging
          const prizeWins = fetchedTransactions?.filter((tx) => tx.type === "prize_win") || [];
          if (prizeWins.length > 0) {
            console.log("[usePrizeWin] Prize win transactions found:", prizeWins.map(tx => ({
              id: tx.id,
              status: tx.status,
              coinNumber: tx.coinNumber,
              amount: tx.amount,
              date: tx.date,
            })));
          } else {
            console.log("[usePrizeWin] No prize win transactions found");
          }
        } catch (error) {
          console.error("[usePrizeWin] Error fetching transactions:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchInBackground();
      
      // Set up interval to refresh transactions every 60 seconds
      // Only refresh when page is visible to reduce Firebase reads
      // This ensures new prize wins are detected without excessive polling
      const refreshInterval = setInterval(() => {
        if ((user?.id || user?.uid) && document.visibilityState === 'visible') {
          const userId = user.id || user.uid;
          console.log("[usePrizeWin] Refreshing transactions (interval)");
          refreshTransactions(userId).catch((error) => {
            console.error("[usePrizeWin] Error refreshing transactions:", error);
          });
        }
      }, 60000); // Refresh every 60 seconds (reduced from 10 seconds to save Firebase reads)
      
      return () => {
        clearInterval(refreshInterval);
      };
    } else {
      // No user - clear prize win
      setActivePrizeWin(null);
      setIsLoading(false);
    }
  }, [user?.id, user?.uid, fetchTransactions]);

  // Find active (non-dismissed, pending or finalized) prize win
  // IMPORTANT: This banner persists until explicitly dismissed by the user
  useEffect(() => {
    // Only clear active prize win if user is logged out
    if (!user) {
      setActivePrizeWin(null);
      lastDismissedRef.current = null;
      return;
    }

    const dismissed =
      Array.isArray(user?.dismissedPrizeWins) 
        ? new Set(user.dismissedPrizeWins) 
        : new Set();
    
    // Use a function to get current active prize win to avoid stale closures
    setActivePrizeWin((currentActive) => {
      // If we already have an active prize win that hasn't been dismissed, keep it
      if (currentActive) {
        // If it was dismissed, clear it
        if (dismissed.has(currentActive.id)) {
          console.log("[usePrizeWin] Active prize win was dismissed, clearing:", currentActive.id);
          lastDismissedRef.current = currentActive.id;
          return null;
        }
        
        // If transactions are available, verify the prize win still exists and update with latest data
        if (transactions && transactions.length > 0) {
          const currentPrizeWin = transactions.find((tx) => tx.id === currentActive.id);
          if (currentPrizeWin && 
              currentPrizeWin.type === "prize_win" && 
              (currentPrizeWin.status === "pending" || currentPrizeWin.status === "finalized")) {
            // Prize win is still valid, update with latest data but keep showing it
            if (currentPrizeWin.id !== currentActive.id || 
                currentPrizeWin.status !== currentActive.status ||
                currentPrizeWin.amount !== currentActive.amount) {
              console.log("[usePrizeWin] Updated existing active prize win with latest data:", {
                id: currentPrizeWin.id,
                coinNumber: currentPrizeWin.coinNumber,
                status: currentPrizeWin.status,
              });
              return currentPrizeWin;
            }
            // Prize win is still valid and unchanged, keep it
            return currentActive;
          }
        } else {
          // Transactions not loaded yet, but we have an active prize win
          // Keep it until transactions load or user dismisses it
          console.log("[usePrizeWin] Transactions not loaded yet, keeping existing active prize win");
          return currentActive;
        }
      }
      
      // Only look for new prize wins if we don't have an active one or it was invalidated
      if (!transactions || transactions.length === 0) {
        // Transactions not available yet, don't clear existing active prize win
        return currentActive;
      }
      
      // Show prize wins that are either "pending" or "finalized"
      // This allows the banner to show immediately when a donor wins, not just after admin approval
      const activePrizeWins = transactions
        .filter((tx) => 
          tx.type === "prize_win" && 
          (tx.status === "pending" || tx.status === "finalized") &&
          !dismissed.has(tx.id) &&
          tx.id !== lastDismissedRef.current // Don't show recently dismissed prize wins
        )
        .sort((a, b) => {
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          return dateB - dateA; // Most recent first
        });
      
      // Find the most recent non-dismissed prize win
      const nextPrizeWin = activePrizeWins[0]; // Most recent one
      
      // Only set if we found a new prize win
      if (nextPrizeWin) {
        console.log("[usePrizeWin] New active prize win found:", {
          id: nextPrizeWin.id,
          coinNumber: nextPrizeWin.coinNumber,
          amount: nextPrizeWin.amount,
          status: nextPrizeWin.status,
          date: nextPrizeWin.date,
        });
        return nextPrizeWin;
      }
      
      // No active prize wins found
      // Only log in development to reduce console noise
      if (!currentActive && import.meta.env.DEV) {
        const allPrizeWins = transactions.filter((tx) => tx.type === "prize_win");
        if (allPrizeWins.length > 0) {
          console.debug("[usePrizeWin] Prize wins found but not active (dismissed or wrong status):", allPrizeWins.map(tx => ({ id: tx.id, status: tx.status })));
        }
      }
      
      // Return current active prize win (or null if none)
      return currentActive;
    });
  }, [transactions, user?.dismissedPrizeWins, user]);

  /**
   * Dismiss the current prize win banner
   * This is the ONLY way the banner should be hidden - it persists until explicitly dismissed
   */
  const dismissPrizeWin = async () => {
    // Get current active prize win from state using a ref to avoid stale closures
    const currentActive = activePrizeWin;
    
    if (!user || !currentActive) {
      console.warn("[usePrizeWin] Cannot dismiss: no user or active prize win");
      return;
    }
    
    setIsDismissing(true);
    const prizeWinId = currentActive.id;
    const userId = user.id || user.uid;
    
    try {
      if (!userId) {
        throw new Error("Missing user id");
      }

      console.log("[usePrizeWin] Dismissing prize win:", prizeWinId);

      // Update Firestore first
      await updateDoc(doc(db, "users", userId), {
        dismissedPrizeWins: arrayUnion(prizeWinId),
      });

      // Update local user state
      updateUser({
        dismissedPrizeWins: [
          ...(user.dismissedPrizeWins || []),
          prizeWinId,
        ],
      });

      // Track dismissed prize win to prevent it from showing again
      lastDismissedRef.current = prizeWinId;
      
      // Clear active prize win ONLY after successful dismissal
      setActivePrizeWin(null);
      
      console.log("[usePrizeWin] Prize win dismissed successfully:", prizeWinId);
    } catch (error) {
      console.error("[usePrizeWin] Failed to dismiss prize win:", error);
      // Don't clear activePrizeWin on error - let user try again
      // The banner will remain visible until dismissal succeeds
    } finally {
      setIsDismissing(false);
    }
  };

  return {
    activePrizeWin,
    isDismissing,
    dismissPrizeWin,
    isLoading,
  };
}

