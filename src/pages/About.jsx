import { Heart, Shield, Book, Target, Globe, Users } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-red-800 mb-6">
            About The Black History Foundation
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Empowering communities through education, support, and innovative
            charitable initiatives. Our Charity Coin program combines modern
            technology with traditional giving to maximize impact.
          </p>
          <a
            href="https://www.tbhfdn.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-2 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg shadow transition-colors duration-200"
          >
            Visit The Black History Foundation Website
          </a>
        </div>

        {/* Mission Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-deep-red-600 to-deep-red-800 text-white rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
                <p className="text-lg leading-relaxed mb-6">
                  To preserve, promote, and celebrate Black history while
                  building stronger communities through education, cultural
                  awareness, and innovative charitable programs that make giving
                  accessible and rewarding for everyone.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Heart className="h-5 w-5 text-gold-300" />
                    <span className="text-gold-200">Community First</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-gold-300" />
                    <span className="text-gold-200">Transparent</span>
                  </div>
                </div>
              </div>
              <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-deep-red-800">
                  Impact by the Numbers (placeholders)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">892</p>
                    <p className="text-sm text-gray-700">Active Members</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">$45K+</p>
                    <p className="text-sm text-gray-700">Funds Raised</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">15</p>
                    <p className="text-sm text-gray-700">Programs Funded</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-sm text-gray-700">Years Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Programs Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-deep-red-800 mb-4">
              Our Programs
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every donation through our Charity Coin program supports these
              vital community initiatives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Book className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-3">
                Educational Scholarships
              </h3>
              <p className="text-gray-600 mb-4">
                Supporting students in their pursuit of higher education with
                financial assistance and mentorship programs.
              </p>
              <div className="text-sm text-blue-600 font-semibold">
                $18,500 awarded this year
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-3">
                Community Outreach
              </h3>
              <p className="text-gray-600 mb-4">
                Organizing events, workshops, and support groups that strengthen
                community bonds and provide resources.
              </p>
              <div className="text-sm text-green-600 font-semibold">
                127 families supported
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-3">
                Cultural Preservation
              </h3>
              <p className="text-gray-600 mb-4">
                Documenting, preserving, and sharing Black history through
                digital archives and cultural exhibitions.
              </p>
              <div className="text-sm text-purple-600 font-semibold">
                5 exhibitions launched
              </div>
            </div>
          </div>
        </section>

        {/* Charity Coin System */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-gold-50 to-gold-100 rounded-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-deep-red-800 mb-4">
                How Charity Coins Work
              </h2>
              <p className="text-lg text-gray-600">
                Our innovative approach to charitable giving makes every
                donation count twice
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-deep-red-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">1</span>
                </div>
                <h3 className="font-bold text-deep-red-800 mb-2">Donate</h3>
                <p className="text-sm text-gray-600">
                  Make a donation to support our programs
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-gold-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">2</span>
                </div>
                <h3 className="font-bold text-deep-red-800 mb-2">Earn Coins</h3>
                <p className="text-sm text-gray-600">
                  Receive charity coins based on your donation
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">3</span>
                </div>
                <h3 className="font-bold text-deep-red-800 mb-2">
                  Enter Raffles
                </h3>
                <p className="text-sm text-gray-600">
                  Coins automatically earn you entries into 50-50 raffles
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold">4</span>
                </div>
                <h3 className="font-bold text-deep-red-800 mb-2">
                  Win & Support
                </h3>
                <p className="text-sm text-gray-600">
                  Possibly win prizes while funding more programs
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-deep-red-800 mb-4">
              Our Values
            </h2>
            <p className="text-lg text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-3">
                Transparency
              </h3>
              <p className="text-gray-600">
                Every donation and transaction is tracked and reported. We
                believe in complete transparency about how funds are used.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-3">
                Community
              </h3>
              <p className="text-gray-600">
                We put community needs first, ensuring our programs directly
                address the challenges faced by those we serve.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-deep-red-800 mb-3">
                Impact
              </h3>
              <p className="text-gray-600">
                Every dollar donated creates measurable positive change in our
                community through carefully designed programs.
              </p>
            </div>
          </div>
        </section>

        {/* Membership Levels Section */}
        <section className="mb-16 bg-gradient-to-r from-gold-50 to-gold-100 py-12 rounded-2xl">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-deep-red-800 mb-4">
                Membership Levels
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our membership program recognizes and celebrates your commitment
                to supporting our mission. As your total donations grow, so does
                your membership level and the impact you make!
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-700">🥉</span>
                </div>
                <h3 className="text-xl font-bold text-deep-red-800 mb-2">
                  Bronze
                </h3>
                <p className="text-gray-600 mb-2">
                  For all members with less than $100 in total donations.
                </p>
                <p className="text-sm text-gray-500">
                  Entry-level recognition for new and growing supporters.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-gray-600">🥈</span>
                </div>
                <h3 className="text-xl font-bold text-deep-red-800 mb-2">
                  Silver
                </h3>
                <p className="text-gray-600 mb-2">
                  For members with $100 or more in total donations.
                </p>
                <p className="text-sm text-gray-500">
                  Demonstrates ongoing commitment to our cause.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-yellow-800">🥇</span>
                </div>
                <h3 className="text-xl font-bold text-deep-red-800 mb-2">
                  Gold
                </h3>
                <p className="text-gray-600 mb-2">
                  For members with $500 or more in total donations.
                </p>
                <p className="text-sm text-gray-500">
                  A mark of significant generosity and support.
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">🏆</span>
                </div>
                <h3 className="text-xl font-bold text-deep-red-800 mb-2">
                  Platinum
                </h3>
                <p className="text-gray-600 mb-2">
                  For members with $1,000 or more in total donations.
                </p>
                <p className="text-sm text-gray-500">
                  Our highest honor for extraordinary commitment and impact.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-deep-red-800 mb-4">
                Leadership Team
              </h2>
              <p className="text-lg text-gray-600">
                Dedicated leaders committed to community empowerment
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Row 1 */}
              <div className="text-center bg-white border-2 border-gold-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <img
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gold-400"
                  src={import.meta.env.BASE_URL + "team/theresa-kennedy.png"}
                  alt="Theresa Kennedy"
                />
                <h3 className="text-xl font-bold text-deep-red-800">
                  Theresa Kennedy
                </h3>
                <p className="text-gold-600 font-semibold mb-2">
                  Director and President
                </p>
                <p className="text-gray-600 text-sm">
                  Theresa brings over 15 years of experience in non-profit
                  leadership and a passion for educational equity.
                </p>
              </div>

              <div className="text-center bg-white border-2 border-gold-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <img
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gold-400"
                  src={import.meta.env.BASE_URL + "team/deborah-sieh.png"}
                  alt="Deborah Sieh"
                />
                <h3 className="text-xl font-bold text-deep-red-800">
                  Deborah Sieh
                </h3>
                <p className="text-gold-600 font-semibold mb-2">
                  Director of Web Development and Treasurer
                </p>
                <p className="text-gray-600 text-sm">
                  Deborah brings expert web development skills, combining
                  creative design with functional precision to build impactful,
                  user-friendly digital experiences.
                </p>
              </div>

              <div className="text-center bg-white border-2 border-gold-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <img
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gold-400"
                  src={import.meta.env.BASE_URL + "team/mike-evans.png"}
                  alt="Michael Evans"
                />
                <h3 className="text-xl font-bold text-deep-red-800">
                  Michael Evans
                </h3>
                <p className="text-gold-600 font-semibold mb-2">
                  Director and Secretary
                </p>
                <p className="text-gray-600 text-sm">
                  Michael ensures organizational integrity and governance while
                  driving strategic initiatives with a strong focus on
                  compliance and operational excellence.
                </p>
              </div>
            </div>

            {/* Row 2 - Centered */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center md:justify-items-center md:max-w-2xl md:mx-auto mt-8">
              <div className="text-center bg-white border-2 border-gold-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <img
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gold-400"
                  src={import.meta.env.BASE_URL + "team/jeff-st-louis.png"}
                  alt="Jeff St-Louis"
                />
                <h3 className="text-xl font-bold text-deep-red-800">
                  Jeff St-Louis
                </h3>
                <p className="text-gold-600 font-semibold mb-2">
                  Director of Technology
                </p>
                <p className="text-gray-600 text-sm">
                  Jeff leverages his expertise in digital infrastructure and
                  innovation to drive cutting-edge tech solutions that support
                  and scale the Foundation&apos;s mission.
                </p>
              </div>

              <div className="text-center bg-white border-2 border-gold-200 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <img
                  className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-gold-400"
                  src={import.meta.env.BASE_URL + "team/jacqui-kennedy.png"}
                  alt="Jacqui Kennedy"
                />
                <h3 className="text-xl font-bold text-deep-red-800">
                  Jacqui Kennedy
                </h3>
                <p className="text-gold-600 font-semibold mb-2">
                  Director of Marketing
                </p>
                <p className="text-gray-600 text-sm">
                  Jacqui has a background in museum curation and specializes in
                  artifact preservation.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section>
          <div className="bg-gradient-to-r from-deep-red-800 to-deep-red-900 text-white rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-3xl font-bold mb-6">Get Involved</h2>
            <p className="text-xl mb-8 text-gray-200">
              Ready to make a difference? Join our community and start creating
              positive change today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/donate"
                className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center justify-center"
              >
                Start Donating
                <Heart className="ml-2 h-5 w-5" />
              </a>
              <Link
                to="/contact"
                className="border-2 border-white hover:bg-white hover:text-deep-red-800 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 inline-flex items-center justify-center"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
