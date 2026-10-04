import {
  Shield,
  Coins,
  Users,
  Calendar,
  CheckCircle,
  AlertTriangle,
  DollarSign,
} from "lucide-react";

export default function Rules() {
  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* AG-safe top banner */}
        <div className="bg-deep-red-800 text-white text-center font-semibold py-4 px-6 rounded-xl mb-8">
          NO DONATION OR PAYMENT NECESSARY TO ENTER OR WIN
          <br />
          A{" "}
          <a
            href="#sweepstakes-amoe"
            className="underline hover:text-gold-300 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2 focus:ring-offset-deep-red-800 rounded"
          >
            free method of entry
          </a>{" "}
          is available and provides the same chances of winning as any other method.
          <br />
          A donation does not increase your chances of winning.
        </div>

        {/* Title + safer subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-deep-red-800 mb-4">
            Charity Coin Program — Official Rules &amp; Eligibility
          </h1>
          <p className="text-xl text-gray-600">
            Support The Black History Foundation (TBHF). Charity Coins may be provided as donor
            recognition. Sweepstakes entries are available with or without a donation. Raffle-style
            promotions are offered only where permitted by law and only when explicitly stated for an
            active promotion.
          </p>
        </div>

        {/* Sponsor */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <Shield className="h-8 w-8 text-deep-red-600 mr-3" />
            <h2 className="text-2xl font-bold text-deep-red-800">Sponsor</h2>
          </div>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700">
              <strong>The Black History Foundation</strong>, a 501(c)(3) nonprofit organization
              incorporated in the State of Wyoming (EIN: <strong>93-2176256</strong>), is the sponsor
              of the Charity Coin donor recognition program and the sweepstakes promotions described
              in these Official Rules.
            </p>
            <p className="text-gray-700">
              <strong>Important:</strong> Charity Coins are donor recognition tokens
              with <strong>no cash value</strong> and <strong>no investment purpose</strong>. Charity
              Coins are <strong>not</strong> wagers, prizes, securities, or raffle entries.
            </p>
          </div>
        </div>

        {/* Eligibility */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-deep-red-800">Eligibility</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Age Requirement</h3>
                <p className="text-gray-600">
                  Open to individuals who are 18 years of age or older at the time of entry.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Wallet (Optional)</h3>
                <p className="text-gray-600">
                  A supported Solana wallet may be used to receive Charity Coins. If you do not have
                  a compatible wallet, a custodial wallet may be created on your behalf. A wallet is
                  <strong> not required</strong> to enter the sweepstakes.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Ineligible Participants</h3>
                <p className="text-gray-600">
                  Members of the Board of Directors and Officers of The Black History Foundation,
                  sponsors (Corporate &amp; Institutional), foundations, and grant providers are
                  ineligible to participate in sweepstakes/raffle drawings.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Legal Restrictions</h3>
                <p className="text-gray-600">
                  Void where prohibited by law. Sweepstakes eligibility may be restricted in certain
                  jurisdictions. Any raffle-style promotion is available only where permitted by law
                  and only when explicitly stated for an active promotion.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How to Participate */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <Coins className="h-8 w-8 text-gold-600 mr-3" />
            <h2 className="text-2xl font-bold text-deep-red-800">How to Participate</h2>
          </div>

          <div className="space-y-4">
            {/* Donor recognition */}
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Support TBHF &amp; Donor Recognition</h3>
                <p className="text-gray-600">
                  Donations may be made to The Black History Foundation via the Charity Coin website.
                  Donors may receive Charity Coins as symbolic donor recognition and a way to reflect
                  ongoing program participation. Charity Coins have <strong>no cash value</strong> and
                  are <strong>not</strong> prizes, wagers, securities, or raffle entries.
                </p>
              </div>
            </div>

            {/* AMOE */}
            <div id="sweepstakes-amoe" className="flex items-start scroll-mt-8">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">
                  Free Method of Entry (Sweepstakes AMOE — Mail-In)
                </h3>
                <p className="text-gray-600">
                  You may enter the sweepstakes without making a donation by mailing a handwritten
                  3&quot; x 5&quot; postcard. Clearly include: your full legal name, mailing address,
                  email address, phone number, and date of birth (or confirmation you are 18+), and the
                  words <strong>&quot;Charity Coin Sweepstakes Entry&quot;</strong>.
                </p>
                <p className="text-gray-600 mt-3">
                  Mail the postcard to:
                </p>
                <p className="text-gray-600 mt-3">
                  <strong>The Black History Foundation</strong>
                  <br />
                  Attn: Charity Coin Sweepstakes Entry
                  <br />
                  1752 E. Ave. J, #214
                  <br />
                  Lancaster, CA 93535
                </p>
                <p className="text-gray-600 mt-3">
                  Postcards must be postmarked by the applicable drawing deadline and received by TBHF
                  within the timeframe stated for the active promotion. Limit one (1) entry per person
                  per drawing period unless otherwise stated. Mechanically reproduced entries are void.
                </p>
                <p className="text-gray-600 mt-3">
                  <strong>Odds of winning are the same regardless of the method of entry.</strong>
                </p>
              </div>
            </div>

            {/* Entries (clean separation) */}
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Sweepstakes Entries</h3>
                <p className="text-gray-600">
                  Sweepstakes entries are available during active promotion periods, subject to these
                  Official Rules. A donation is not required to enter or win and does not increase your
                  chances of winning.
                </p>
                <p className="text-gray-600 mt-2">
                  Unless an active promotion explicitly states otherwise, eligible participants receive
                  <strong> one (1) sweepstakes entry per person per drawing period</strong> via either
                  method of entry (donation or mail-in AMOE).
                </p>
              </div>
            </div>

            {/* Raffle (tighter, non-promissory) */}
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Raffle-Style Promotions (Only Where Permitted)</h3>
                <p className="text-gray-600">
                  From time to time, TBHF may offer raffle-style promotions only in jurisdictions where
                  permitted by law and only when explicitly stated for an active promotion. Raffle-style
                  promotions are separate from sweepstakes and may have additional eligibility rules,
                  disclosures, and restrictions.
                </p>
              </div>
            </div>

            {/* Ongoing participation */}
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Ongoing Participation</h3>
                <p className="text-gray-600">
                  Charity Coins may be used to reflect ongoing program participation. Promotion terms,
                  eligibility, and mechanics may change by state, program period, and applicable law.
                  The terms displayed for an active promotion control.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Drawing Periods */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <Calendar className="h-8 w-8 text-purple-600 mr-3" />
            <h2 className="text-2xl font-bold text-deep-red-800">Drawing Periods</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Sweepstakes Drawings</h3>
                <p className="text-gray-600">
                  Sweepstakes drawings occur on the schedule stated for the active promotion and are
                  governed by these Official Rules. Where a schedule is displayed in-app, that schedule
                  controls.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Program Availability</h3>
                <p className="text-gray-600">
                  Promotions may be modified, paused, or discontinued to ensure compliance with
                  applicable law and program requirements.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prizes */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center mb-6">
            <DollarSign className="h-8 w-8 text-green-600 mr-3" />
            <h2 className="text-2xl font-bold text-deep-red-800">Prizes</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Sweepstakes Prizes</h3>
                <p className="text-gray-600">
                  Sweepstakes prize(s), odds, and winner selection details are stated for each active
                  promotion and governed by these Official Rules. No donation is necessary to enter or
                  win, and donations do not increase chances of winning.
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-orange-500 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-800">Raffle-Style Prizes (If Offered)</h3>
                <p className="text-gray-600">
                  If a raffle-style promotion is offered, prize structure and disclosures will be
                  stated for that specific promotion and will be available only where permitted by law.
                  Additional terms may apply.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-gradient-to-r from-deep-red-600 to-deep-red-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <div className="space-y-2 mb-6">
              <p className="text-deep-red-100">
                <strong>The Black History Foundation</strong>
              </p>
              <p className="text-deep-red-100">EIN: 93-2176256</p>
              <p className="text-deep-red-100">Email: Info@TheBlackHistoryFoundation.org</p>
              <p className="text-deep-red-100">Address: 30 N. Gould St., STE R, Sheridan, WY 82801</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-deep-red-600 hover:bg-gray-100 font-semibold px-6 py-3 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                Contact Us
              </a>
              <a
                href="/donate"
                className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                Support TBHF
              </a>
            </div>

            <p className="mt-6 text-sm text-deep-red-100">
              Charity Coins are issued solely as symbolic donor recognition and program participation tools,
              have no cash value, and are not investments. No donation necessary. Donations do not increase
              chances of winning. Void where prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
