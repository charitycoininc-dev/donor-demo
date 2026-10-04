import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth, useRaffle } from "../stores";
import { formatCurrency } from "../utils/currency";

export default function Home() {
  const { loading } = useAuth();
  const { currentRaffle, fetchCurrentRaffle, startRaffleListener, stopRaffleListener } = useRaffle();

  // Fetch raffle data on mount and set up real-time listener
  useEffect(() => {
    fetchCurrentRaffle().catch((error) => {
      console.error("[Home] Error fetching raffle:", error);
    });

    startRaffleListener();

    return () => {
      stopRaffleListener();
    };
  }, [fetchCurrentRaffle, startRaffleListener, stopRaffleListener]);

  // Stats data
  const stats = {
    totalRaised: 45680,
    activeMembers: 892,
    totalDonations: 1245,
    impactScore: 98,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-deep-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-deep-red-800 overflow-hidden min-h-[60vh] flex items-center justify-center">
        <div className="w-full">
          <main className="mx-auto max-w-7xl px-4">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl">
                <span className="block">Donate. Earn Charity Coins.</span>
                <span className="block text-gold-400">
                  Coins unlock recognition — and participation in our drawings*
                </span>
              </h1>

              <div className="mt-3 text-base text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl mx-auto md:mt-5 md:text-xl">
                <ol className="list-decimal list-inside space-y-2 text-left">
                  <li>Donate to support The Black History Foundation&apos;s mission and community programs.</li>
                  <li>
                    Earn Charity Coins automatically as symbolic donor recognition and program participation tools.*
                  </li>
                  <li>
                    Nationwide: receive sweepstakes entries. Where permitted by law: eligible donations may also receive 50/50 raffle entries.*
                  </li>
                </ol>

                <p className="mt-4 text-center text-sm text-gray-300">
                  No purchase necessary to enter the sweepstakes. Void where prohibited. 18+. See Official Rules for details.
                </p>

                <p className="mt-4 text-center">
                  <Link
                    to="/rules"
                    className="text-gold-300 underline font-semibold hover:text-white"
                  >
                    See Official Rules &amp; eligibility details.
                  </Link>
                </p>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  to="/donate"
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-deep-red-600 hover:bg-deep-red-700 md:py-4 md:text-lg md:px-10"
                >
                  Donate &amp; Earn Coins
                </Link>
                <Link
                  to="/about"
                  className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-deep-red-700 bg-gold-400 hover:bg-gold-500 md:py-4 md:text-lg md:px-10"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl mx-auto">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Raised</dt>
                <dd className="mt-1 text-3xl font-semibold text-deep-red-600">
                  {formatCurrency(stats.totalRaised)}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Active Members</dt>
                <dd className="mt-1 text-3xl font-semibold text-deep-red-600">
                  {stats.activeMembers.toLocaleString()}
                </dd>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-gray-500 truncate">Total Donations</dt>
                <dd className="mt-1 text-3xl font-semibold text-deep-red-600">
                  {stats.totalDonations.toLocaleString()}
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Raffle / Drawing Status Section */}
      <div className="bg-gradient-to-r from-deep-red-800 to-deep-red-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Current Drawing Status
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Track the current prize pool and participation. Sweepstakes entries are available nationwide; raffle entries are state-restricted and determined under the Official Rules.*
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-gold-400">
                {formatCurrency(currentRaffle?.prizePool || 0)}
              </h3>
              <p className="mt-2 text-gray-300">Prize Pool</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-center">
              <h3 className="text-2xl font-bold text-gold-400">
                {(currentRaffle?.participants || 0).toLocaleString()}
              </h3>
              <p className="mt-2 text-gray-300">Participants</p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/donate"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-deep-red-700 bg-gold-400 hover:bg-gold-500"
            >
              Donate &amp; Receive Charity Coins
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-deep-red-600 font-semibold tracking-wide uppercase">
              Features
            </h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Give With Purpose. Get Recognized.
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Earn Charity Coins when you donate, receive sweepstakes entries nationwide, and—where permitted—raffle entries under the Official Rules.
            </p>

            <div className="mt-6 max-w-3xl mx-auto">
              <div className="bg-gold-50 border border-gold-200 text-gold-900 px-6 py-4 rounded-xl shadow-sm">
                <ol className="list-decimal list-inside space-y-2 text-base md:text-lg">
                  <li>
                    Donate → earn Charity Coins automatically as symbolic donor recognition and program participation tools.*
                  </li>
                  <li>
                    Sweepstakes entries are available nationwide (no purchase necessary entry option is always available).*
                  </li>
                  <li>
                    Where permitted by law, eligible donations may also receive 50/50 raffle entries; otherwise you receive sweepstakes entries (1 per dollar donated).*
                  </li>
                </ol>

                <p className="mt-4 text-base md:text-lg">
                  <Link
                    to="/rules"
                    className="text-deep-red-700 underline font-semibold hover:text-deep-red-900"
                  >
                    See Official Rules &amp; eligibility details.
                  </Link>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10">
            <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {/* Feature 1 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-deep-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Secure Donations</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Make secure donations with our encrypted payment system. Your financial information is always protected.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-deep-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Transparent Impact</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Track how your donations are making a difference with our transparent impact reporting system.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-deep-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Rewards Program</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Earn rewards and recognition for your contributions through our tiered membership program.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-deep-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Community</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Join a community of like-minded individuals committed to making a positive impact in the world.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-deep-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Proof-of-Donation</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Every donation is permanently recorded on the Solana blockchain, providing verifiable proof of your charitable contributions.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-deep-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h6a4 4 0 014 4v4m0 0l-3-3m3 3l-3 3M11 7H5a4 4 0 00-4 4v4m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Mission-Aligned Giving</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Donate to The Black History Foundation and recommend that support to partner nonprofits that share our mission. TBHF receives your contribution and issues grants consistent with its charitable purposes and applicable law.
                  </p>
                </div>
              </div>

              {/* Feature 7 */}
              <div className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-deep-red-500 text-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Charity Coins + Entries*
                  </h3>
                  <p className="mt-2 text-base text-gray-500">
                    Charity Coins recognize your support and help track participation.* Charity Coins are not raffle entries, prizes, or wagers and have no cash value. Entry mechanics depend on your state and the Official Rules.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-deep-red-800 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple, transparent, and mission-first — with entries handled legally by state
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gold-500 text-white rounded-full mb-6">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-4">Donate &amp; Earn Coins</h3>
              <p className="text-gray-600">
                Donate to support TBHF&apos;s programs. You earn Charity Coins automatically as symbolic donor recognition and program participation tools.*
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-6">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-4">Receive Entries*</h3>
              <p className="text-gray-600">
                Sweepstakes entries are available nationwide (no purchase necessary entry option is always available). Where permitted by law, eligible donations may also receive raffle entries.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-deep-red-600 text-white rounded-full mb-6">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-4">Win &amp; Impact</h3>
              <p className="text-gray-600">
                Winners are selected under the Official Rules. Your support helps preserve Black history and fund community work.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* State Eligibility Notice */}
      <div className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl mx-auto">
            <p className="text-sm text-gray-700 leading-relaxed">
              * 50/50 raffles are not allowed in all states. If it is determined that you are in a state that does not allow 50/50 raffles, your donation will be processed as a non-raffle-eligible donation. You will still earn Charity Coins for your donations, but you will not earn raffle entries. You will instead receive sweepstakes entries. Your donation is intended to be tax deductible to the extent allowed by law. Charity Coins are not raffle entries, prizes, or wagers. Charity Coins are issued solely as symbolic donor recognition and program participation tools and have no cash or gambling value.
            </p>
          </div>
        </div>
      </div>

      {/* Variance Power Disclosure */}
      <div className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-4xl mx-auto">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Variance Power Disclosure</strong>
              <br />
              <br />
              The Black History Foundation (&quot;TBHF&quot;) retains full discretion and control over all contributions received. While donors may recommend that funds support particular programs or eligible charitable organizations aligned with TBHF&apos;s mission, all contributions are subject to TBHF&apos;s independent review and approval. TBHF may redirect funds as necessary to ensure compliance with its charitable purposes, applicable law, and IRS requirements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

