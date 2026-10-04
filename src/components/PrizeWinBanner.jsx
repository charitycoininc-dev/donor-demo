import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../utils/currency";

/**
 * PrizeWinBanner - Displays a congratulations banner when a donor wins a raffle
 * 
 * @param {Object} props
 * @param {Object} props.prizeWin - The prize win transaction object
 * @param {Function} props.onDismiss - Callback when banner is dismissed
 * @param {boolean} props.isDismissing - Whether dismissal is in progress
 */
export default function PrizeWinBanner({ prizeWin, onDismiss, isDismissing = false }) {
  const navigate = useNavigate();

  if (!prizeWin) {
    return null;
  }

  return (
    <div className="w-full px-4 py-4 bg-gradient-to-r from-yellow-50 via-white to-yellow-100 border-b-2 border-yellow-400 shadow-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-200 rounded-full shadow flex-shrink-0">
              <Trophy className="h-6 w-6 text-yellow-700" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-extrabold text-yellow-900">
                🎉 Congratulations! You&apos;re a raffle winner!
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Winning Entry #{prizeWin.coinNumber} • Prize Amount{" "}
                <span className="font-semibold">
                  {formatCurrency(prizeWin.amount || 0)}
                </span>
                {prizeWin.status === "pending" && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs font-semibold rounded">
                    Pending Verification
                  </span>
                )}
                {prizeWin.status === "finalized" && (
                  <span className="ml-2 px-2 py-0.5 bg-green-200 text-green-800 text-xs font-semibold rounded">
                    Verified
                  </span>
                )}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {prizeWin.status === "pending" 
                  ? "Your prize is pending verification. View your transaction history to see all the details."
                  : "Your prize is ready. View your transaction history to see all the details."
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                navigate("/wallet");
                // The wallet page will handle showing transactions
                // We navigate and let the page handle tab switching if needed
              }}
              className="px-4 py-2 rounded-lg font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-colors shadow whitespace-nowrap"
            >
              View Transactions
            </button>
            <button
              onClick={onDismiss}
              disabled={isDismissing}
              className={`px-4 py-2 rounded-lg font-semibold border-2 transition-colors whitespace-nowrap ${
                isDismissing
                  ? "border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-yellow-600 text-yellow-700 hover:bg-yellow-600 hover:text-white"
              }`}
            >
              {isDismissing ? "Clearing..." : "Dismiss"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

