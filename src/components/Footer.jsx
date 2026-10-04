import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-deep-red-800 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              The Black History Foundation
            </h3>
            <div className="flex items-center mt-2">
              <img
                src="/charitycoin-metadata/Logo.png"
                alt="Charity Coin Logo"
                className="w-32 h-auto mr-4 flex-shrink-0"
              />
              <p className="text-gray-300 mb-0">
                Empowering communities through education, support, and
                innovative charitable initiatives.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Quick Links
            </h3>
            <div className="flex flex-row space-x-8 justify-center">
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-300 hover:text-white">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/donate" className="text-gray-300 hover:text-white">
                    Donate
                  </Link>
                </li>
                <li>
                  <Link to="/raffle" className="text-gray-300 hover:text-white">
                    Raffle
                  </Link>
                </li>
                <li>
                  <Link to="/wallet" className="text-gray-300 hover:text-white">
                    My Wallet
                  </Link>
                </li>
              </ul>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-300 hover:text-white">
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-300 hover:text-white"
                  >
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/rules" className="text-gray-300 hover:text-white">
                    Rules
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-300 hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="text-gray-300 hover:text-white">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-300">
              <li>
                Email:{" "}
                <a
                  href="mailto:Info@TheBlackHistoryFoundation.org"
                  className="underline hover:text-white"
                >
                  Info@TheBlackHistoryFoundation.org
                </a>
              </li>
              <li>Phone: (661) 524-6674</li>
              <li>Address: 30 N. Gould St., STE R</li>
              <li>Sheridan, WY 82801</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-700 text-center text-gray-300 text-sm max-w-4xl mx-auto">
          {typeof window !== 'undefined' && window.__FIREBASE_PROJECT_ID && (
            <p className="mb-2 text-xs opacity-70" title="For debugging Firestore permissions">
              Firebase: {window.__FIREBASE_PROJECT_ID}
            </p>
          )}
          <p>
            © The Black History Foundation. The Charity Coin program is operated
            by The Black History Foundation (TBHF), a 501(c)(3) nonprofit
            organization (EIN 93-2176256). Charity Coins are donor recognition
            tokens with no cash value and no investment purpose. No donation or
            payment is necessary to enter or win any sweepstakes, and donations
            do not increase chances of winning. A free method of entry is
            available by mail. Void where prohibited. See{" "}
            <Link to="/rules" className="underline hover:text-white">
              Official Rules
            </Link>{" "}
            for eligibility, entry methods, odds, prize details, and deadlines.
          </p>
        </div>
      </div>
    </footer>
  );
}
