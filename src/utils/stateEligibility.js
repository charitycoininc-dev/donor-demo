import { doc, getDoc } from "firebase/firestore";
import { db } from "../stores/config/firebase.js";

/**
 * Check if a state is eligible for raffle donations
 * @param {string} stateCode - Two-letter state code (e.g., "FL", "NY")
 * @returns {Promise<boolean>} - True if state is eligible, false otherwise
 */
export async function isStateEligibleForRaffle(stateCode) {
  if (!stateCode) {
    return false;
  }

  try {
    const settingsRef = doc(db, "settings", "raffleEligibleStates");
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      const data = settingsSnap.data();
      const eligibleStates = data.eligibleStates || [];
      return eligibleStates.includes(stateCode.toUpperCase());
    }
    
    // If settings don't exist, default to false (conservative approach)
    return false;
  } catch (error) {
    console.error("Error checking state eligibility:", error);
    // Default to false on error (conservative approach)
    return false;
  }
}

/**
 * Normalize state code to uppercase
 * @param {string} stateCode - State code (may be mixed case)
 * @returns {string} - Uppercase state code
 */
export function normalizeStateCode(stateCode) {
  if (!stateCode) return "";
  return stateCode.toUpperCase().trim();
}

