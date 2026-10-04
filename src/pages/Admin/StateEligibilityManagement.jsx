import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { db } from "../../stores/config/firebase.js";

// List of all US states
const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

// Initial eligible states based on research (conservative list)
// Note: Some states have restrictions (e.g., online sales prohibited, specific nonprofits only)
// Admins should verify and adjust based on current regulations
const INITIAL_ELIGIBLE_STATES = [
  "FL", // Florida - allows online raffles with registration
  "IL", // Illinois - allows raffles with registration
  "MT", // Montana - allows online raffles (no credit cards)
  "NC", // North Carolina - allows raffles for nonprofits
  "NY", // New York - allows online raffles with state approval
  "OH", // Ohio - allows raffles with licensing
  "SC", // South Carolina - allows online raffles for registered nonprofits
  "SD", // South Dakota - allows raffles for nonprofits
  "TX", // Texas - allows raffles with license
];

export default function StateEligibilityManagement() {
  const [eligibleStates, setEligibleStates] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEligibleStates();
  }, []);

  const fetchEligibleStates = async () => {
    try {
      setLoading(true);
      const settingsRef = doc(db, "settings", "raffleEligibleStates");
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setEligibleStates(new Set(data.eligibleStates || []));
      } else {
        // Initialize with default eligible states
        const defaultStates = new Set(INITIAL_ELIGIBLE_STATES);
        setEligibleStates(defaultStates);
        // Save initial state
        await setDoc(settingsRef, {
          eligibleStates: INITIAL_ELIGIBLE_STATES,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("Error fetching eligible states:", err);
      setError("Failed to load eligible states");
    } finally {
      setLoading(false);
    }
  };

  const toggleState = (stateCode) => {
    const newEligibleStates = new Set(eligibleStates);
    if (newEligibleStates.has(stateCode)) {
      newEligibleStates.delete(stateCode);
    } else {
      newEligibleStates.add(stateCode);
    }
    setEligibleStates(newEligibleStates);
  };

  const saveEligibleStates = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");
      
      const settingsRef = doc(db, "settings", "raffleEligibleStates");
      await updateDoc(settingsRef, {
        eligibleStates: Array.from(eligibleStates),
        lastUpdated: new Date().toISOString(),
      });
      
      setSuccess("Eligible states updated successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error saving eligible states:", err);
      setError("Failed to save eligible states");
    } finally {
      setSaving(false);
    }
  };

  const selectAll = () => {
    setEligibleStates(new Set(US_STATES.map((s) => s.code)));
  };

  const deselectAll = () => {
    setEligibleStates(new Set());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          to="/admin"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-deep-red-800">
          Raffle State Eligibility Management
        </h1>
        <p className="text-gray-600 mt-2">
          Manage which states are eligible for 50/50 raffle donations. Donors from
          non-eligible states will receive sweepstakes entries instead of raffle entries.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {success}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Eligible States ({eligibleStates.size} of {US_STATES.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Deselect All
            </button>
            <button
              onClick={saveEligibleStates}
              disabled={saving}
              className="px-6 py-2 bg-deep-red-600 text-white rounded-lg hover:bg-deep-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {US_STATES.map((state) => {
            const isEligible = eligibleStates.has(state.code);
            return (
              <label
                key={state.code}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  isEligible
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isEligible}
                  onChange={() => toggleState(state.code)}
                  className="mr-3 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="font-medium text-gray-900">
                  {state.name} ({state.code})
                </span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h3>
        <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
          <li>
            State raffle laws change frequently. Please verify current regulations
            before enabling states.
          </li>
          <li>
            Some states allow raffles but prohibit online ticket sales. Only enable
            states that explicitly allow online 50/50 raffles.
          </li>
          <li>
            Some states require specific licenses or registrations. Ensure your
            organization has proper authorization before enabling.
          </li>
          <li>
            Donors from non-eligible states will still be able to donate, but will
            receive sweepstakes entries instead of raffle entries.
          </li>
        </ul>
      </div>
    </div>
  );
}

