import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, CreditCard, DollarSign, Building2, Coins } from "lucide-react";
import { auth, db } from "../stores/config/firebase.js";
import {
  useNotifications,
  useTransactions,
  useAuth,
  firebaseService,
} from "../stores";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import { Link } from "react-router-dom";
// import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// import { Keypair, PublicKey, Transaction } from '@solana/web3.js';
import {
  WalletMultiButton,
  useWalletModal,
} from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { formatCurrency } from "../utils/currency";
import { isStateEligibleForRaffle, normalizeStateCode } from "../utils/stateEligibility";

// Custom Wallet Button Component
function CustomWalletButton({ size = "base", onWalletConnected }) {
  const { setVisible } = useWalletModal();
  const { connected, wallet, publicKey } = useWallet();

  // Monitor wallet connection and notify parent
  useEffect(() => {
    if (connected && publicKey && onWalletConnected) {
      const walletAddress = publicKey.toBase58();
      onWalletConnected(walletAddress);
    }
  }, [connected, publicKey, onWalletConnected]);

  // If wallet is connected, show the WalletMultiButton for disconnect functionality
  if (connected && wallet && publicKey) {
    return (
      <WalletMultiButton className={`!bg-purple-700 !hover:bg-purple-800 !text-white !font-bold !rounded-lg ${size === "sm" ? "!px-4 !py-2 !text-sm" : "!px-5 !py-2 !text-base"} !border-none !shadow-md !transition-colors`} />
    );
  }

  // If wallet is not connected, show custom button with "Connect Existing Wallet" text
  const buttonClasses = size === "sm" 
    ? "bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg px-4 py-2 text-sm border-none shadow-md transition-colors"
    : "bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg px-5 py-2 text-base border-none shadow-md transition-colors";

  return (
    <button
      onClick={() => setVisible(true)}
      className={buttonClasses}
      type="button"
    >
      Connect Existing Wallet
    </button>
  );
}

