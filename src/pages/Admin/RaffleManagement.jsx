import { useEffect, useState, useRef } from "react";
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  where,
  limit,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { db } from "../../stores/config/firebase.js";
import { formatCurrency } from "../../utils/currency";

export default function AdminRaffles() {
  const [raffleHistory, setRaffleHistory] = useState([]);
  const [currentRaffle, setCurrentRaffle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [autoDrawModalOpen, setAutoDrawModalOpen] = useState(false);
  const [autoDrawAmount, setAutoDrawAmount] = useState(null);
  const [autoDrawInput, setAutoDrawInput] = useState("");
  const autoDrawInputRef = useRef();
  const [randomnessStatus, setRandomnessStatus] = useState("");
  const [processingKyc, setProcessingKyc] = useState({});
  const [refreshToken, setRefreshToken] = useState(0);

  const pendingRaffle = raffleHistory.find((raffle) => raffle.status === "pending");

  // Get tooltip text for randomness method
  const getRandomnessMethodTooltip = (method) => {
    switch (method) {
      case 'switchboard-vrf':
        return 'Switchboard VRF: Verifiable Random Function from Switchboard oracle. Uses cryptographically secure randomness from an on-chain oracle (most secure method).';
      case 'blockhash':
        return 'Blockhash: Uses Solana blockchain blockhash for randomness. Verifiable on-chain by checking the blockhash on Solana Explorer.';
      case 'fallback':
        return 'Fallback: Standard random number generator. Used when blockchain-based randomness methods are unavailable.';
      default:
        return 'Randomness method not specified.';
    }
  };

  useEffect(() => {
    const fetchRaffles = async () => {
      // Fetch raffle history
    const historySnap = await getDocs(collection(db, "raffleHistory"));
    const history = historySnap.docs
      .map((docSnap) => {
        const data = docSnap.data();
        const status = data.status || "finalized";
        let inferredKyc = data.kycVerification;
        if (!inferredKyc) {
          inferredKyc =
            status === "finalized" ? "Yes" : status === "rejected" ? "No" : "Pending";
        }
        return {
          id: docSnap.id,
          ...data,
          status,
          kycVerification: inferredKyc,
        };
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    setRaffleHistory(history);
      // Fetch current raffle
      const currentSnap = await getDoc(doc(db, "raffles", "current"));
      if (currentSnap.exists()) {
        setCurrentRaffle(currentSnap.data());
        setAutoDrawAmount(currentSnap.data().autoDrawAmount || null);
      } else {
        setCurrentRaffle(null);
        setAutoDrawAmount(null);
      }
    };
    fetchRaffles();
  }, [running, autoDrawModalOpen, refreshToken]);

  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);

  const openAutoDrawModal = () => {
    setAutoDrawInput(autoDrawAmount ? autoDrawAmount.toString() : "");
    setAutoDrawModalOpen(true);
    setTimeout(() => autoDrawInputRef.current?.focus(), 100);
  };
  const closeAutoDrawModal = () => setAutoDrawModalOpen(false);
  const saveAutoDrawAmount = async () => {
    const amount = parseFloat(autoDrawInput);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid trigger amount.");
      return;
    }
    try {
      await updateDoc(doc(db, "raffles", "current"), {
        autoDrawAmount: amount,
      });
      setAutoDrawAmount(amount);
      setAutoDrawModalOpen(false);
      setError("");
    } catch {
      setError("Failed to save trigger amount.");
    }
  };

  const handleKycDecision = async (drawing, decision) => {
    if (!drawing?.id) return;
    setProcessingKyc((prev) => ({ ...prev, [drawing.id]: true }));
    try {
      const drawingRef = doc(db, "raffleHistory", drawing.id);
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

      if (drawing.prizeWinTransactionPath) {
        try {
          await updateDoc(
            doc(db, ...drawing.prizeWinTransactionPath.split("/")),
            { status: decision === "yes" ? "finalized" : "rejected" },
          );
        } catch (txError) {
          console.warn(
            "[RaffleManagement] Unable to update prize transaction status:",
            txError,
          );
        }
      }

      if (decision === "yes") {
        const raffleRef = doc(db, "raffles", "current");
        const raffleSnap = await getDoc(raffleRef);
        const raffleData = raffleSnap.exists() ? raffleSnap.data() : {};
        const additionalUpdates = {};

        try {
          const prizeAmountLamports = Math.floor(
            Number(drawing.prizePool || 0) * 1e9,
          );
          const verificationResponse = await fetch(
            "/api/record-raffle-verification",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                winnerCoin: drawing.winningCoinNumber,
                prizeAmount: prizeAmountLamports,
                winnerWallet: drawing.solanaWallet || "N/A",
                raffleRound: drawing.raffleNumber || null,
              }),
            },
          );

          if (verificationResponse.ok) {
            const verificationData = await verificationResponse.json();
            additionalUpdates.onChainSignature = verificationData.signature || null;
            additionalUpdates.onChainUrl = verificationData.url || null;
            if (drawing.prizeWinTransactionPath) {
              try {
                await updateDoc(
                  doc(db, ...drawing.prizeWinTransactionPath.split("/")),
                  {
                    status: "finalized",
                    solanaTransactionSignature: verificationData.signature || null,
                  },
                );
              } catch (txError) {
                console.warn(
                  "[RaffleManagement] Unable to store prize win signature:",
                  txError,
                );
              }
            }
          } else {
            const errorData = await verificationResponse
              .json()
              .catch(() => ({}));
            console.warn(
              "[RaffleManagement] Raffle verification failed (non-critical):",
              errorData,
            );
          }
        } catch (verificationError) {
          console.warn(
            "[RaffleManagement] Error recording raffle verification:",
            verificationError,
          );
        }

        try {
          const remainingPrizePoolLamports = Math.floor(
            Number(raffleData.prizePool || 0) * 1e9,
          );
          await fetch("/api/update-raffle-state", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update_prize_pool",
              amount: remainingPrizePoolLamports,
            }),
          });
        } catch (stateError) {
          console.warn(
            "[RaffleManagement] Failed to update on-chain prize pool during finalization:",
            stateError,
          );
        }

        try {
          const totalEntries =
            Number(raffleData.globalCoinCounter || 1) - 1;
          await fetch("/api/update-raffle-entries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ totalEntries }),
          });
        } catch (entriesError) {
          console.warn(
            "[RaffleManagement] Failed to update on-chain raffle entries during finalization:",
            entriesError,
          );
        }

        if (drawing.eligibleEntryDocId) {
          try {
            await deleteDoc(
              doc(
                db,
                "raffles",
                "current",
                "eligibleCoinNumbers",
                drawing.eligibleEntryDocId,
              ),
            );
          } catch (removalError) {
            console.warn(
              "[RaffleManagement] Unable to remove eligible entry during finalization:",
              removalError,
            );
          }
        }

        if (Object.keys(additionalUpdates).length > 0) {
          await updateDoc(drawingRef, additionalUpdates);
        }
        setRefreshToken((token) => token + 1);
      } else {
        const raffleRef = doc(db, "raffles", "current");
        const currentSnap = await getDoc(raffleRef);
        const currentData = currentSnap.exists() ? currentSnap.data() : {};
        const restoredPrizePool =
          Number(currentData.prizePool || 0) + Number(drawing.prizePool || 0);
        await updateDoc(raffleRef, {
          prizePool: restoredPrizePool,
          lastUpdated: new Date().toISOString(),
        });
        setRefreshToken((token) => token + 1);
        await runRaffleDrawing();
      }
    } catch (kycError) {
      console.error("[RaffleManagement] Error processing KYC decision:", kycError);
      setError(kycError.message);
    } finally {
      setProcessingKyc((prev) => {
        const next = { ...prev };
        delete next[drawing.id];
        return next;
      });
    }
  };

  const runRaffleDrawing = async () => {
    setRunning(true);
    setError("");
    try {
      // Get current raffle data
      const raffleRef = doc(db, "raffles", "current");
      const raffleSnap = await getDoc(raffleRef);
      if (!raffleSnap.exists()) throw new Error("No current raffle found");
      const raffle = raffleSnap.data();
      const triggerAmount = Number(
        raffle.autoDrawAmount ?? autoDrawAmount ?? 0,
      );
      const currentPrizePool = Number(raffle.prizePool || 0);
      const prizeAmount =
        triggerAmount > 0
          ? Math.min(currentPrizePool, triggerAmount)
          : currentPrizePool;

      if (!prizeAmount || prizeAmount <= 0) {
        throw new Error(
          "Prize pool is below the trigger amount. Increase the prize pool or adjust the trigger before drawing.",
        );
      }
      // Use eligibleCoinNumbers from the raffle doc
      const eligibleSnap = await getDocs(
        collection(db, "raffles", "current", "eligibleCoinNumbers"),
      );
      let eligibleEntries = eligibleSnap.docs.map((docSnap) => ({
        ...docSnap.data(),
        _docId: docSnap.id,
      }));
      // Exclude prior winning coin numbers
      // CRITICAL: No limit - we need ALL prior winners to prevent duplicate winners
      // Even if this increases reads, correctness is more important
      const historyQuery = query(
        collection(db, "raffleHistory"),
        orderBy("date", "desc"),
        // Removed limit - must read all winners to prevent duplicates
      );
      const historySnap = await getDocs(historyQuery);
      const historyDocs = historySnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      const hasPendingRaffle = historyDocs.some(
        (doc) => doc.status === "pending",
      );
      if (hasPendingRaffle) {
        throw new Error(
          "A raffle drawing is already pending KYC verification. Please finalize or reject it before running another draw.",
        );
      }
      const priorWinners = new Set(
        historyDocs.map((doc) => doc.winningCoinNumber),
      );
      eligibleEntries = eligibleEntries.filter(
        (entry) => !priorWinners.has(entry.coinNumber),
      );
      if (eligibleEntries.length === 0)
        throw new Error(
          "No eligible raffle entries found (all have previously won)",
        );
      
      // Get on-chain verifiable randomness
      setRandomnessStatus("Requesting verifiable randomness from blockchain...");
      let randomnessResult;
      try {
        const vrfResponse = await fetch('/api/conduct-raffle-with-vrf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eligibleEntries: eligibleEntries.length,
            priorWinners: Array.from(priorWinners),
            totalEntries: raffle.globalCoinCounter || eligibleEntries.length,
          }),
        });
        
        if (!vrfResponse.ok) {
          throw new Error(`VRF request failed: ${vrfResponse.statusText}`);
        }
        
        randomnessResult = await vrfResponse.json();
        setRandomnessStatus(`Using ${randomnessResult.randomnessMethod} for randomness...`);
      } catch (vrfError) {
        console.error('VRF error (falling back to blockhash):', vrfError);
        setRandomnessStatus("VRF unavailable, using blockhash randomness...");
        // Fallback: use blockhash-based randomness
        const blockhashResponse = await fetch('/api/conduct-raffle-with-vrf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eligibleEntries: eligibleEntries.length,
            priorWinners: Array.from(priorWinners),
            totalEntries: raffle.globalCoinCounter || eligibleEntries.length,
            useBlockhash: true, // Force blockhash fallback
          }),
        });
        randomnessResult = await blockhashResponse.json();
      }
      
      // Find winner by coin number from on-chain randomness
      const winner = eligibleEntries.find(
        (entry) => entry.coinNumber === randomnessResult.winnerCoin
      );
      
      if (!winner) {
        throw new Error(
          `Winner coin #${randomnessResult.winnerCoin} not found in eligible entries`
        );
      }
      
      let winnerUserId = winner.userId;
      if (!winnerUserId && winner.coinNumber) {
        try {
          const coinNumbersQuery = query(
            collectionGroup(db, "coinNumbers"),
            where("coinNumber", "==", winner.coinNumber),
            limit(1),
          );
          const coinNumbersSnap = await getDocs(coinNumbersQuery);
          if (!coinNumbersSnap.empty) {
            const pathParts = coinNumbersSnap.docs[0].ref.path.split("/");
            winnerUserId = pathParts[1];
          }
        } catch (coinLookupError) {
          console.warn(
            "[RaffleManagement] Unable to derive winner userId from coin number:",
            coinLookupError,
          );
        }
      }

      let winnerEmail = null;
      if (winnerUserId) {
        try {
          const userSnap = await getDoc(doc(db, "users", winnerUserId));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            winnerEmail =
              userData.email ||
              userData.userProfile?.email ||
              userData.contactEmail ||
              null;
          }
        } catch (userError) {
          console.warn(
            "[RaffleManagement] Unable to fetch winner user profile:",
            userError,
          );
        }
      }

      setRandomnessStatus("");
      
      // Save drawing to history with randomness proof and blockchain verification
      const drawing = {
        date: new Date().toISOString(),
        prizePool: prizeAmount,
        winningCoinNumber: winner.coinNumber,
        solanaWallet: winner.solanaWallet || "N/A",
        randomnessProof: randomnessResult.randomnessProof,
        randomnessMethod: randomnessResult.randomnessMethod,
        vrfAccount: randomnessResult.vrfAccount || null,
        blockhash: randomnessResult.blockhash || null,
        onChainSignature: null,
        onChainUrl: null,
        userId: winnerUserId || null,
        winnerEmail,
        eligibleEntryDocId: winner._docId || null,
        status: "pending",
        kycVerification: "Pending",
        createdAt: serverTimestamp(),
      };
      const drawingRef = await addDoc(collection(db, "raffleHistory"), drawing);
      try {
        const emailResponse = await fetch("/api/send-raffle-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            raffleId: drawingRef.id,
            status: "pending",
            prizePool: prizeAmount,
            winningCoinNumber: winner.coinNumber,
            winnerWallet: winner.solanaWallet || "N/A",
            randomnessMethod: drawing.randomnessMethod,
            triggeredBy: "manual",
          }),
        });
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json().catch(() => ({}));
          console.warn(
            "[RaffleManagement] Failed to send raffle notification email:",
            errorData,
          );
        }
      } catch (emailError) {
        console.warn(
          "[RaffleManagement] Error sending raffle notification email:",
          emailError,
        );
      }
      await updateDoc(raffleRef, {
        prizePool: Math.max(0, currentPrizePool - prizeAmount),
        lastUpdated: new Date().toISOString(),
        globalCoinCounter: raffle.globalCoinCounter,
        // participants field remains unchanged for perpetual entries
      });
      setRefreshToken((token) => token + 1);
      closeModal();
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
      <Link
        to="/admin"
        className="inline-flex items-center text-deep-red-600 hover:text-deep-red-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Admin Dashboard
      </Link>
      <h1 className="text-3xl font-bold mb-8 text-purple-800">
        Raffle Management
      </h1>
      <div className="mb-8 flex items-center justify-between">
        <span className="text-lg font-semibold">Raffle Drawing History</span>
        {/* Removed duplicate View Current Raffle button */}
      </div>
      <div className="mb-6 flex items-center gap-4">
        {autoDrawAmount ? (
          <div className="text-lg font-bold text-blue-800">
            Raffle Trigger Amount:{" "}
            <span className="text-blue-700">{formatCurrency(autoDrawAmount)}</span>
          </div>
        ) : (
          <div className="text-lg text-gray-500">
            No raffle trigger amount set.
          </div>
        )}
        <div className="flex gap-2 ml-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
            onClick={openAutoDrawModal}
          >
            Set Auto-Draw Trigger
          </button>
          {currentRaffle && (
            <button
              className={`font-semibold px-6 py-2 rounded-lg shadow text-white transition-colors ${
                pendingRaffle
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
              onClick={openModal}
              disabled={!!pendingRaffle}
            >
              View Current Raffle
            </button>
          )}
        </div>
      </div>
      {pendingRaffle && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
          A raffle drawing is pending KYC verification. Finalize or reject the current winner before initiating another draw.
        </div>
      )}
      <div className="bg-white rounded-xl shadow-lg overflow-x-auto mb-10">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Drawing Date</th>
              <th className="px-4 py-2">Prize Pool</th>
              <th className="px-4 py-2">Winning Entry #</th>
              <th className="px-4 py-2">Solana Wallet</th>
              <th className="px-4 py-2">Randomness Method</th>
              <th className="px-4 py-2">Verification</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">KYC Verification</th>
            </tr>
          </thead>
          <tbody>
            {raffleHistory.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  No raffle drawings yet.
                </td>
              </tr>
            )}
            {raffleHistory.map((drawing, idx) => (
              <tr key={idx} className="border-b">
                <td className="px-4 py-2">
                  {new Date(drawing.date).toLocaleString()}
                </td>
                <td className="px-4 py-2">
                  {formatCurrency(drawing.prizePool || 0)}
                </td>
                <td className="px-4 py-2">{drawing.winningCoinNumber}</td>
                <td className="px-4 py-2">{drawing.solanaWallet}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-help ${
                      drawing.randomnessMethod === "switchboard-vrf"
                        ? "bg-purple-100 text-purple-800"
                        : drawing.randomnessMethod === "blockhash"
                          ? "bg-blue-100 text-blue-800"
                          : drawing.randomnessMethod === "fallback"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-600"
                    }`}
                    title={getRandomnessMethodTooltip(drawing.randomnessMethod)}
                  >
                    {drawing.randomnessMethod || "N/A"}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {drawing.onChainUrl ? (
                    <a
                      href={drawing.onChainUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      title="Verify on Solana Explorer"
                    >
                      🔗 Verify
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">N/A</span>
                  )}
                </td>
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
      {/* Modal for current raffle */}
      {modalOpen && currentRaffle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">
              Current Raffle
            </h2>
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Prize Pool:</span>
                <span>{formatCurrency(currentRaffle.prizePool || 0)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-semibold">Total Raffle Entries:</span>
                <span>
                  {currentRaffle.globalCoinCounter
                    ? currentRaffle.globalCoinCounter - 1
                    : 0}
                </span>
              </div>
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            {randomnessStatus && (
              <div className="text-blue-600 mb-2 text-sm">{randomnessStatus}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={closeModal}
                disabled={running}
              >
                Cancel
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={runRaffleDrawing}
                disabled={running}
              >
                {running ? "Running..." : "Run Raffle Drawing"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Auto Draw Modal */}
      {autoDrawModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-blue-800 mb-4">
              Set Auto-Draw Trigger Amount
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prize Pool Amount ($)
              </label>
              <input
                ref={autoDrawInputRef}
                type="number"
                min="1"
                step="0.01"
                value={autoDrawInput}
                onChange={(e) => setAutoDrawInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Enter amount (e.g. 100000)"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={closeAutoDrawModal}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                onClick={saveAutoDrawAmount}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
