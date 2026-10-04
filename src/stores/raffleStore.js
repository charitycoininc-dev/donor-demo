import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config/firebase.js";

const useRaffleStore = create(
  devtools(
    (set, get) => ({
      // State
      currentRaffle: {
        id: "current",
        name: "Monthly Community Support Raffle",
        prizePool: 0,
        autoDrawAmount: 100000, // Default trigger amount
        endDate: "2024-12-31",
        participants: 0,
        description:
          "Support our community while having a chance to win amazing prizes!",
        lastUpdated: new Date().toISOString(),
        globalCoinCounter: 1,
      },
      loading: false,
      error: null,
      raffleListener: null, // Store the unsubscribe function

      // Actions
      setCurrentRaffle: (raffle) =>
        set({ currentRaffle: raffle }, false, "setCurrentRaffle"),

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      // Update raffle (merge with existing data)
      updateRaffle: (updates) =>
        set(
          (state) => ({
            currentRaffle: { ...state.currentRaffle, ...updates },
          }),
          false,
          "updateRaffle",
        ),

      // Fetch current raffle from Firestore
      fetchCurrentRaffle: async () => {
        try {
          set({ loading: true, error: null });

          const raffleRef = doc(db, "raffles", "current");
          const raffleSnap = await getDoc(raffleRef);

          if (raffleSnap.exists()) {
            const raffleData = raffleSnap.data();
            set({
              currentRaffle: { id: "current", ...raffleData },
              loading: false,
            });
            return raffleData;
          } else {
            // Create default raffle if it doesn't exist
            const defaultRaffle = get().currentRaffle;
            set({ loading: false });
            return defaultRaffle;
          }
        } catch (error) {
          console.error("Error fetching current raffle:", error);
          set({
            error: error.message,
            loading: false,
          });
          throw error;
        }
      },

      // Start listening to raffle changes
      startRaffleListener: () => {
        const state = get();

        // Clean up existing listener
        if (state.raffleListener) {
          state.raffleListener();
        }

        try {
          const raffleRef = doc(db, "raffles", "current");
          const unsubscribe = onSnapshot(
            raffleRef,
            (doc) => {
              if (doc.exists()) {
                const raffleData = doc.data();
                set({
                  currentRaffle: { id: "current", ...raffleData },
                  error: null,
                });
              }
            },
            (error) => {
              console.error("Error listening to raffle doc:", error);
              set({ error: error.message });
            },
          );

          set({ raffleListener: unsubscribe });
        } catch (error) {
          console.error("Error starting raffle listener:", error);
          set({ error: error.message });
        }
      },

      // Stop listening to raffle changes
      stopRaffleListener: () => {
        const state = get();
        if (state.raffleListener) {
          state.raffleListener();
          set({ raffleListener: null });
        }
      },

      // Enter raffle (for future use)
      enterRaffle: async (userId, coinNumbers, cost = 0) => {
        try {
          const state = get();

          // Update raffle stats
          const newPrizePool = state.currentRaffle.prizePool + cost * 0.5;
          const newParticipants = state.currentRaffle.participants + 1;

          const raffleRef = doc(db, "raffles", "current");
          await updateDoc(raffleRef, {
            prizePool: newPrizePool,
            participants: newParticipants,
            lastUpdated: serverTimestamp(),
          });

          // Update local state
          set((state) => ({
            currentRaffle: {
              ...state.currentRaffle,
              prizePool: newPrizePool,
              participants: newParticipants,
            },
          }));

          return {
            success: true,
            prizePool: newPrizePool,
            participants: newParticipants,
          };
        } catch (error) {
          console.error("Error entering raffle:", error);
          set({ error: error.message });
          throw error;
        }
      },

      // Perform raffle drawing (admin function)
      performRaffleDrawing: async (eligibleCoins) => {
        try {
          if (!eligibleCoins || eligibleCoins.length === 0) {
            throw new Error("No eligible coins for raffle drawing");
          }

          // Select random winning coin
          const randomIndex = Math.floor(Math.random() * eligibleCoins.length);
          const winningCoinNumber = eligibleCoins[randomIndex];

          const state = get();
          const prizeAmount = state.currentRaffle.prizePool;

          console.log(
            `Raffle Drawing: Coin #${winningCoinNumber} is the winner!`,
          );

          // Update raffle with winner info
          const raffleRef = doc(db, "raffles", "current");
          await updateDoc(raffleRef, {
            lastWinner: {
              coinNumber: winningCoinNumber,
              prizeAmount: prizeAmount,
              drawDate: new Date().toISOString(),
            },
            lastDrawing: new Date().toISOString(),
            lastUpdated: serverTimestamp(),
          });

          // Update local state
          set((state) => ({
            currentRaffle: {
              ...state.currentRaffle,
              lastWinner: {
                coinNumber: winningCoinNumber,
                prizeAmount: prizeAmount,
                drawDate: new Date().toISOString(),
              },
              lastDrawing: new Date().toISOString(),
            },
          }));

          return {
            winningCoinNumber,
            prizeAmount,
            drawDate: new Date().toISOString(),
          };
        } catch (error) {
          console.error("Error performing raffle drawing:", error);
          set({ error: error.message });
          throw error;
        }
      },

      // Get raffle statistics
      getRaffleStats: () => {
        const state = get();
        return {
          prizePool: state.currentRaffle.prizePool || 0,
          participants: state.currentRaffle.participants || 0,
          endDate: state.currentRaffle.endDate,
          lastWinner: state.currentRaffle.lastWinner,
          globalCoinCounter: state.currentRaffle.globalCoinCounter || 1,
        };
      },

      // Reset raffle (admin function)
      resetRaffle: async (newRaffleData = {}) => {
        try {
          const defaultRaffle = {
            name: "Monthly Community Support Raffle",
            prizePool: 0,
            autoDrawAmount: 100000, // Default trigger amount
            participants: 0,
            description:
              "Support our community while having a chance to win amazing prizes!",
            lastUpdated: new Date().toISOString(),
            ...newRaffleData,
          };

          const raffleRef = doc(db, "raffles", "current");
          await updateDoc(raffleRef, {
            ...defaultRaffle,
            lastUpdated: serverTimestamp(),
          });

          // Update local state
          set({
            currentRaffle: { id: "current", ...defaultRaffle },
          });

          return defaultRaffle;
        } catch (error) {
          console.error("Error resetting raffle:", error);
          set({ error: error.message });
          throw error;
        }
      },

      // Clear raffle state (for logout)
      clearRaffle: () => {
        const state = get();
        if (state.raffleListener) {
          state.raffleListener();
        }

        set(
          {
            currentRaffle: {
              id: "current",
              name: "Monthly Community Support Raffle",
              prizePool: 0,
              autoDrawAmount: 100000, // Default trigger amount
              endDate: "2024-12-31",
              participants: 0,
              description:
                "Support our community while having a chance to win amazing prizes!",
              lastUpdated: new Date().toISOString(),
              globalCoinCounter: 1,
            },
            loading: false,
            error: null,
            raffleListener: null,
          },
          false,
          "clearRaffle",
        );
      },
    }),
    {
      name: "raffle-store", // DevTools name
    },
  ),
);

export default useRaffleStore;
