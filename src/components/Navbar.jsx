import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../stores";

export default function Navbar() {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/charitycoin-metadata/Logo.png"
                  alt="Charity Coin Logo"
                  style={{ height: 40 }}
                  className="mr-3"
                />
                <div className="flex flex-col justify-center">
                  <span className="text-xl font-bold text-orange-600 leading-tight">
                    TBHF
                  </span>
                  <span className="text-sm text-gray-600 -mt-1">
                    Charity Coin
                  </span>
                </div>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-deep-red-500 hover:text-deep-red-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              <Link
                to="/donate"
                className="border-transparent text-gray-500 hover:border-deep-red-500 hover:text-deep-red-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Donate
              </Link>
              <Link
                to="/rules"
                className="border-transparent text-gray-500 hover:border-deep-red-500 hover:text-deep-red-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Rules
              </Link>
              {isAuthenticated && (
                <Link
                  to="/wallet"
                  className="border-transparent text-gray-500 hover:border-deep-red-500 hover:text-deep-red-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  My Wallet
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Welcome, {user?.firstName || user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/donate"
                className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-deep-red-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className="sm:hidden" id="mobile-menu">
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-deep-red-500 hover:text-deep-red-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Home
          </Link>
          <Link
            to="/donate"
            className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-deep-red-500 hover:text-deep-red-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Donate
          </Link>
          <Link
            to="/rules"
            className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-deep-red-500 hover:text-deep-red-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
          >
            Rules
          </Link>
          {isAuthenticated && (
            <Link
              to="/wallet"
              className="border-transparent text-gray-500 hover:bg-gray-50 hover:border-deep-red-500 hover:text-deep-red-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            >
              My Wallet
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isAuthenticated ? (
            <div className="space-y-1">
              <div className="block px-4 py-2 text-base font-medium text-gray-500">
                Welcome, {user?.firstName || user?.email}
              </div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/donate"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
