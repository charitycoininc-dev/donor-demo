import { useEffect, useState } from "react";
import { useAuth } from "../../stores";
import { firebaseService } from "../../stores";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";

export default function Admin() {
  const { user, isAuthenticated, loading } = useAuth();
  const [walletBalance, setWalletBalance] = useState(null);
  const [nonprofitTotals, setNonprofitTotals] = useState([]);
  const [loadingNonprofitTotals, setLoadingNonprofitTotals] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const walletData = await firebaseService.getDocument(
          "settings/nonprofitWallet",
        );
        setWalletBalance(walletData?.balance || 0);
      } catch (error) {
        console.error("Error fetching wallet balance:", error);
        setWalletBalance(0);
      }
    };

    const fetchNonprofitTotals = async () => {
      try {
        setLoadingNonprofitTotals(true);

        // Fetch donations with limit to reduce Firebase reads
        const donations = await firebaseService.queryCollection("donations", {
          orderBy: ["createdAt", "desc"],
          limit: 100, // Limit to 100 most recent donations
        });
        const confirmedDonations = donations.filter(
          (d) => d.status === "confirmed",
        );

        // Fetch nonprofits with limit (should be small collection anyway)
        const nonprofits = await firebaseService.queryCollection("nonprofits", {
          limit: 50, // Limit to 50 nonprofits
        });

        // Calculate totals for each nonprofit
        const totals = nonprofits
          .map((nonprofit) => {
            const nonprofitDonations = confirmedDonations.filter(
              (d) => d.nonprofitId === nonprofit.id,
            );
            const totalDonated = nonprofitDonations.reduce(
              (sum, d) => sum + (d.amount || 0),
              0,
            );
            // Calculate nonprofit amount based on raffle eligibility
            // Raffle-eligible: 50% goes to nonprofit, Non-raffle-eligible: 100% goes to nonprofit
            const nonprofitAmount = nonprofitDonations.reduce((sum, d) => {
              const isRaffleEligible = d.isRaffleEligible !== false; // Default to true for backward compatibility
              return sum + (isRaffleEligible ? d.amount * 0.5 : d.amount);
            }, 0);

            return {
              id: nonprofit.id,
              name: nonprofit.name,
              category: nonprofit.category,
              totalDonated,
              nonprofitAmount,
              donationCount: nonprofitDonations.length,
              active: nonprofit.active,
            };
          })
          .sort((a, b) => b.nonprofitAmount - a.nonprofitAmount); // Sort by amount descending

        setNonprofitTotals(totals);
      } catch (error) {
        console.error("Error fetching nonprofit totals:", error);
        setNonprofitTotals([]);
      } finally {
        setLoadingNonprofitTotals(false);
      }
    };

    fetchBalance();
    fetchNonprofitTotals();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-xl font-bold text-deep-red-800 mb-4">
          Please log in to access the admin dashboard.
        </div>
        <Link to="/login?redirect=/admin" className="text-blue-600 underline">
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 font-bold text-xl">
        Access denied. Admins only.
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-deep-red-800">
        Admin Dashboard
      </h1>
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
        <span className="font-semibold text-blue-900">
          Nonprofit Wallet Balance:
        </span>
        <span className="text-2xl font-bold text-blue-700">
          {walletBalance !== null ? formatCurrency(walletBalance) : "..."}
        </span>
      </div>

      {/* Nonprofit Donation Totals */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-deep-red-800 mb-4">
          Nonprofit Donation Totals
        </h2>
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Shows total amounts donated to each nonprofit. Raffle-eligible donations contribute 50% to the nonprofit, while non-raffle-eligible donations contribute 100%.
            </p>
          </div>

          {loadingNonprofitTotals ? (
            <div className="p-8 text-center text-gray-500">
              Loading nonprofit totals...
            </div>
          ) : nonprofitTotals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No nonprofit donation data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nonprofit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Donated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nonprofit Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donations
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nonprofitTotals.map((nonprofit) => (
                    <tr key={nonprofit.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {nonprofit.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {nonprofit.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">
                          {formatCurrency(nonprofit.totalDonated)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-600">
                          {formatCurrency(nonprofit.nonprofitAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {nonprofit.donationCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            nonprofit.active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {nonprofit.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Summary Stats */}
          {nonprofitTotals.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Total Nonprofits:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {nonprofitTotals.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Active Nonprofits:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {nonprofitTotals.filter((n) => n.active).length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total Donated:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {formatCurrency(
                      nonprofitTotals.reduce((sum, n) => sum + n.totalDonated, 0)
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Total to Nonprofits:</span>
                  <span className="ml-2 font-semibold text-green-600">
                    {formatCurrency(
                      nonprofitTotals.reduce((sum, n) => sum + n.nonprofitAmount, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <Link
          to="/admin/users"
          className="bg-white border-2 border-blue-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <h2 className="text-xl font-bold mb-2 text-blue-800">
            Manage User Profiles
          </h2>
          <p className="text-gray-600">
            View, search, edit, or delete user profiles
          </p>
        </Link>
        <Link
          to="/admin/data"
          className="bg-white border-2 border-red-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <h2 className="text-xl font-bold mb-2 text-red-800">
            Data Management
          </h2>
          <p className="text-gray-600">
            Manage donation transactions and delete all test data
          </p>
        </Link>
        <Link
          to="/admin/raffles"
          className="bg-white border-2 border-purple-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <h2 className="text-xl font-bold mb-2 text-purple-800">
            Raffle Management
          </h2>
          <p className="text-gray-600">
            Manage raffle entries and raffle drawings
          </p>
        </Link>
        <Link
          to="/admin/nonprofits"
          className="bg-white border-2 border-green-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <h2 className="text-xl font-bold mb-2 text-green-800">
            Nonprofit Management
          </h2>
          <p className="text-gray-600">
            Manage the list of nonprofits donors can support
          </p>
        </Link>
        <Link
          to="/admin/transactions"
          className="bg-white border-2 border-orange-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <h2 className="text-xl font-bold mb-2 text-orange-800">
            Transaction Management
          </h2>
          <p className="text-gray-600">
            View and manage all user transactions with sorting and pagination
          </p>
        </Link>
        <Link
          to="/admin/sweepstakes"
          className="bg-white border-2 border-indigo-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <h2 className="text-xl font-bold mb-2 text-indigo-800">
            Sweepstakes Management
          </h2>
          <p className="text-gray-600">
            Manage sweepstakes entries and sweepstakes drawings
          </p>
        </Link>
        <Link
          to="/admin/state-eligibility"
          className="bg-white border-2 border-teal-400 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 text-center"
        >
          <h2 className="text-xl font-bold mb-2 text-teal-800">
            State Eligibility
          </h2>
          <p className="text-gray-600">
            Manage which states are eligible for raffle donations
          </p>
        </Link>
        {/* Add more admin links as needed */}
      </div>
    </div>
  );
}
