import { useState, useEffect, useRef, useCallback } from "react";
import {
  Wallet as WalletIcon,
  TrendingUp,
  Gift,
  Coins,
  Calendar,
  Award,
  Star,
  Crown,
  Shield,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LogIn,
  AlertTriangle,
  Trash2,
  WifiOff,
  RefreshCw,
  User,
  Mail,
  Phone,
  MapPin,
  Settings,
  CreditCard,
  Trophy,
  ExternalLink,
} from "lucide-react";
import { useTransactions, useAuth, useRaffle } from "../stores";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../stores/config/firebase.js";
import {
  signOut,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  arrayUnion,
} from "firebase/firestore";
import {
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletMultiButton,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import ErrorBoundary from "../components/ErrorBoundary";
import { formatCurrency } from "../utils/currency";

function WalletInner() {
  // All hooks called at the top level - always in the same order
  const { user, updateUser } = useAuth();
  const { currentRaffle } = useRaffle();
  const { transactions, loading, error, getPaginatedTransactions, fetchTransactions, isOnline, testConnection, setTransactions } = useTransactions();
  const navigate = useNavigate();
  const walletHook = useWallet();
  
  // All state variables - always declared
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [street1, setStreet1] = useState("");
  const [street2, setStreet2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [zip, setZip] = useState("");
  const [solanaWallet, setSolanaWallet] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showProfileSaved, setShowProfileSaved] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");
  const [isReactivating, setIsReactivating] = useState(false);
  const [reactivateError, setReactivateError] = useState("");
  const [txCurrentPage, setTxCurrentPage] = useState(1);
  const [isRetrying, setIsRetrying] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [raffleHistoryMap, setRaffleHistoryMap] = useState({}); // Map coinNumber -> raffleHistory
  const transactionsPerPage = 10;

  // Track if we've initialized transactions for the current user
  const initializedUserIdRef = useRef(null);

  // Fetch transactions when user changes - but don't block rendering
  useEffect(() => {
    if (user?.id || user?.uid) {
      const userId = user.id || user.uid;
      const needsFetch = initializedUserIdRef.current !== userId;
      
      if (needsFetch) {
        initializedUserIdRef.current = userId;
        
        // Fetch transactions in the background - don't wait for it
        // This allows the wallet to render immediately
        const fetchInBackground = async () => {
          try {
            console.log("[Wallet] Fetching transactions for user:", userId);
            // Set loading to true before fetching
            // But don't block the UI - WalletWrapper will handle showing/hiding loading
            const fetchedTransactions = await fetchTransactions(userId);
            console.log("[Wallet] Transactions fetched successfully:", fetchedTransactions?.length || 0, "transactions");
            
            // Log prize_win transactions specifically
            if (fetchedTransactions && fetchedTransactions.length > 0) {
              const prizeWins = fetchedTransactions.filter((tx) => tx.type === "prize_win");
              if (prizeWins.length > 0) {
                console.log("[Wallet] Prize win transactions found after fetch:", prizeWins.map(tx => ({
                  id: tx.id,
                  status: tx.status,
                  coinNumber: tx.coinNumber,
                  amount: tx.amount,
                  date: tx.date,
                })));
              } else {
                console.log("[Wallet] No prize_win transactions found after fetch");
                console.log("[Wallet] Transaction types found:", [...new Set(fetchedTransactions.map(tx => tx.type))]);
              }
            }
          } catch (error) {
            console.error("[Wallet] Error fetching transactions:", error);
            // Error is already handled in the store
            // The store sets loading: false on error, so UI won't be blocked
          }
        };
        
        // Start fetching but don't await - let it happen in background
        fetchInBackground();
      }
    } else {
      // Reset when user is null
      initializedUserIdRef.current = null;
    }
  }, [user?.id, user?.uid, fetchTransactions]);

  // Fetch raffle history to link Prize Win transactions to verification links
  useEffect(() => {
    const fetchRaffleHistory = async () => {
      try {
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
        setRaffleHistoryMap(historyMap);
      } catch (error) {
        console.error("[Wallet] Error fetching raffle history:", error);
      }
    };

    fetchRaffleHistory();
  }, []);

  // Enhance donation transactions with proof URLs from donations collection
  // Use a ref to track if we've already enriched to avoid infinite loops
  const enrichmentDoneRef = useRef(new Set());
  
  useEffect(() => {
    const enrichDonationTransactions = async () => {
      if (!transactions || transactions.length === 0) return;
      
      // Find donation transactions that don't have onChainProofUrl but have donationId
      const donationsNeedingProof = transactions.filter(
        (tx) => tx.type === "donation" && tx.donationId && !tx.onChainProofUrl && !enrichmentDoneRef.current.has(tx.id)
      );
      
      if (donationsNeedingProof.length === 0) return;
      
      try {
        // Fetch all relevant donation documents
        const donationIds = [...new Set(donationsNeedingProof.map((tx) => tx.donationId))];
        const donationDocs = await Promise.all(
          donationIds.map(async (donationId) => {
            try {
              const donationDoc = await getDoc(doc(db, "donations", donationId));
              if (donationDoc.exists()) {
                return { id: donationId, ...donationDoc.data() };
              }
            } catch (err) {
              console.warn(`[Wallet] Could not fetch donation ${donationId}:`, err);
            }
            return null;
          })
        );
        
        // Create a map of donationId -> proof URL
        const donationProofMap = {};
        donationDocs.forEach((donation) => {
          if (donation && donation.onChainProofUrl) {
            donationProofMap[donation.id] = {
              onChainProofUrl: donation.onChainProofUrl,
              onChainProofSignature: donation.onChainProofSignature,
            };
          }
        });
        
        // If we found any proof URLs, update the transactions in the store
        if (Object.keys(donationProofMap).length > 0) {
          const updatedTransactions = transactions.map((tx) => {
            if (tx.type === "donation" && tx.donationId && donationProofMap[tx.donationId]) {
              enrichmentDoneRef.current.add(tx.id);
              return {
                ...tx,
                onChainProofUrl: donationProofMap[tx.donationId].onChainProofUrl,
                onChainProofSignature: donationProofMap[tx.donationId].onChainProofSignature,
              };
            }
            return tx;
          });
          
          // Update the transactions in the store
          setTransactions(updatedTransactions);
        } else {
          // Mark transactions as checked even if no proof found
          donationsNeedingProof.forEach((tx) => enrichmentDoneRef.current.add(tx.id));
        }
      } catch (error) {
        console.error("[Wallet] Error enriching donation transactions with proof URLs:", error);
      }
    };
    
    enrichDonationTransactions();
  }, [transactions, setTransactions]);


  // Track the last user data hash to detect when Firestore data actually loads
  const lastUserDataHashRef = useRef(null);
  
  // Create a hash of user profile data to detect when it actually loads
  const getUserDataHash = (user) => {
    if (!user) return null;
    // Create hash from user ID and all profile fields
    // This will change when Firestore data loads, even if user ID is the same
    return JSON.stringify({
      id: user.id || user.uid || '',
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      street1: user.street1 || '',
      street2: user.street2 || '',
      city: user.city || '',
      state: user.state || '',
      zip: user.zip || '',
      solanaWallet: user.solanaWallet || ''
    });
  };

  // Update local state when user data changes or loads from Firestore
  useEffect(() => {
    const currentDataHash = getUserDataHash(user);
    const dataHashChanged = currentDataHash !== lastUserDataHashRef.current;
    
    // Reset and clear fields when user logs out
    if (!user) {
      lastUserDataHashRef.current = null;
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setStreet1("");
      setStreet2("");
      setCity("");
      setStateField("");
      setZip("");
      setSolanaWallet("");
      return;
    }
    
    // Update fields when user data hash changes (Firestore data loaded or updated)
    // This handles:
    // 1. User logs in and Firestore data loads
    // 2. User data updates in Firestore
    // 3. User logs back in (data hash will change as Firestore loads)
    if (dataHashChanged) {
      const currentUserId = user.id || user.uid;
      console.log("[Wallet] Loading profile data for user:", currentUserId);
      console.log("[Wallet] User data:", {
        userId: currentUserId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        street1: user.street1,
        city: user.city,
        state: user.state,
        zip: user.zip
      });
      
      // Always update fields when user data loads
      // This ensures profile data loads when user logs back in
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setStreet1(user.street1 || "");
      setStreet2(user.street2 || "");
      setCity(user.city || "");
      setStateField(user.state || "");
      setZip(user.zip || "");
      setSolanaWallet(user.solanaWallet || "");
      
      // Update the hash to track this user data state
      lastUserDataHashRef.current = currentDataHash;
    }
  }, [user, user?.id, user?.uid, user?.firstName, user?.lastName, user?.email, user?.phone, user?.street1, user?.street2, user?.city, user?.state, user?.zip, user?.solanaWallet]);

  // Reset page when filter changes
  useEffect(() => {
    setTxCurrentPage(1);
  }, [selectedFilter]);

  const handleWalletConnected = useCallback(async (walletAddress) => {
    if (!user) return;
    
    try {
      const userId = user.id || user.uid;
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        solanaWallet: walletAddress,
      });
      
      // Update local user state
      updateUser({ ...user, solanaWallet: walletAddress });
      setSolanaWallet(walletAddress);
      console.log("[Wallet] Wallet address saved:", walletAddress);
    } catch (error) {
      console.error("[Wallet] Error saving wallet address:", error);
    }
  }, [user, updateUser]);

  // Listen for wallet connection and auto-save
  useEffect(() => {
    if (walletHook?.connected && walletHook?.publicKey) {
      const walletAddress = walletHook.publicKey.toBase58();
      setSolanaWallet(walletAddress);
      // Auto-save wallet address when connected
      if (user && walletAddress !== user.solanaWallet) {
        handleWalletConnected(walletAddress);
      }
    } else if (!walletHook?.connected) {
      // Don't clear the saved wallet address when disconnected
      // The user might want to reconnect the same wallet later
    }
  }, [walletHook?.connected, walletHook?.publicKey, user, handleWalletConnected]);

  // Get paginated transactions for current page
  const paginationData = getPaginatedTransactions(
    txCurrentPage,
    transactionsPerPage,
    selectedFilter,
  );

  const {
    transactions: paginatedTxs,
    totalCount: filteredTransactionCount,
    totalPages: txTotalPages,
  } = paginationData;

  // Get paginated prize win transactions for Prize Wins tab
  const prizeWinPaginationData = getPaginatedTransactions(
    txCurrentPage,
    transactionsPerPage,
    "prize_win",
  );

  const {
    transactions: paginatedPrizeWins,
    totalCount: prizeWinCount,
    totalPages: prizeWinTotalPages,
  } = prizeWinPaginationData;

  // Debug logging for prize_win transactions
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const prizeWins = transactions.filter((tx) => tx.type === "prize_win");
      if (prizeWins.length > 0) {
        console.log("[Wallet] Prize win transactions found in store:", prizeWins.map(tx => ({
          id: tx.id,
          status: tx.status,
          coinNumber: tx.coinNumber,
          amount: tx.amount,
          date: tx.date,
          createdAt: tx.createdAt,
        })));
      } else {
        console.log("[Wallet] No prize_win transactions found in store. Total transactions:", transactions.length);
        console.log("[Wallet] Transaction types:", [...new Set(transactions.map(tx => tx.type))]);
      }
      
      // Log filtered transactions when filter is "prize_win"
      if (selectedFilter === "prize_win") {
        const filtered = transactions.filter((tx) => tx.type === "prize_win");
        console.log("[Wallet] Filtered prize_win transactions:", filtered.length, filtered.map(tx => ({
          id: tx.id,
          status: tx.status,
          coinNumber: tx.coinNumber,
        })));
      }
    }
  }, [transactions, selectedFilter]);

  const handleTxPageChange = (newPage) => {
    setTxCurrentPage(newPage);
  };

  // Transaction filter options
  const filterOptions = [
    { value: "all", label: "All Transactions" },
    { value: "donation", label: "Donations" },
    { value: "coin_reward", label: "Coin Rewards" },
    { value: "prize_win", label: "Prize Wins" },
  ];

  // Filter confirmed transactions for stats
  const confirmedTransactions = transactions.filter(
    (t) => t.status === "confirmed",
  );
  const confirmedDonations = confirmedTransactions.filter(
    (t) => t.type === "donation",
  );
  const confirmedCoinRewards = confirmedTransactions.filter(
    (t) => t.type === "coin_reward",
  );
  const confirmedCharityCoins = confirmedCoinRewards.reduce(
    (sum, t) => sum + (t.amount || 0),
    0,
  );
  const confirmedTotalDonated = confirmedDonations.reduce(
    (sum, t) => sum + (t.amount || 0),
    0,
  );
  
  // Get charity coins and raffle entries count from user document
  const charityCoins = user?.charityCoins || 0;
  const confirmedRaffleEntryCount = charityCoins; // Total raffle entries equals total charity coins
  
  // Use user.totalDonated as primary source, fallback to calculated value from transactions
  const totalDonated = user?.totalDonated !== undefined && user?.totalDonated !== null 
    ? user.totalDonated 
    : confirmedTotalDonated;

  const getTierIcon = (tier) => {
    switch (tier) {
      case "Bronze":
        return <Shield className="h-5 w-5 text-amber-600" />;
      case "Silver":
        return <Star className="h-5 w-5 text-gray-500" />;
      case "Gold":
        return <Award className="h-5 w-5 text-yellow-500" />;
      case "Platinum":
        return <Crown className="h-5 w-5 text-purple-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "Bronze":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "Silver":
        return "text-gray-500 bg-gray-50 border-gray-200";
      case "Gold":
        return "text-yellow-500 bg-yellow-50 border-yellow-200";
      case "Platinum":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-500 bg-gray-50 border-gray-200";
    }
  };

  const getTierBenefits = (tier) => {
    switch (tier) {
      case "Bronze":
        return [
          "1x coin multiplier",
          "Basic member benefits",
          "Monthly newsletter",
        ];
      case "Silver":
        return [
          "1.1x coin multiplier",
          "Priority support",
          "Quarterly reports",
          "Member events",
        ];
      case "Gold":
        return [
          "1.25x coin multiplier",
          "VIP support",
          "Monthly reports",
          "Exclusive events",
          "Early access to features",
        ];
      case "Platinum":
        return [
          "1.5x coin multiplier",
          "Dedicated support",
          "Weekly reports",
          "VIP events",
          "Early access to features",
          "Custom benefits",
        ];
      default:
        return ["Basic member benefits"];
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please sign in to save your profile information");
      return;
    }

    const userId = user?.id || user?.uid;
    if (!userId) {
      console.error("No user ID found, cannot update profile");
      alert("Please sign in to save your profile information");
      return;
    }

    const updatedUserData = {
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || user.email || '',
      phone: phone || '',
      street1: street1 || '',
      street2: street2 || '',
      city: city || '',
      state: stateField || '',
      zip: zip || '',
      solanaWallet: solanaWallet || '',
    };

    console.log("Saving profile update in Wallet.jsx:", updatedUserData);
    console.log("User ID:", userId);

    try {
      const userRef = doc(db, "users", userId);

      // Check if document exists
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        // Document exists, update it
        console.log("Updating existing user document");
        await updateDoc(userRef, updatedUserData);
        console.log("Profile updated successfully in Firestore");

        // Verify the update succeeded
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          const savedData = updatedDoc.data();
          console.log("Verified: Profile updated in Firestore", savedData);
          
          // Update local state with saved data
          updateUser({ id: userId, ...savedData });
          setShowProfileSaved(true);
          setTimeout(() => setShowProfileSaved(false), 3000);
        } else {
          throw new Error("Profile update verification failed");
        }
      } else {
        // Document doesn't exist, create it
        console.log("User document doesn't exist, creating new document");
        const fullUserData = {
          ...updatedUserData,
          charityCoins: user.charityCoins || 0,
          totalDonated: user.totalDonated || 0,
          membershipTier: user.membershipTier || "Bronze",
          joinDate: user.joinDate || new Date().toISOString().split("T")[0],
          coinNumbers: user.coinNumbers || [],
          wonCoins: user.wonCoins || [],
          achievements: user.achievements || [],
          privacyConsent: true,
          consentDate: new Date().toISOString(),
          transactions: user.transactions || [],
        };
        await setDoc(userRef, fullUserData);
        console.log("New user document created in Firestore");

        // Verify the document was created
        const createdDoc = await getDoc(userRef);
        if (createdDoc.exists()) {
          const savedData = createdDoc.data();
          updateUser({ id: userId, ...savedData });
          setShowProfileSaved(true);
          setTimeout(() => setShowProfileSaved(false), 3000);
        } else {
          throw new Error("Failed to create user profile");
        }
      }
    } catch (error) {
      console.error("Error saving profile in Wallet.jsx:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      alert(`Error saving profile: ${error.message}. Please try again.`);
    }
  };


  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (walletHook?.disconnect) {
        walletHook.disconnect();
      }
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    setDeactivateError("");

    try {
      if (!user) throw new Error("No user found");

      const userId = user.id || user.uid;
      const userRef = doc(db, "users", userId);
      
      // Update user status to Inactive
      await updateDoc(userRef, {
        status: "Inactive",
      });

      // Update local user state
      updateUser({ ...user, status: "Inactive" });

      // Close modal and show success message
      setShowDeactivateModal(false);
      alert("Your account has been deactivated. You can still view your account and your raffle entries remain valid for future raffles.");
    } catch (error) {
      console.error("Error deactivating account:", error);
      setDeactivateError(error.message);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleReactivateAccount = async () => {
    setIsReactivating(true);
    setReactivateError("");

    try {
      if (!user) throw new Error("No user found");

      const userId = user.id || user.uid;
      const userRef = doc(db, "users", userId);
      
      // Update user status to Active
      await updateDoc(userRef, {
        status: "Active",
      });

      // Update local user state
      updateUser({ ...user, status: "Active" });

      // Show success message
      alert("Your account has been reactivated! You can now make donations again.");
    } catch (error) {
      console.error("Error reactivating account:", error);
      setReactivateError(error.message);
    } finally {
      setIsReactivating(false);
    }
  };

  // Network status indicator
  const NetworkStatusIndicator = () => {
    if (isOnline) {
      return null; // Don't show anything when online
    }
    
    return (
      <div className="flex items-center text-red-600 text-sm">
        <WifiOff className="h-4 w-4 mr-1" />
        Offline
      </div>
    );
  };

  const handleRetryConnection = async () => {
    setIsRetrying(true);
    try {
      await testConnection();
      // Refetch transactions after successful connection
      if (user?.id || user?.uid) {
        await fetchTransactions(user.id || user.uid);
      }
    } catch (error) {
      console.error("Failed to retry connection:", error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Note: Loading and error states are handled in WalletWrapper
  // WalletInner always renders when called from WalletWrapper
  // If there are network errors, show a banner but don't block the UI

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Network Status and Error Banner */}
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="flex-1">
            {/* Show error banner if there's an error but don't block UI */}
            {error && !error.includes("permission-denied") && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-sm text-yellow-800">
                    {error.includes("timeout") || error.includes("offline") || error.includes("network")
                      ? "Connection issue: Some features may be unavailable"
                      : `Error: ${error}`}
                  </span>
                </div>
                <button
                  onClick={handleRetryConnection}
                  disabled={isRetrying}
                  className="ml-4 text-sm text-yellow-700 hover:text-yellow-900 underline disabled:opacity-50"
                >
                  {isRetrying ? "Retrying..." : "Retry"}
                </button>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <NetworkStatusIndicator />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-deep-red-800 mb-4">
            My Wallet
          </h1>
          <p className="text-xl text-gray-600">
            Manage your profile, view transactions, and track your membership.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {[
              { id: "overview", label: "Overview", icon: WalletIcon },
              { id: "profile", label: "Profile", icon: User },
              { id: "transactions", label: "Transactions", icon: CreditCard },
              { id: "prizeWins", label: "Prize Wins", icon: Trophy },
              { id: "cryptoWallet", label: "Crypto Wallet", icon: WalletIcon },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-deep-red-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Wallet Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-gold-100 rounded-lg">
                    <Coins className="h-6 w-6 text-gold-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Charity Coins</p>
                    <p className="text-2xl font-bold text-gray-900">{charityCoins}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Donated</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDonated)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Gift className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Raffle & Sweepstake Entries</p>
                    <p className="text-2xl font-bold text-gray-900">{confirmedRaffleEntryCount}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Member Since</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {user?.memberSince ? new Date(user.memberSince).toLocaleDateString() : 
                       user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Membership Tier Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Membership Tier</h2>
                <p className="text-gray-600 mt-1">Your current membership level and benefits</p>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getTierIcon(user?.membershipTier || "Bronze")}
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user?.membershipTier || "Bronze"} Member
                      </h3>
                      <p className="text-gray-600">
                        {user?.membershipTier === "Bronze" && "Welcome to Charity Coin!"}
                        {user?.membershipTier === "Silver" && "You're making a difference!"}
                        {user?.membershipTier === "Gold" && "Thank you for your generosity!"}
                        {user?.membershipTier === "Platinum" && "You're a true champion of charity!"}
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-medium ${getTierColor(user?.membershipTier || "Bronze")}`}>
                    {user?.membershipTier || "Bronze"}
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Your Benefits:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getTierBenefits(user?.membershipTier || "Bronze").map((benefit, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <div className="w-2 h-2 bg-deep-red-500 rounded-full mr-3"></div>
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link
                  to="/donate"
                  className="flex items-center justify-center px-4 py-3 bg-deep-red-600 text-white rounded-lg hover:bg-deep-red-700 transition-colors"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Make a Donation
                </Link>
                <Link
                  to="/raffle"
                  className="flex items-center justify-center px-4 py-3 bg-gold-600 text-white rounded-lg hover:bg-gold-700 transition-colors"
                >
                  <Coins className="h-5 w-5 mr-2" />
                  View Raffle
                </Link>
                <button
                  onClick={() => setActiveTab("profile")}
                  className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <User className="h-5 w-5 mr-2" />
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
              <p className="text-gray-600 mt-1">Update your personal information</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleProfileSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <User className="h-4 w-4 inline mr-1" />
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="h-4 w-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Address
                    </label>
                    <input
                      type="text"
                      value={street1}
                      onChange={(e) => setStreet1(e.target.value)}
                      placeholder="Street Address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent mb-2"
                    />
                    <input
                      type="text"
                      value={street2}
                      onChange={(e) => setStreet2(e.target.value)}
                      placeholder="Apartment, suite, etc. (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent mb-2"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={stateField}
                        onChange={(e) => setStateField(e.target.value)}
                        placeholder="State"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="ZIP Code"
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-6 py-2 rounded-lg font-semibold"
                  >
                    Save Profile
                  </button>
                </div>
              </form>
              {showProfileSaved && (
                <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                  Profile saved successfully!
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              <p className="text-gray-600 mt-1">View your donation and raffle history</p>
            </div>
            <div className="p-6">
              {/* Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter Transactions</label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-deep-red-500 focus:border-transparent"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Transactions List */}
              <div className="space-y-4">
                {paginatedTxs.length > 0 ? (
                  paginatedTxs.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center flex-1">
                        <div className="p-2 bg-gray-100 rounded-lg mr-4">
                          {transaction.type === "donation" && <Gift className="h-5 w-5 text-green-600" />}
                          {transaction.type === "coin_reward" && <Award className="h-5 w-5 text-purple-600" />}
                          {transaction.type === "prize_win" && <Trophy className="h-5 w-5 text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">{transaction.date}</p>
                            {/* For Prize Win transactions, check raffleHistory for verification link */}
                            {transaction.type === "prize_win" && transaction.coinNumber && raffleHistoryMap[transaction.coinNumber]?.onChainSignature && (
                              <a
                                href={raffleHistoryMap[transaction.coinNumber].onChainUrl || `https://solscan.io/tx/${raffleHistoryMap[transaction.coinNumber].onChainSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Solscan
                              </a>
                            )}
                            {/* For Donation transactions, check for on-chain proof */}
                            {transaction.type === "donation" && transaction.onChainProofUrl && (
                              <a
                                href={transaction.onChainProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                                title="View donation proof on Solana Explorer"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Proof-of-Donation
                              </a>
                            )}
                            {/* For Coin Reward transactions, use stored signature */}
                            {transaction.type === "coin_reward" && transaction.solanaTransactionSignature && (
                              <a
                                href={`https://solscan.io/tx/${transaction.solanaTransactionSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Solscan
                              </a>
                            )}
                            {/* Fallback: if Prize Win has stored signature but no raffle history match, use it */}
                            {transaction.type === "prize_win" && transaction.solanaTransactionSignature && !raffleHistoryMap[transaction.coinNumber]?.onChainSignature && (
                              <a
                                href={`https://solscan.io/tx/${transaction.solanaTransactionSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Solscan
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {transaction.type === "donation" && formatCurrency(transaction.amount)}
                          {transaction.type === "coin_reward" && `${transaction.amount} coins`}
                          {transaction.type === "prize_win" && formatCurrency(transaction.amount)}
                        </p>
                        <p className={`text-sm ${
                          transaction.status === "confirmed" || transaction.status === "finalized" 
                            ? "text-green-600" 
                            : transaction.status === "pending"
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }`}>
                          {transaction.status === "finalized" ? "Verified" : transaction.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No transactions found</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {txTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => handleTxPageChange(txCurrentPage - 1)}
                    disabled={txCurrentPage === 1}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {txCurrentPage} of {txTotalPages}
                  </span>
                  <button
                    onClick={() => handleTxPageChange(txCurrentPage + 1)}
                    disabled={txCurrentPage === txTotalPages}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prize Wins Tab */}
        {activeTab === "prizeWins" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Prize Wins</h2>
              <p className="text-gray-600 mt-1">View your raffle prize win history</p>
            </div>
            <div className="p-6">
              {/* Prize Wins List */}
              <div className="space-y-4">
                {paginatedPrizeWins.length > 0 ? (
                  paginatedPrizeWins.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center flex-1">
                        <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                          <Trophy className="h-5 w-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-600">{transaction.date}</p>
                            {transaction.coinNumber && raffleHistoryMap[transaction.coinNumber]?.onChainSignature && (
                              <a
                                href={raffleHistoryMap[transaction.coinNumber].onChainUrl || `https://solscan.io/tx/${raffleHistoryMap[transaction.coinNumber].onChainSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Solscan
                              </a>
                            )}
                            {transaction.solanaTransactionSignature && !raffleHistoryMap[transaction.coinNumber]?.onChainSignature && (
                              <a
                                href={`https://solscan.io/tx/${transaction.solanaTransactionSignature}?cluster=devnet`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                View on Solscan
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className={`text-sm ${
                          transaction.status === "confirmed" || transaction.status === "finalized" 
                            ? "text-green-600" 
                            : transaction.status === "pending"
                            ? "text-yellow-600"
                            : "text-gray-600"
                        }`}>
                          {transaction.status === "finalized" ? "Verified" : transaction.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No prize wins yet</p>
                    <p className="text-sm text-gray-500 mt-2">Keep donating to earn more raffle entries!</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {prizeWinTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => handleTxPageChange(txCurrentPage - 1)}
                    disabled={txCurrentPage === 1}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {txCurrentPage} of {prizeWinTotalPages}
                  </span>
                  <button
                    onClick={() => handleTxPageChange(txCurrentPage + 1)}
                    disabled={txCurrentPage === prizeWinTotalPages}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Crypto Wallet Tab */}
        {activeTab === "cryptoWallet" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Crypto Wallet</h2>
                <p className="text-gray-600 mt-1">Manage your Solana wallet connection</p>
              </div>
              <div className="p-6">
                {solanaWallet && solanaWallet.trim() ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Connected Wallet Address
                      </label>
                      <div className="flex gap-4">
                        <input
                          type="text"
                          value={solanaWallet}
                          readOnly
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed font-mono text-sm"
                        />
                        <WalletMultiButton className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-6 py-2 rounded-lg font-semibold" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <a
                          href={`https://solscan.io/account/${solanaWallet}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View on Solscan
                        </a>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-500">
                          Your wallet address is saved. You can disconnect and connect a different wallet if needed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      No crypto experience needed. We automatically create a secure wallet for your Charity Coins. If you already use Solana, you can connect your wallet by pressing this button:
                    </p>
                    <div className="flex justify-start">
                      <WalletMultiButton className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-6 py-2 rounded-lg font-semibold" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Charity Coin Token Information */}
            {solanaWallet && solanaWallet.trim() && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Viewing Your Charity Coins on Solana
                  </h3>
                  <div className="space-y-3">
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Your Charity Coin tokens are stored in your Solana wallet as token accounts. To view them:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 ml-2">
                      <li>Click the "View on Solscan" link above to open your wallet on Solscan</li>
                      <li>Navigate to the <strong>"Portfolio"</strong> tab</li>
                      <li>Click on the <strong>"NFTs"</strong> sub-tab (Charity Coins appear here as token accounts)</li>
                      <li>You'll see your Charity Coin token accounts listed with their token balances</li>
                    </ol>
                    <div className="mt-4">
                      <img 
                        src="/CharityCoinscreenshot.png" 
                        alt="Charity Coins displayed in Solscan Portfolio NFTs section"
                        className="w-full rounded-lg border border-blue-300 shadow-md"
                      />
                    </div>
                    <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-2">💡 Note:</p>
                      <p className="text-xs text-blue-600">
                        Charity Coins are stored as SPL tokens in token accounts associated with your wallet. 
                        Each token account represents a Charity Coin, and the balance shows how many coins you hold in that account.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Account Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Account Settings</h2>
                <p className="text-gray-600 mt-1">Manage your account preferences</p>
              </div>
              <div className="p-6 space-y-4">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <LogOut className="h-5 w-5 mr-3 text-gray-400" />
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-gray-500">Sign out of your account</p>
                  </div>
                </button>
                
                {user?.status !== "Inactive" && (
                  <button
                    onClick={() => setShowDeactivateModal(true)}
                    className="flex items-center w-full px-4 py-3 text-left text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Shield className="h-5 w-5 mr-3 text-orange-400" />
                    <div>
                      <p className="font-medium">Deactivate Account</p>
                      <p className="text-sm text-orange-500">Temporarily deactivate your account</p>
                    </div>
                  </button>
                )}
                {user?.status === "Inactive" && (
                  <>
                    <div className="flex items-center w-full px-4 py-3 text-left text-gray-500 bg-gray-50 rounded-lg mb-4">
                      <Shield className="h-5 w-5 mr-3 text-gray-400" />
                      <div>
                        <p className="font-medium">Account Deactivated</p>
                        <p className="text-sm text-gray-500">Your account is currently inactive</p>
                      </div>
                    </div>
                    <button
                      onClick={handleReactivateAccount}
                      disabled={isReactivating}
                      className="flex items-center w-full px-4 py-3 text-left text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Shield className="h-5 w-5 mr-3 text-green-400" />
                      <div>
                        <p className="font-medium">Reactivate Account</p>
                        <p className="text-sm text-green-500">Restore your account to active status</p>
                      </div>
                    </button>
                    {reactivateError && (
                      <p className="text-red-600 text-sm mt-2 px-4">{reactivateError}</p>
                    )}
                  </>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Deactivate Account Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Deactivate Account</h3>
            <div className="mb-4 space-y-3">
              <p className="text-gray-700">
                Are you sure you want to deactivate your account?
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  <strong>What happens when you deactivate:</strong>
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>You will not be able to make future donations</li>
                  <li>You can still view your account and transaction history</li>
                  <li>Your existing raffle entries remain valid for future raffles</li>
                  <li>Your Charity Coins and achievements are preserved</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                You can reactivate your account at any time.
              </p>
            </div>
            {deactivateError && (
              <p className="text-red-600 text-sm mb-4">{deactivateError}</p>
            )}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeactivateModal(false);
                  setDeactivateError("");
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivateAccount}
                disabled={isDeactivating}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {isDeactivating ? "Deactivating..." : "Deactivate Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WalletWrapper() {
  const { user, loading: authLoading } = useAuth();
  const { loading: txLoading, error } = useTransactions();

  // Show loading while authentication is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <WalletIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Please log in to view your wallet</h2>
          <p className="text-gray-600 mb-6">Update your profile and track your membership level, donations, charity coins, and raffle entries.</p>
          <Link
            to="/donate"
            className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Check for critical permission errors that should block access
  if (error && error.includes("permission-denied") && error.includes("users")) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <Link
            to="/"
            className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-4 py-2 rounded-lg"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  // Always show wallet if user is authenticated
  // Transactions will load in the background and display when ready
  // If transactions fail to load, wallet still works for profile/settings
  return <WalletInner />;
}

export default function Wallet() {
  return (
    <ErrorBoundary>
      <WalletWrapper />
    </ErrorBoundary>
  );
}
