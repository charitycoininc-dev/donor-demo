import { useEffect, useState, useRef } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  where,
  query,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus } from "lucide-react";
import { db } from "../../stores/config/firebase.js";
import { formatCurrency } from "../../utils/currency";

export default function SweepstakesManagement() {
  const [sweepstakes, setSweepstakes] = useState([]);
  const [currentSweepstakes, setCurrentSweepstakes] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingKyc, setProcessingKyc] = useState({});
  const [refreshToken, setRefreshToken] = useState(0);

  // Form state for creating new sweepstakes
  const [newSweepstakesName, setNewSweepstakesName] = useState("");
  const [newSweepstakesPrizePool, setNewSweepstakesPrizePool] = useState("");
  const [newSweepstakesDescription, setNewSweepstakesDescription] = useState("");

  useEffect(() => {
    fetchSweepstakes();
  }, [running, refreshToken]);

  const fetchSweepstakes = async () => {
    try {
      // Fetch all sweepstakes
      const sweepstakesSnap = await getDocs(collection(db, "sweepstakes"));
      const sweepstakesList = sweepstakesSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })).sort((a, b) => {
        // Sort by date descending
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      setSweepstakes(sweepstakesList);

      // Find current (active) sweepstakes
      const active = sweepstakesList.find((s) => s.status === "active");
      setCurrentSweepstakes(active || null);
    } catch (err) {
      console.error("Error fetching sweepstakes:", err);
      setError("Failed to load sweepstakes");
    }
  };

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const openCreateModal = () => {
    setNewSweepstakesName("");
    setNewSweepstakesPrizePool("");
    setNewSweepstakesDescription("");
    setCreateModalOpen(true);
  };
  const closeCreateModal = () => setCreateModalOpen(false);

  const createSweepstakes = async () => {
    if (!newSweepstakesName.trim()) {
      setError("Please enter a sweepstakes name");
      return;
    }
    const prizePool = parseFloat(newSweepstakesPrizePool);
    if (isNaN(prizePool) || prizePool <= 0) {
      setError("Please enter a valid prize pool amount");
      return;
    }

    try {
      setError("");
      // Close any existing active sweepstakes first
      const activeSweepstakes = sweepstakes.find((s) => s.status === "active");
      if (activeSweepstakes) {
        await updateDoc(doc(db, "sweepstakes", activeSweepstakes.id), {
          status: "closed",
          closedAt: serverTimestamp(),
        });
      }

      // Create new sweepstakes
      await addDoc(collection(db, "sweepstakes"), {
        name: newSweepstakesName.trim(),
        description: newSweepstakesDescription.trim() || "",
        prizePool: prizePool,
        status: "active",
        entries: 0,
        globalEntryCounter: 1, // Start at 1 (means total entries = 0)
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });

      setSuccess("Sweepstakes created successfully!");
      setTimeout(() => setSuccess(""), 3000);
      closeCreateModal();
      setRefreshToken((token) => token + 1);
    } catch (err) {
      console.error("Error creating sweepstakes:", err);
      setError("Failed to create sweepstakes");
    }
  };

  const runSweepstakesDrawing = async () => {
    if (!currentSweepstakes) {
      setError("No active sweepstakes found");
      return;
    }

    setRunning(true);
    setError("");
    try {
      // Get all entries for current sweepstakes
      const entriesSnap = await getDocs(
        collection(db, "sweepstakes", currentSweepstakes.id, "entries"),
      );
      const entries = entriesSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      if (entries.length === 0) {
        throw new Error("No sweepstakes entries found");
      }

      // Get prior winners from sweepstakes history
      const historyQuery = query(
        collection(db, "sweepstakesHistory"),
        where("sweepstakesId", "==", currentSweepstakes.id),
        orderBy("date", "desc"),
      );
      const historySnap = await getDocs(historyQuery);
      const priorWinners = new Set(
        historySnap.docs.map((doc) => doc.data().winningEntryId),
      );

      // Filter out prior winners
      const eligibleEntries = entries.filter(
        (entry) => !priorWinners.has(entry.id),
      );

      if (eligibleEntries.length === 0) {
        throw new Error("No eligible entries (all have previously won)");
      }

      // Random selection
      const randomIndex = Math.floor(Math.random() * eligibleEntries.length);
      const winner = eligibleEntries[randomIndex];

      // Create sweepstakes history entry
      await addDoc(collection(db, "sweepstakesHistory"), {
        sweepstakesId: currentSweepstakes.id,
        sweepstakesName: currentSweepstakes.name,
        prizePool: currentSweepstakes.prizePool,
        winningEntryId: winner.id,
        entryNumber: winner.entryNumber || null,
        winnerUserId: winner.userId,
        winnerWallet: winner.solanaWallet || "N/A",
        date: new Date().toISOString(),
        status: "pending",
        kycVerification: "Pending",
        createdAt: serverTimestamp(),
      });

      // Close current sweepstakes
      await updateDoc(doc(db, "sweepstakes", currentSweepstakes.id), {
        status: "closed",
        closedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      });

      setSuccess("Sweepstakes drawing completed! Winner pending KYC verification.");
      setTimeout(() => setSuccess(""), 3000);
      setRefreshToken((token) => token + 1);
    } catch (err) {
      console.error("Error running sweepstakes drawing:", err);
      setError(err.message || "Failed to run sweepstakes drawing");
    } finally {
      setRunning(false);
    }
  };

  const handleKycDecision = async (drawing, decision) => {
    if (!drawing?.id) return;
    setProcessingKyc((prev) => ({ ...prev, [drawing.id]: true }));
    try {
      const drawingRef = doc(db, "sweepstakesHistory", drawing.id);
      const statusUpdate = {
        kycVerification: decision === "yes" ? "Yes" : "No",
        status: decision === "yes" ? "finalized" : "rejected",
        statusUpdatedAt: serverTimestamp(),
      };
      if (decision === "yes") {
        statusUpdate.finalizedAt = serverTimestamp();
      } else {
        statusUpdate.reviewedAt = serverTimestamp();
      }
      await updateDoc(drawingRef, statusUpdate);
      setRefreshToken((token) => token + 1);
    } catch (kycError) {
      console.error("[SweepstakesManagement] Error processing KYC decision:", kycError);
      setError(kycError.message);
    } finally {
      setProcessingKyc((prev) => {
        const next = { ...prev };
        delete next[drawing.id];
        return next;
      });
    }
  };

  // Fetch sweepstakes history
  const [history, setHistory] = useState([]);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historySnap = await getDocs(
          query(collection(db, "sweepstakesHistory"), orderBy("date", "desc")),
        );
        const historyList = historySnap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));
        setHistory(historyList);
      } catch (err) {
        console.error("Error fetching sweepstakes history:", err);
      }
    };
    fetchHistory();
  }, [refreshToken]);

  // Fetch entry count for current sweepstakes
  const [entryCount, setEntryCount] = useState(0);
  useEffect(() => {
    const fetchEntryCount = async () => {
      if (!currentSweepstakes) {
        setEntryCount(0);
        return;
      }
      try {
        const entriesSnap = await getDocs(
          collection(db, "sweepstakes", currentSweepstakes.id, "entries"),
        );
        setEntryCount(entriesSnap.size);
      } catch (err) {
        console.error("Error fetching entry count:", err);
        setEntryCount(0);
      }
    };
    fetchEntryCount();
  }, [currentSweepstakes, refreshToken]);

  return (
    <div className="min-h-screen py-12 px-4 max-w-6xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-deep-red-600 hover:text-deep-red-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8 text-purple-800">
        Sweepstakes Management
      </h1>

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

      {/* Current Sweepstakes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Current Sweepstakes</h2>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
          >
            <Plus className="h-4 w-4" />
            Create New Sweepstakes
          </button>
        </div>

        {currentSweepstakes ? (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold">{currentSweepstakes.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Prize Pool</p>
                <p className="text-lg font-semibold text-purple-700">
                  {formatCurrency(currentSweepstakes.prizePool || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-lg font-semibold">{entryCount}</p>
              </div>
            </div>
            {currentSweepstakes.description && (
              <p className="text-gray-700 mb-4">{currentSweepstakes.description}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={openModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
              >
                View Details
              </button>
              <button
                onClick={runSweepstakesDrawing}
                disabled={running || entryCount === 0}
                className={`font-semibold px-4 py-2 rounded-lg shadow ${
                  running || entryCount === 0
                    ? "bg-gray-400 cursor-not-allowed text-white"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
              >
                {running ? "Running..." : "Run Drawing"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl shadow-lg p-6 text-center text-gray-500">
            No active sweepstakes. Create one to get started.
          </div>
        )}
      </div>

      {/* Sweepstakes History */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sweepstakes History</h2>
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Sweepstakes</th>
                <th className="px-4 py-2">Prize Pool</th>
                <th className="px-4 py-2">Entry Number</th>
                <th className="px-4 py-2">Winner Wallet</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">KYC Verification</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-500">
                    No sweepstakes drawings yet.
                  </td>
                </tr>
              )}
              {history.map((drawing) => (
                <tr key={drawing.id} className="border-b">
                  <td className="px-4 py-2">
                    {new Date(drawing.date).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{drawing.sweepstakesName}</td>
                  <td className="px-4 py-2">
                    {formatCurrency(drawing.prizePool || 0)}
                  </td>
                  <td className="px-4 py-2">{drawing.entryNumber != null ? `#${drawing.entryNumber}` : "N/A"}</td>
                  <td className="px-4 py-2">{drawing.winnerWallet || "N/A"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                        drawing.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : drawing.status === "rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {(drawing.status || "finalized").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {drawing.status === "pending" ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleKycDecision(drawing, "yes")}
                          disabled={!!processingKyc[drawing.id]}
                          className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
                            processingKyc[drawing.id]
                              ? "bg-green-200 text-green-600 cursor-wait"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          {processingKyc[drawing.id] ? "..." : "Y"}
                        </button>
                        <button
                          onClick={() => handleKycDecision(drawing, "no")}
                          disabled={!!processingKyc[drawing.id]}
                          className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${
                            processingKyc[drawing.id]
                              ? "bg-red-200 text-red-600 cursor-wait"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                        >
                          {processingKyc[drawing.id] ? "..." : "N"}
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-700">
                        {drawing.kycVerification || "N/A"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Current Sweepstakes Modal */}
      {modalOpen && currentSweepstakes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">
              Current Sweepstakes
            </h2>
            <div className="mb-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Name:</span>
                <span>{currentSweepstakes.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Prize Pool:</span>
                <span>{formatCurrency(currentSweepstakes.prizePool || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Total Entries:</span>
                <span>{entryCount}</span>
              </div>
              {currentSweepstakes.description && (
                <div>
                  <span className="font-semibold">Description:</span>
                  <p className="text-gray-700 mt-1">{currentSweepstakes.description}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Sweepstakes Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">
              Create New Sweepstakes
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sweepstakes Name *
                </label>
                <input
                  type="text"
                  value={newSweepstakesName}
                  onChange={(e) => setNewSweepstakesName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., Monthly Community Sweepstakes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prize Pool Amount ($) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={newSweepstakesPrizePool}
                  onChange={(e) => setNewSweepstakesPrizePool(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="e.g., 10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newSweepstakesDescription}
                  onChange={(e) => setNewSweepstakesDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Enter description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={closeCreateModal}
              >
                Cancel
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={createSweepstakes}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

