import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../stores";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAuthenticated } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      alert("Error signing out: " + err.message);
    }
  };

  const navigation = [
    { name: "Home", path: "/" },
    { name: "Donate", path: "/donate" },
    { name: "Raffles", path: "/raffle" },
    { name: "My Wallet", path: "/wallet" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
    { name: "Admin", path: "/admin" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white shadow-md border-b-4 border-gold-400 fixed top-0 left-0 w-full z-50">
      {/* DEMO SITE Banner */}
      <div className="bg-red-600 text-white text-center py-2 text-sm font-bold">
        DEMO SITE - NO REAL DATA IS USED
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img
              src="/charitycoin-metadata/Logo.png"
              alt="Charity Coin Logo"
              style={{ height: 40 }}
              className="mr-2"
            />
            <div>
              <h1 className="text-xl font-bold text-deep-red-800">TBHF</h1>
              <p className="text-sm text-gray-600 -mt-1">Charity Coin</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? "text-deep-red-600 border-b-2 border-gold-400"
                    : "text-gray-700 hover:text-deep-red-600 hover:border-b-2 hover:border-gold-200"
                }`}
              >
                {item.name}
              </Link>
            ))}
            {/* Sign In / Sign Out Button */}
            {isAuthenticated ? (
              <button
                onClick={handleSignOut}
                className="ml-6 px-4 py-2 bg-deep-red-600 hover:bg-deep-red-700 text-white font-semibold rounded-lg shadow transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                to="/login"
                className="ml-6 px-4 py-2 bg-deep-red-600 hover:bg-deep-red-700 text-white font-semibold rounded-lg shadow transition-colors"
              >
                Sign In
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-700 hover:text-deep-red-600 hover:bg-gray-100"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-deep-red-600 bg-gold-50"
                      : "text-gray-700 hover:text-deep-red-600 hover:bg-gray-50"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              {/* Mobile Sign In / Sign Out Button */}
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleSignOut();
                  }}
                  className="mt-2 px-4 py-2 bg-deep-red-600 hover:bg-deep-red-700 text-white font-semibold rounded-lg shadow transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="mt-2 px-4 py-2 bg-deep-red-600 hover:bg-deep-red-700 text-white font-semibold rounded-lg shadow transition-colors text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