function generateTransactionNumber() {
  // Format: TXN-YYYYMMDD-random6
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN-${dateStr}-${rand}`;
}

export default function Donate() {
  const { loading, isAuthenticated, user, updateUser, newAchievements, signUp } =
    useAuth();
  const { notifySuccess, notifyAchievement } = useNotifications();
  const { createDonationTransaction } = useTransactions();
  const { connected, publicKey, disconnect } = useWallet();
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [lastDonatedAmount, setLastDonatedAmount] = useState(null);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [street1, setStreet1] = useState(user?.street1 || "");
  const [street2, setStreet2] = useState(user?.street2 || "");
  const [city, setCity] = useState(user?.city || "");
  const [stateField, setStateField] = useState(user?.state || "");
  const [zip, setZip] = useState(user?.zip || "");
  const [solanaWallet, setSolanaWallet] = useState(user?.solanaWallet || "");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [nonprofits, setNonprofits] = useState([]);
  const [selectedNonprofit, setSelectedNonprofit] = useState("");
  const [loadingNonprofits, setLoadingNonprofits] = useState(true);
  const [showStateEligibilityModal, setShowStateEligibilityModal] = useState(false);
  const [stateEligibilityConfirmed, setStateEligibilityConfirmed] = useState(false);
  const [pendingDonationData, setPendingDonationData] = useState(null);
  const [isRaffleEligible, setIsRaffleEligible] = useState(true); // Default to true, will be checked

  const presetAmounts = [25, 50, 100, 250, 500, 1000];

  const getDonationAmount = () => {
    return selectedAmount || parseFloat(customAmount) || 0;
  };

  const getCharityCoinsEarned = (amount) => {
    // Bonus coins for larger donations and membership tiers
    let baseCoins = Math.floor(amount * 1); // 1 coin per dollar
    let bonusMultiplier = 1;

    // Membership tier bonuses
    if (user?.membershipTier === "Silver") bonusMultiplier = 1.1;
    else if (user?.membershipTier === "Gold") bonusMultiplier = 1.25;
    else if (user?.membershipTier === "Platinum") bonusMultiplier = 1.5;

    // Large donation bonuses
    if (amount >= 500) bonusMultiplier += 0.2;
    else if (amount >= 250) bonusMultiplier += 0.1;

    return Math.floor(baseCoins * bonusMultiplier);
  };

  const getCharityCoinsBreakdown = (amount) => {
    // Calculate base coins (1 coin per dollar)
    const baseCoins = Math.floor(amount * 1);
    
    // Calculate total coins with bonuses
    const totalCoins = getCharityCoinsEarned(amount);
    
    // Calculate bonus coins
    const bonusCoins = totalCoins - baseCoins;
    
    return {
      baseCoins,
      bonusCoins,
      totalCoins,
    };
  };

  const getTaxDeduction = (amount, eligible = true) => {
    // 100% tax deductible for non-raffle-eligible donations, 50% for raffle-eligible
    return eligible ? amount * 0.5 : amount;
  };

  const fetchNonprofits = useCallback(async () => {
    try {
      setLoadingNonprofits(true);
      const querySnapshot = await getDocs(collection(db, "nonprofits"));
      const nonprofitList = querySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((nonprofit) => nonprofit.active); // Only show active nonprofits
      setNonprofits(nonprofitList);

      // Set the first nonprofit as default if none selected
      if (nonprofitList.length > 0 && !selectedNonprofit) {
        setSelectedNonprofit(nonprofitList[0].id);
      }
    } catch (error) {
      console.error("Error fetching nonprofits:", error);
    } finally {
      setLoadingNonprofits(false);
    }
  }, [selectedNonprofit]);

  // Unused function - commented out to avoid ESLint warning
  // const sendCharityCoins = async (recipientAddress, amount) => {
  //   try {
  //     const recipientPublicKey = new PublicKey(recipientAddress);
  //     // Create a Token object for the Charity Coin mint
  //     const token = new Token(connection, CHARITY_COIN_MINT, TOKEN_PROGRAM_ID, TREASURY_KEYPAIR);
  //     // Get or create the recipient's associated token account
  //     const recipientTokenAccount =
  //       await token.getOrCreateAssociatedAccountInfo(recipientPublicKey);
  //     // Get or create the treasury's associated token account
  //     const treasuryTokenAccount =
  //       await token.getOrCreateAssociatedAccountInfo(TREASURY_PUBLIC_KEY);
  //     // Transfer tokens (Charity Coin has 0 decimals)
  //     const signature = await token.transfer(
  //       treasuryTokenAccount.address,
  //       recipientTokenAccount.address,
  //       TREASURY_KEYPAIR.publicKey,
  //       [],
  //       amount // No decimal adjustment needed
  //     );
  //     console.log(`Sent ${amount} Charity Coins to ${recipientAddress}. Tx: ${signature}`);
  //     return signature;
  //   } catch (err) {
  //     console.error('Error sending Charity Coins:', err);
  //     throw err;
  //   }
  // };

  // Unused function - commented out to avoid ESLint warning
  // const createCustodialWallet = async (userId) => {
  //   try {
  //     console.log('Creating custodial wallet for user:', userId);

  //     // Generate a new Solana keypair
  //     const newKeypair = Keypair.generate();
  //     const walletAddress = newKeypair.publicKey.toString();
  //     const privateKeyArray = Array.from(newKeypair.secretKey);

  //     // Store the wallet info in Firestore
  //     const userRef = doc(db, 'users', userId);
  //     await updateDoc(userRef, {
  //       solanaWallet: walletAddress,
  //       custodialWallet: {
  //         address: walletAddress,
  //         privateKey: privateKeyArray, // In production, encrypt this!
  //         createdAt: new Date().toISOString(),
  //       },
  //     });

  //     console.log('Custodial wallet created and stored:', walletAddress);
  //     return walletAddress;
  //   } catch (err) {
  //     console.error('Error creating custodial wallet:', err);
  //     throw err;
  //   }
  // };

  const updateUserProfile = async () => {
    console.log("updateUserProfile called");
    console.log("user object:", user);
    console.log("user.id:", user?.id);
    console.log("user.uid:", user?.uid);
    console.log("auth.currentUser:", auth.currentUser);

    // Use Firebase Auth current user UID directly to ensure it matches Firestore rules
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("No authenticated user found");
      alert("Please sign in to save your profile information");
      return;
    }

    const userId = currentUser.uid;
    console.log("Using Firebase Auth UID:", userId);

    setProfileSaving(true);
    // Mark that we're saving to prevent useEffect from interfering
    isSavingRef.current = true;
    
    try {
      const userRef = doc(db, "users", userId);

      // Check if the document exists first
      const userDoc = await getDoc(userRef);

      // Build profile data object with all fields from form
      // Include all fields to ensure they're saved, even if empty
      const profileData = {
        firstName: firstName || '',
        lastName: lastName || '',
        email: email || user?.email || '',
        phone: phone || '',
        street1: street1 || '',
        street2: street2 || '',
        city: city || '',
        state: stateField || '',
        zip: zip || '',
        solanaWallet: solanaWallet || '',
      };

      console.log("Profile data to save:", profileData);
      console.log("Form field values before save:", { firstName, lastName, email, phone, street1, street2, city, state: stateField, zip, solanaWallet });

      if (userDoc.exists()) {
        // Document exists, update it
        const existingData = userDoc.data();
        console.log("Existing document data:", existingData);
        console.log("Profile data to update:", profileData);
        console.log("Document has role field:", 'role' in existingData);
        console.log("Document has private key field:", 'solanaWalletPrivateKey' in existingData);
        console.log("Updating existing user document in Donate.jsx");
        
        // Ensure we're not trying to update role or private key
        const safeProfileData = { ...profileData };
        delete safeProfileData.role;
        delete safeProfileData.solanaWalletPrivateKey;
        console.log("Safe profile data (role and private key removed):", safeProfileData);
        
        await updateDoc(userRef, safeProfileData);
        console.log("Profile updated in Firestore:", safeProfileData);

        // Verify the update succeeded
        const updatedDoc = await getDoc(userRef);
        if (updatedDoc.exists()) {
          const savedData = updatedDoc.data();
          console.log("Verified: Profile updated in Firestore", savedData);
          
          // IMPORTANT: Preserve form field values - they already contain what the user entered
          // The form fields are React state variables that should persist after save
          // We'll update the user object but NOT the form fields (they already have correct values)
          
          // Store current form values before any updates
          const currentFormValues = {
            firstName,
            lastName,
            email,
            phone,
            street1,
            street2,
            city,
            state: stateField,
            zip,
            solanaWallet,
          };
          
          console.log("Current form values before updateUser:", currentFormValues);
          
          // Merge saved data with existing user data
          // Use form field values (what user just entered) - these are the source of truth
          const mergedUserData = {
            ...user,
            ...savedData,
            // CRITICAL: Use form field values directly (what user just saved)
            firstName: currentFormValues.firstName,
            lastName: currentFormValues.lastName,
            email: currentFormValues.email,
            phone: currentFormValues.phone,
            street1: currentFormValues.street1,
            street2: currentFormValues.street2,
            city: currentFormValues.city,
            state: currentFormValues.state,
            zip: currentFormValues.zip,
            solanaWallet: currentFormValues.solanaWallet,
            id: userId,
          };
          
          console.log("Updating user object with merged data:", mergedUserData);
          
          // Update local user state
          // Form fields already have correct values and should NOT be updated
          updateUser(mergedUserData);
          
          // IMPORTANT: Re-apply form values after updateUser to ensure they persist
          // This protects against any side effects from updateUser or useEffect
          setFirstName(currentFormValues.firstName);
          setLastName(currentFormValues.lastName);
          setEmail(currentFormValues.email);
          setPhone(currentFormValues.phone);
          setStreet1(currentFormValues.street1);
          setStreet2(currentFormValues.street2);
          setCity(currentFormValues.city);
          setStateField(currentFormValues.state);
          setZip(currentFormValues.zip);
          setSolanaWallet(currentFormValues.solanaWallet);
          
          console.log("Form field values after re-applying:", { firstName, lastName, email, phone, street1, street2, city, state: stateField, zip, solanaWallet });
          
          // Reset saving flag after a delay to allow updateUser to complete
          setTimeout(() => {
            isSavingRef.current = false;
            console.log("Reset isSavingRef flag - form fields should still have values");
          }, 1000);
          
          setProfileSaved(true);
          setTimeout(() => setProfileSaved(false), 3000);
        } else {
          throw new Error("Profile update verification failed");
        }
      } else {
        // Document doesn't exist, create it with full user data
        console.log("User document doesn't exist, creating new document in Donate.jsx");
        const fullUserData = {
          ...profileData,
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
          status: user.status || "Active",
        };
        await setDoc(userRef, fullUserData);
        console.log("New user document created in Firestore:", fullUserData);

        // Verify the document was created
        const createdDoc = await getDoc(userRef);
        if (createdDoc.exists()) {
          const savedData = createdDoc.data();
          // Merge with what we just created to ensure all fields are included
          const mergedUserData = {
            ...user,
            ...savedData,
            // Ensure profile fields use what we just saved
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            email: profileData.email,
            phone: profileData.phone,
            street1: profileData.street1,
            street2: profileData.street2,
            city: profileData.city,
            state: profileData.state,
            zip: profileData.zip,
            solanaWallet: profileData.solanaWallet,
            id: userId,
          };
          updateUser(mergedUserData);
          
          // Form fields already have the correct values - don't overwrite them
          // The useEffect won't update fields since user ID hasn't changed
          
          setProfileSaved(true);
          setTimeout(() => setProfileSaved(false), 3000);
        } else {
          throw new Error("Failed to create user profile");
        }
      }
    } catch (err) {
      console.error("Error updating profile in Firestore (Donate.jsx):", err);
      console.error("Error code:", err.code);
      console.error("Error message:", err.message);
      console.error("Error name:", err.name);
      console.error("Current user:", auth.currentUser?.uid);
      console.error("User ID used:", userId);
      console.error("Profile data:", profileData);
      
      // Check if it's a permissions error
      if (err.code === 'permission-denied' || err.message?.includes('permission')) {
        console.error("PERMISSION DENIED - Checking auth state:");
        console.error("- auth.currentUser exists:", !!auth.currentUser);
        console.error("- auth.currentUser.uid:", auth.currentUser?.uid);
        console.error("- userId from store:", user?.id || user?.uid);
        console.error("- userId used in update:", userId);
        console.error("- Match:", auth.currentUser?.uid === userId);
        
        alert(
          `Permission denied: Unable to save profile. ` +
          `Please ensure you are signed in correctly. ` +
          `If the problem persists, please contact support.`
        );
      } else {
        alert(`Error saving profile: ${err.message}. Please try again.`);
      }
    } finally {
      setProfileSaving(false);
      // Reset saving flag in case of error
      setTimeout(() => {
        isSavingRef.current = false;
      }, 1000);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setAuthError("Please enter your email address to reset your password.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthSuccess("Password reset email sent! Please check your inbox. If you don't see an email in your inbox, please check your spam folder.");
      setAuthError("");
    } catch (error) {
      setAuthError(error.message);
      setAuthSuccess("");
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    if (!isLogin && !privacyConsent) {
      setPrivacyError(
        "You must agree to the privacy policy to create an account",
      );
      return;
    }

    try {
      if (isLogin) {
        // Login
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          updateUser({
            id: userCredential.user.uid,
            ...userData,
          });
        }
      } else {
        // Sign up - use authStore's signUp function which properly handles profile creation
        console.log("📝 Signing up new user with profile data");
        console.log("📝 Profile fields from form state:", { 
          firstName, 
          lastName, 
          email, 
          phone, 
          street1, 
          street2, 
          city, 
          state: stateField, 
          zip, 
          solanaWallet 
        });
        
        // IMPORTANT: Capture form field values directly from state
        // Use the actual values, preserving empty strings if fields are empty
        // Don't use || '' because that would convert falsy values to empty strings
        const userData = {
          firstName: firstName !== undefined && firstName !== null ? firstName : '',
          lastName: lastName !== undefined && lastName !== null ? lastName : '',
          email: email !== undefined && email !== null ? email : '',
          phone: phone !== undefined && phone !== null ? phone : '',
          street1: street1 !== undefined && street1 !== null ? street1 : '',
          street2: street2 !== undefined && street2 !== null ? street2 : '',
          city: city !== undefined && city !== null ? city : '',
          state: stateField !== undefined && stateField !== null ? stateField : '',
          zip: zip !== undefined && zip !== null ? zip : '',
          solanaWallet: solanaWallet !== undefined && solanaWallet !== null ? solanaWallet : '',
        };
        
        console.log("📝 Calling authStore.signUp with userData:", userData);
        console.log("📝 Profile field values being sent:", {
          firstName: userData.firstName || '(empty)',
          lastName: userData.lastName || '(empty)',
          email: userData.email || '(empty)',
          phone: userData.phone || '(empty)',
          street1: userData.street1 || '(empty)',
          city: userData.city || '(empty)',
          state: userData.state || '(empty)',
          zip: userData.zip || '(empty)'
        });
        
        // Use authStore's signUp function which handles:
        // 1. Creating Firebase Auth user
        // 2. Waiting for auth state to propagate (up to 2 seconds)
        // 3. Creating Firestore user document with all profile fields (with retry logic)
        // 4. Setting up auth listeners
        console.log("📝 Calling signUp function...");
        
        // signUp will throw an error if it fails, or return undefined if successful
        // We don't need to check for a success property - if it completes without throwing, it succeeded
        await signUp(email, password, userData);
        
        console.log("✅ Sign up completed successfully in authStore");
        
        // The authStore signUp function now immediately updates the user object
        // with the saved profile data. Wait for React/Zustand state to propagate
        // The useEffect should trigger when user object updates and populate form fields
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // After signup, form fields should be populated from the user object
        // The user object was just updated in authStore with all profile fields
        // Check if user object has profile data
        const currentUser = user;
        if (currentUser && (currentUser.firstName || currentUser.lastName || currentUser.phone || currentUser.street1 || currentUser.city)) {
          console.log("✅ User object has profile data after signup:", {
            id: currentUser.id || currentUser.uid,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            email: currentUser.email,
            phone: currentUser.phone,
            street1: currentUser.street1,
            city: currentUser.city
          });
          console.log("✅ Form fields should be populated by useEffect");
        } else {
          console.warn("⚠️ User object does not have profile data after signup:", currentUser);
          console.warn("⚠️ Form fields may not be populated");
        }
        
        // Log current form field values for debugging
        console.log("Form fields after signup:", {
          firstName,
          lastName,
          email,
          phone,
          street1,
          city,
          state: stateField,
          zip,
          solanaWallet
        });
      }
      setAuthSuccess(
        isLogin ? "Successfully logged in!" : "Account created successfully!",
      );
    } catch (error) {
      console.error("❌ Authentication error in Donate.jsx:", error);
      console.error("   Error message:", error.message);
      console.error("   Error code:", error.code);
      console.error("   Error name:", error.name);
      console.error("   Error stack:", error.stack);
      
      // Display error to user
      const errorMessage = error.message || "An error occurred during signup. Please try again.";
      console.error("   Setting authError to:", errorMessage);
      setAuthError(errorMessage);
      setAuthSuccess(""); // Clear success message
      
      // Show alert for critical errors (Firestore document creation failures)
      if (error.message && (
        error.message.includes("Firestore") || 
        error.message.includes("permission") || 
        error.message.includes("Permission") ||
        error.message.includes("create user profile") ||
        error.message.includes("save profile")
      )) {
        console.error("   ⚠️ Critical error detected - showing alert");
        alert(
          `❌ Error creating account: ${errorMessage}\n\n` +
          `This error indicates that the user account was created in Firebase Auth, ` +
          `but the profile document could not be saved to Firestore.\n\n` +
          `Please check the browser console for more details.\n\n` +
          `You may need to:\n` +
          `1. Check Firestore security rules\n` +
          `2. Verify Firebase configuration\n` +
          `3. Try again after a few seconds`
        );
      }
    }
  };

  // Unused function - commented out to avoid ESLint warning
  // const saveDonationToCollection = async (donationData) => {
  //   try {
  //     const userId = user?.id || user?.uid;
  //     await addDoc(collection(db, 'donations'), {
  //       ...donationData,
  //       userId: userId,
  //       createdAt: serverTimestamp(),
  //       status: 'pending',
  //     });
  //     console.log('Donation saved to donations collection:', donationData);
  //   } catch (err) {
  //     console.error('Error saving donation to collection:', err);
  //   }
  // };

  const handleDonate = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const amount = getDonationAmount();
    if (amount < 5) return;
    if (!selectedNonprofit) {
      alert("Please select a nonprofit to support");
      setIsProcessing(false);
      return;
    }
    
    // Check if user account is active
    if (user?.status === "Inactive") {
      alert("Your account has been deactivated. You cannot make donations at this time. Please visit the Settings area on My Wallet to reactivate your account.");
      setIsProcessing(false);
      return;
    }

    // Check state eligibility for raffle
    const donorState = normalizeStateCode(stateField || user?.state || "");
    const isEligible = donorState ? await isStateEligibleForRaffle(donorState) : false;
    
    // If not eligible and user hasn't confirmed, show modal
    if (!isEligible && !stateEligibilityConfirmed) {
      setPendingDonationData({ amount, selectedNonprofit, donorState });
      setShowStateEligibilityModal(true);
      setIsProcessing(false);
      return;
    }

    // Continue with donation processing
    await processDonation(amount, selectedNonprofit, isEligible);
  };

  const processDonation = async (amount, selectedNonprofitId, isRaffleEligible) => {
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const coinsEarned = getCharityCoinsEarned(amount);

    // Ensure the raffles/current document exists before running the transaction
    const raffleRef = doc(db, "raffles", "current");
    let raffleDocSnap = await getDoc(raffleRef);
    if (!raffleDocSnap.exists()) {
      await setDoc(raffleRef, {
        id: "current",
        name: "Monthly Community Support Raffle",
        prizePool: 0,
        endDate: "2024-12-31",
        participants: 0,
        description:
          "Support our community while having a chance to win amazing prizes!",
        lastUpdated: new Date().toISOString(),
        globalCoinCounter: 1,
      });
    }

    const entryType = isRaffleEligible ? "raffle entries" : "sweepstakes entries";
    notifySuccess(
      `Thank you! Your ${formatCurrency(amount)} donation has been received and is pending admin approval.`,
      `Charity coins and ${entryType} will be issued after confirmation.`,
    );

    // Calculate new values
    const joinDate = user.joinDate || new Date().toISOString().split("T")[0];

    // Persist to Firestore
    const userId = user?.id || user?.uid;
    if (userId) {
      try {
        // Get selected nonprofit data
        const selectedNonprofitData = nonprofits.find(
          (n) => n.id === selectedNonprofitId,
        );

        // First, add the donation to the donations collection and get its ID
        const donationDocRef = await addDoc(collection(db, "donations"), {
          amount,
          coinsEarned,
          donationType,
          paymentMethod,
          nonprofitId: selectedNonprofitId,
          nonprofitName: selectedNonprofitData?.name || "Unknown Nonprofit",
          nonprofitCategory: selectedNonprofitData?.category || "",
          userId: userId,
          userProfile: {
            firstName,
            lastName,
            email,
            phone,
            street1,
            street2,
            city,
            state: stateField,
            zip,
          },
          isRaffleEligible: isRaffleEligible,
          createdAt: serverTimestamp(),
          status: "pending",
        });
        const donationId = donationDocRef.id;
        // Create donation transaction using Zustand store
        await createDonationTransaction(userId, {
          transactionNumber: generateTransactionNumber(),
          amount: amount,
          donationId: donationId,
          nonprofitId: selectedNonprofit,
          nonprofitName: selectedNonprofitData?.name || "Unknown Nonprofit",
        });

        // Send initial confirmation email to donor and admin notification
        try {
          const donorName = `${firstName || ''} ${lastName || ''}`.trim() || email;
          const emailResponse = await fetch('/api/send-donation-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'initial',
              donorEmail: email,
              donorName: donorName,
              donationAmount: amount,
              nonprofitName: selectedNonprofitData?.name || "Unknown Nonprofit",
              donationId: donationId,
              isRaffleEligible: isRaffleEligible,
            }),
          });

          if (emailResponse.ok) {
            console.log('[Donate] Initial confirmation emails sent successfully');
          } else {
            console.warn('[Donate] Failed to send initial confirmation emails (non-critical)');
          }
        } catch (emailError) {
          console.warn('[Donate] Error sending initial confirmation emails (non-critical):', emailError);
          // Don't block donation creation if email fails
        }

        // Update user profile data
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          // Create the user document if it doesn't exist
          const fullUserData = {
            firstName,
            lastName,
            email,
            phone,
            street1,
            street2,
            city,
            state: stateField,
            zip,
            solanaWallet,
            charityCoins: 0,
            totalDonated: 0,
            membershipTier: "Bronze",
            joinDate,
            coinNumbers: [],
            wonCoins: [],
            achievements: [],
            privacyConsent: true,
            consentDate: new Date().toISOString(),
            status: "Active",
          };
          await setDoc(userRef, fullUserData);
          console.log("New user document created:", fullUserData);
        } else {
          // Document exists, update it
          await updateDoc(userRef, {
            firstName,
            lastName,
            email,
            phone,
            street1,
            street2,
            city,
            state: stateField,
            zip,
            solanaWallet,
          });
        }
        // Fetch latest user data and update context
        const latestUser = await firebaseService.getDocument(`users/${userId}`);
        if (latestUser) {
          updateUser({ id: userId, ...latestUser });
        }
      } catch (err) {
        console.error("Error updating user in Firestore:", err);
      }
    }

    // After donation is processed and user data is updated:
    // Do not create custodial wallet or send Charity Coins at this stage. This will be handled after admin confirmation.

    setIsProcessing(false);
    setShowSuccess(true);
    setSelectedAmount(null);
    setCustomAmount("");
    setLastDonatedAmount(amount);
    // Reset state eligibility confirmation for next donation
    setStateEligibilityConfirmed(false);
  };

  const processDonationAfterConfirmation = async () => {
    if (!pendingDonationData) return;
    
    setStateEligibilityConfirmed(true);
    setShowStateEligibilityModal(false);
    
    // Process the donation with the pending data
    const { amount, selectedNonprofit: pendingNonprofit } = pendingDonationData;
    
    // Process donation directly (isRaffleEligible is false for non-eligible states)
    setIsProcessing(true);
    await processDonation(amount, pendingNonprofit, false);
    
    // Reset state
    setPendingDonationData(null);
    setIsProcessing(false);
    setShowSuccess(true);
    setSelectedAmount(null);
    setCustomAmount("");
    setLastDonatedAmount(amount);
    setStateEligibilityConfirmed(false);
  };

  const getImpactDescription = (amount) => {
    if (amount >= 500)
      return "Fund a complete educational workshop for 25 students";
    if (amount >= 250) return "Provide scholarship support for 2 students";
    if (amount >= 100) return "Support community outreach programs for a month";
    if (amount >= 50) return "Fund educational materials for 10 students";
    if (amount >= 25) return "Support one family with emergency assistance";
    return "Every dollar makes a difference in our community";
  };

  // Track the last user data hash we initialized fields for
  // This helps detect when user data actually loads from Firestore
  const lastInitializedDataHashRef = useRef(null);
  // Track if we're currently saving to prevent useEffect from interfering
  const isSavingRef = useRef(false);

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

  // Update form fields when user data loads from Firestore
  useEffect(() => {
    // Don't run if we're currently saving - form fields already have correct values
    if (isSavingRef.current) {
      console.log("Skipping useEffect - profile is being saved");
      return;
    }

    const currentDataHash = getUserDataHash(user);
    const dataHashChanged = currentDataHash !== lastInitializedDataHashRef.current;
    
    // Reset and clear fields when user logs out
    if (!isAuthenticated || !user) {
      lastInitializedDataHashRef.current = null;
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
    // 4. New user signs up and Firestore data loads
    if (isAuthenticated && user && dataHashChanged) {
      const currentUserId = user.id || user.uid;
      
      // Check if user object has profile fields defined (even if empty strings)
      // This is important because Firestore might have empty strings for fields
      const hasProfileFields = user.hasOwnProperty('firstName') || 
                              user.hasOwnProperty('lastName') || 
                              user.hasOwnProperty('phone') || 
                              user.hasOwnProperty('street1') || 
                              user.hasOwnProperty('city');
      
      // Check if user object has meaningful profile data (non-empty values)
      const hasProfileData = (user.firstName && user.firstName.trim()) || 
                            (user.lastName && user.lastName.trim()) || 
                            (user.phone && user.phone.trim()) || 
                            (user.street1 && user.street1.trim()) || 
                            (user.city && user.city.trim());
      
      console.log("[Donate] Data hash changed for user:", currentUserId);
      console.log("[Donate] Has profile fields (defined):", hasProfileFields);
      console.log("[Donate] Has profile data (non-empty):", hasProfileData);
      console.log("[Donate] Current form field values:", { firstName, lastName, email, phone, street1, city });
      console.log("[Donate] User object data:", { 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email,
        phone: user.phone,
        street1: user.street1,
        city: user.city,
        state: user.state,
        zip: user.zip
      });
      
      // Update fields from user object if it has profile fields defined
      // This ensures profile data loads when user logs back in or signs up
      // We check for hasProfileFields (fields are defined) rather than hasProfileData (fields have values)
      // because empty strings are valid values that should be displayed
      if (hasProfileFields || hasProfileData) {
        // User object has profile fields - update all form fields from user object
        // This will populate fields when Firestore data loads after signup
        console.log("[Donate] User object has profile fields - updating form fields from Firestore data");
        
        // Always update from user object when it has profile fields
        // This ensures form fields reflect what's in Firestore
        // Use empty string as default if field is undefined
        setFirstName(user.firstName !== undefined ? user.firstName : "");
        setLastName(user.lastName !== undefined ? user.lastName : "");
        setEmail(user.email !== undefined ? user.email : "");
        setPhone(user.phone !== undefined ? user.phone : "");
        setStreet1(user.street1 !== undefined ? user.street1 : "");
        setStreet2(user.street2 !== undefined ? user.street2 : "");
        setCity(user.city !== undefined ? user.city : "");
        setStateField(user.state !== undefined ? user.state : "");
        setZip(user.zip !== undefined ? user.zip : "");
        setSolanaWallet(user.solanaWallet !== undefined ? user.solanaWallet : "");
        
        console.log("[Donate] Form fields updated from Firestore data:", {
          firstName: user.firstName !== undefined ? user.firstName : "",
          lastName: user.lastName !== undefined ? user.lastName : "",
          email: user.email !== undefined ? user.email : "",
          phone: user.phone !== undefined ? user.phone : "",
          street1: user.street1 !== undefined ? user.street1 : "",
          city: user.city !== undefined ? user.city : ""
        });
      } else if (lastInitializedDataHashRef.current === null) {
        // First time initializing - user object exists but doesn't have profile fields yet
        // This can happen right after signup before Firestore data loads
        // Don't clear form fields - they might have values from signup
        console.log("[Donate] First initialization - user object exists but no profile fields yet");
        console.log("[Donate] Preserving existing form field values:", { firstName, lastName, email, phone, street1, city });
        
        // Only set email if it exists in user object (always available from Firebase Auth)
        if (user.email) {
          setEmail(user.email);
        }
      } else {
        // User object exists but doesn't have profile fields, and we've already initialized
        // Don't update form fields - preserve existing values
        console.log("[Donate] User object exists but no profile fields - preserving form fields");
      }
      
      // Mark that we've processed this user data hash
      // This prevents re-running when the same data loads
      lastInitializedDataHashRef.current = currentDataHash;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, user?.id, user?.uid, user?.firstName, user?.lastName, user?.email, user?.phone, user?.street1, user?.street2, user?.city, user?.state, user?.zip, user?.solanaWallet, isAuthenticated]);

  useEffect(() => {
    fetchNonprofits();
  }, [fetchNonprofits]);

  // Check state eligibility when state field changes
  useEffect(() => {
    const checkEligibility = async () => {
      const donorState = normalizeStateCode(stateField || user?.state || "");
      if (donorState) {
        const eligible = await isStateEligibleForRaffle(donorState);
        setIsRaffleEligible(eligible);
      } else {
        // Default to eligible if no state is provided
        setIsRaffleEligible(true);
      }
    };
    checkEligibility();
  }, [stateField, user?.state]);

  // Track previous achievements to avoid duplicate notifications
  const prevAchievementsRef = useRef([]);

  useEffect(() => {
    if (newAchievements && Array.isArray(newAchievements)) {
      // Only notify for new achievements not already in user's achievements
      const prevIds = (user?.achievements || []).map((a) => a.id);
      newAchievements.forEach((achievement) => {
        if (!prevIds.includes(achievement.id)) {
          notifyAchievement(achievement.title, achievement.description);
        }
      });
      prevAchievementsRef.current = newAchievements;
    }
  }, [newAchievements, notifyAchievement, user?.achievements]);


  // Handle wallet connection - save wallet address to profile when connected (authenticated users only)
  const handleWalletConnected = useCallback(async (walletAddress) => {
    if (!walletAddress) {
      return;
    }

    console.log("[Donate] Wallet connected:", walletAddress);
    
    // Update form state immediately so UI reflects the connection
    setSolanaWallet(walletAddress);

    // If user is authenticated, save to profile in Firestore
    if (isAuthenticated && user) {
      const userId = user?.id || user?.uid;
      if (userId) {
        try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, {
            solanaWallet: walletAddress,
          });
          
          // Update local user state
          updateUser({ ...user, solanaWallet: walletAddress });
          
          console.log("[Donate] Wallet address saved to profile:", walletAddress);
          notifySuccess("Wallet connected successfully!", `Your wallet ${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)} has been saved to your profile.`);
        } catch (error) {
          console.error("[Donate] Error saving wallet address:", error);
          alert("Error saving wallet address. Please try again.");
        }
      }
    } else {
      // During signup, just update the state - it will be saved when account is created
      console.log("[Donate] Wallet connected during signup, will be saved with account creation");
    }
  }, [isAuthenticated, user, updateUser, notifySuccess]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-deep-red-800 mb-4">
              Sign In to Donate
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Please sign in or create an account to make a donation and start
              receiving charity coins.
            </p>
            <a
              href="https://www.tbhfdn.org/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 px-8 py-3 bg-gold-400 text-deep-red-800 font-bold rounded-lg shadow hover:bg-gold-500 transition-colors text-lg"
            >
              Donate without entering sweepstakes or raffles
            </a>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-h-[90vh] overflow-y-auto">
              {showForgotPassword ? (
                <>
                  <button
                    onClick={() => setShowForgotPassword(false)}
                    className="text-sm text-deep-red-600 hover:text-deep-red-700 font-medium mb-4"
                  >
                    &larr; Back to Sign In
                  </button>
                  <h3 className="text-xl font-bold text-deep-red-800 mb-4">
                    Reset Your Password
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter your email address and we&apos;ll send you a link to
                    reset your password.
                  </p>
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    {authError && (
                      <div className="text-red-600 text-sm">{authError}</div>
                    )}
                    {authSuccess && (
                      <div className="text-green-600 text-sm">
                        {authSuccess}
                      </div>
                    )}
                    <button
                      type="submit"
                      className="w-full bg-deep-red-600 hover:bg-deep-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Send Reset Link
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <button
                      onClick={() => setIsLogin(true)}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        isLogin
                          ? "bg-white text-deep-red-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setIsLogin(false)}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                        !isLogin
                          ? "bg-white text-deep-red-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Create Account
                    </button>
                  </div>
                  <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                      <>
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-deep-red-800 mb-3">
                            Personal Information
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                First Name *
                              </label>
                              <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required={!isLogin}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Last Name *
                              </label>
                              <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required={!isLogin}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>

                    {!isLogin && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required={!isLogin}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-semibold text-deep-red-800 mb-3">
                            Address Information
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address 1 *
                              </label>
                              <input
                                type="text"
                                value={street1}
                                onChange={(e) => setStreet1(e.target.value)}
                                required={!isLogin}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Street Address 2
                              </label>
                              <input
                                type="text"
                                value={street2}
                                onChange={(e) => setStreet2(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  City *
                                </label>
                                <input
                                  type="text"
                                  value={city}
                                  onChange={(e) => setCity(e.target.value)}
                                  required={!isLogin}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  State *
                                </label>
                                <input
                                  type="text"
                                  value={stateField}
                                  onChange={(e) => setStateField(e.target.value)}
                                  required={!isLogin}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Zip Code *
                                </label>
                                <input
                                  type="text"
                                  value={zip}
                                  onChange={(e) => setZip(e.target.value)}
                                  required={!isLogin}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-semibold text-deep-red-800 mb-3">
                            Wallet Information (Optional)
                          </h3>
                          <div>
                            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                              No crypto experience needed. We automatically create a secure wallet for your Charity Coins. If you already use Solana, you can connect your wallet:
                            </p>
                            <div className="flex justify-start">
                              <CustomWalletButton size="sm" onWalletConnected={handleWalletConnected} />
                            </div>
                            {solanaWallet && solanaWallet.trim() && (
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Connected Wallet Address
                                </label>
                                <input
                                  type="text"
                                  value={solanaWallet}
                                  readOnly
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 cursor-not-allowed text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {authError && (
                      <div className="text-red-600 text-sm">{authError}</div>
                    )}

                    {authSuccess && (
                      <div className="text-green-600 text-sm">
                        {authSuccess}
                      </div>
                    )}

                    {!isLogin && (
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="privacy-consent"
                            type="checkbox"
                            checked={privacyConsent}
                            onChange={(e) => {
                              setPrivacyConsent(e.target.checked);
                              setPrivacyError("");
                            }}
                            className="h-4 w-4 text-deep-red-600 border-gray-300 rounded focus:ring-deep-red-500"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="privacy-consent"
                            className="font-medium text-gray-700"
                          >
                            I agree to the{" "}
                            <a
                              href="/privacy"
                              className="text-deep-red-600 hover:text-deep-red-500"
                            >
                              Privacy Policy
                            </a>
                          </label>
                          {privacyError && (
                            <p className="mt-1 text-red-600">{privacyError}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-deep-red-600 hover:bg-deep-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {isLogin ? "Sign In" : "Create Account"}
                    </button>
                  </form>
                  {isLogin && (
                    <div className="text-right mt-2">
                      <button
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-deep-red-600 hover:text-deep-red-700 font-medium"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {isLogin && (
                    <div className="mt-4 text-center text-sm text-gray-600">
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => setIsLogin(false)}
                        className="text-deep-red-600 hover:text-deep-red-700 font-medium"
                      >
                        Create one now
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-deep-red-800 mb-4">
            Make a Difference Today
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your donation supports The Black History Foundation&apos;s
            community programs, earns you charity coins and perpetual raffle entries, and is 50% tax
            deductible.*
          </p>
        </div>
        {/* Wrap the following two divs in a fragment to avoid adjacent JSX elements */}
        <>
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-4">
              Click the button below to make a donation without entering the
              raffles (and without earning Charity Coins)
            </p>
            <a
              href="https://www.tbhfdn.org/donate"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 border border-deep-red-600 text-deep-red-600 bg-white hover:bg-deep-red-50 font-semibold rounded-lg transition-colors"
            >
              Donate without entering sweepstakes or raffles
            </a>
          </div>
          <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mb-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleDonate();
              }}
            >
              {/* Donation Form Fields */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button
                  type="button"
                  onClick={() => setDonationType("one-time")}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    donationType === "one-time"
                      ? "bg-white text-deep-red-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  One-Time Donation
                </button>
                <button
                  type="button"
                  onClick={() => setDonationType("monthly")}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    donationType === "monthly"
                      ? "bg-white text-deep-red-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Monthly Giving
                </button>
              </div>

              {/* Nonprofit Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommend Nonprofit to Support
                </label>
                <p className="text-xs text-gray-500 mb-3 space-y-2">
                  <span className="block">
                    Every donation enters our 50/50 raffle: 50% of your gift feeds
                    the prize pool and 50% supports The Black History Foundation.
                    A 5% raffle management fee is applied to the Foundation&apos;s share
                    before the funds are put to work.{" "}
                    <Link
                      to="/rules"
                      className="text-deep-red-600 underline font-semibold hover:text-deep-red-800"
                    >
                      See Rules for more details.*
                    </Link>
                  </span>
                  <span className="block">
                    Your donation is processed by The Black History Foundation and
                    then granted to the nonprofit you recommend, allowing you to advance TBHF&apos;s mission while supporting aligned organizations. You may recommend an eligible nonprofit. TBHF makes all final grant decisions.
                  </span>
                </p>
                {loadingNonprofits ? (
                  <div className="text-gray-500">Loading nonprofits...</div>
                ) : nonprofits.length === 0 ? (
                  <div className="text-red-500">
                    No active nonprofits available. Please contact support.
                  </div>
                ) : (
                  <select
                    value={selectedNonprofit}
                    onChange={(e) => setSelectedNonprofit(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  >
                    <option value="">Choose a nonprofit...</option>
                    {nonprofits.map((nonprofit) => (
                      <option key={nonprofit.id} value={nonprofit.id}>
                        {nonprofit.name}{" "}
                        {nonprofit.category && `(${nonprofit.category})`}
                      </option>
                    ))}
                  </select>
                )}
                {selectedNonprofit &&
                  nonprofits.find((n) => n.id === selectedNonprofit) && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>
                          {
                            nonprofits.find(
                              (n) => n.id === selectedNonprofit,
                            )?.name
                          }
                        </strong>
                        {nonprofits.find((n) => n.id === selectedNonprofit)
                          ?.description && (
                          <span className="block mt-1 text-blue-700">
                            {
                              nonprofits.find(
                                (n) => n.id === selectedNonprofit,
                              )?.description
                            }
                          </span>
                        )}
                      </p>
                    </div>
                  )}
              </div>

              <h2 className="text-2xl font-bold text-deep-red-800 mb-6">
                Choose Your {donationType === "monthly" ? "Monthly " : ""}
                Donation Amount
              </h2>

              {/* Preset Amounts */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {presetAmounts.map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    onClick={() => {
                      setSelectedAmount(amount);
                      setCustomAmount("");
                    }}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedAmount === amount
                        ? "border-gold-500 bg-gold-50 text-gold-700"
                        : "border-gray-200 hover:border-gold-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="text-lg font-bold">{formatCurrency(amount)}</div>
                    <div className="text-sm text-gray-600">
                      {(() => {
                        const { baseCoins, bonusCoins } = getCharityCoinsBreakdown(amount);
                        if (bonusCoins > 0) {
                          return `${baseCoins} coins + ${bonusCoins} bonus`;
                        }
                        return `${baseCoins} coins`;
                      })()}
                    </div>
                    {donationType === "monthly" && (
                      <div className="text-xs text-blue-600 mt-1">
                        /month
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Amount */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or enter a custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    placeholder="0.00"
                    min="5"
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                  />
                </div>
                {customAmount && parseFloat(customAmount) >= 5 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      You&apos;ll earn{" "}
                      {(() => {
                        const { baseCoins, bonusCoins } = getCharityCoinsBreakdown(parseFloat(customAmount));
                        if (bonusCoins > 0) {
                          return `${baseCoins} coins + ${bonusCoins} bonus`;
                        }
                        return `${baseCoins} coins`;
                      })()}
                    </p>
                    <p className="text-sm text-blue-600">
                      Impact:{" "}
                      {getImpactDescription(parseFloat(customAmount))}
                    </p>
                  </div>
                )}
              </div>

              {/* Donation Summary */}
              {getDonationAmount() >= 5 && selectedNonprofit && (
                <div className="bg-gradient-to-r from-gold-50 to-gold-100 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-deep-red-800 mb-4">
                    Donation Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-700">Nonprofit:</span>
                      <span className="font-semibold text-blue-600">
                        {nonprofits.find((n) => n.id === selectedNonprofit)
                          ?.name || "Selected Nonprofit"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        {donationType === "monthly" ? "Monthly " : ""}
                        Donation Amount:
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(getDonationAmount())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        Charity Coins Earned:
                      </span>
                      <span className="font-semibold text-gold-600">
                        {(() => {
                          const { baseCoins, bonusCoins } = getCharityCoinsBreakdown(getDonationAmount());
                          if (bonusCoins > 0) {
                            return `${baseCoins} coins + ${bonusCoins} bonus`;
                          }
                          return `${baseCoins} coins`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700">
                        Tax Deduction ({isRaffleEligible ? "50%" : "100%"}):
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(getTaxDeduction(getDonationAmount(), isRaffleEligible))}
                      </span>
                    </div>
                    {user?.membershipTier !== "Bronze" && (
                      <div className="flex justify-between">
                        <span className="text-gray-700">
                          {user?.membershipTier} Bonus:
                        </span>
                        <span className="font-semibold text-purple-600">
                          +
                          {Math.floor(
                            getCharityCoinsEarned(getDonationAmount()) -
                              getDonationAmount(),
                          )}{" "}
                          coins
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-bold">
                        <span>Impact:</span>
                        <span className="text-blue-600">
                          100% to Community Programs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Method */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-deep-red-800 mb-4">
                  Payment Method
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === "card"
                        ? "border-gold-500 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-6 w-6 text-gray-600" />
                      <div className="text-left">
                        <p className="font-semibold">Credit/Debit Card</p>
                        <p className="text-sm text-gray-600">
                          Secure payment processing
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paypal")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === "paypal"
                        ? "border-gold-500 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-6 w-6 text-gray-600" />
                      <div className="text-left">
                        <p className="font-semibold">PayPal</p>
                        <p className="text-sm text-gray-600">
                          Quick & secure
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("bank")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === "bank"
                        ? "border-gold-500 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-6 w-6 text-gray-600" />
                      <div className="text-left">
                        <p className="font-semibold">Bank Transfer</p>
                        <p className="text-sm text-gray-600">
                          Direct bank transfer
                        </p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("crypto")}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      paymentMethod === "crypto"
                        ? "border-gold-500 bg-gold-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Coins className="h-6 w-6 text-gray-600" />
                      <div className="text-left">
                        <p className="font-semibold">Crypto</p>
                        <p className="text-sm text-gray-600">
                          Cryptocurrency payment
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Donate Button */}
              <button
                type="submit"
                disabled={
                  getDonationAmount() < 5 ||
                  isProcessing ||
                  !selectedNonprofit
                }
                className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  getDonationAmount() >= 5 &&
                  !isProcessing &&
                  selectedNonprofit
                    ? "bg-deep-red-600 hover:bg-deep-red-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </div>
                ) : !selectedNonprofit ? (
                  "Please select a nonprofit"
                ) : (
                  `${donationType === "monthly" ? "Start Monthly Giving" : "Donate"} ${formatCurrency(getDonationAmount())} (All donations are simulated)`
                )}
              </button>

              {getDonationAmount() < 5 && getDonationAmount() > 0 && (
                <p className="text-red-600 text-sm mt-2">
                  Minimum donation amount is $5
                </p>
              )}

              {showSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6 flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h3 className="text-yellow-800 font-semibold mb-2">
                      Donation Pending
                    </h3>
                    <p className="text-yellow-700 mb-2">
                      Thank you for your generous donation of $
                      {lastDonatedAmount}. Your donation is being processed
                      and once your donation is confirmed, your charity
                      coins will be added to your wallet and your raffle or sweepstake entries will be issued.
                    </p>
                    <p className="text-green-600 text-sm">
                      You&apos;ll receive a receipt for your tax-deductible donation via email shortly.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </div>
        </>
      </div>

      {/* State Eligibility Modal */}
      {showStateEligibilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6">
            <h2 className="text-2xl font-bold text-deep-red-800 mb-4">
              State Raffle Eligibility Notice
            </h2>
            <div className="space-y-4 mb-6">
              <p className="text-gray-700 leading-relaxed">
                It has been determined that your state does not allow you to enter our 50/50 raffle.
              </p>
              <p className="text-gray-700 leading-relaxed">
                However, you can still make a donation! Here's what this means:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                <li>
                  <strong>100% of your donation</strong> will go through The Black History Foundation to the nonprofit you selected.
                </li>
                <li>
                  You will still earn <strong>Charity Coins</strong> (same calculation: 1 coin per dollar + bonuses)
                </li>
                <li>
                  Instead of raffle entries, you will earn <strong>1 sweepstakes entry per $1 donated</strong>
                </li>
                <li>
                  Your donation is now <strong>100% tax deductible!</strong>
                </li>
              </ul>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Sweepstakes entries are tied to specific sweepstakes and will be issued when your donation is approved.
                </p>
              </div>
            </div>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setShowStateEligibilityModal(false);
                  setPendingDonationData(null);
                  setIsProcessing(false);
                }}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processDonationAfterConfirmation}
                className="px-6 py-2 bg-deep-red-600 text-white rounded-lg hover:bg-deep-red-700 transition-colors"
              >
                I Understand, Continue with Donation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State Eligibility Notice */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-4xl mx-auto">
        <p className="text-sm text-gray-700 leading-relaxed">
          *50/50 raffles are not allowed in all states. If it is determined that you are in a state that does not allow 50/50 raffles, your donation will be processed as a non-raffle-eligible donation. You will still earn Charity Coins for your donations, but you will not earn raffle entries. You will instead receive sweepstake entries (1 for every dollar donated). Your donation will be 100% tax deductible. Charity Coins are not raffle entries, prizes, or wagers. Charity Coins are issued solely as symbolic donor recognition and program participation tools and have no cash or gambling value.
        </p>
      </div>

      {/* Variance Power Disclosure */}
      <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-4xl mx-auto">
        <p className="text-sm text-gray-700 leading-relaxed">
          <strong>Variance Power Disclosure</strong>
          <br />
          <br />
          The Black History Foundation (&quot;TBHF&quot;) retains full discretion and control over all contributions received. While donors may recommend that funds support particular programs or eligible charitable organizations aligned with TBHF&apos;s mission, all contributions are subject to TBHF&apos;s independent review and approval. TBHF may redirect funds as necessary to ensure compliance with its charitable purposes, applicable law, and IRS requirements.
        </p>
      </div>
    </div>
  );
}
