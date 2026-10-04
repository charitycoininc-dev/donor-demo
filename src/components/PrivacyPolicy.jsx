export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-deep-red-800 mb-6">
        Privacy Policy
      </h1>

      <div className="space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-semibold text-deep-red-700 mb-3">
            Data Collection and Use
          </h2>
          <p className="mb-2">
            We collect and process your personal data only when you provide it
            to us, such as when you:
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>Create an account</li>
            <li>Make a donation</li>
            <li>Participate in raffles</li>
            <li>Update your profile</li>
          </ul>
          <p>
            The data we collect includes your name, email address, phone number,
            and address. This information is used to:
          </p>
          <ul className="list-disc pl-6">
            <li>Process your donations</li>
            <li>Manage your charity coins and raffle entries</li>
            <li>Send you tax receipts</li>
            <li>Communicate about your account and donations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-red-700 mb-3">
            Data Protection
          </h2>
          <p className="mb-4">
            We implement several security measures to protect your personal
            information:
          </p>
          <ul className="list-disc pl-6">
            <li>All data is encrypted in transit and at rest</li>
            <li>Access to personal data is strictly controlled</li>
            <li>Regular security audits and updates</li>
            <li>Secure payment processing</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-red-700 mb-3">
            Your Rights
          </h2>
          <p className="mb-4">
            Under data protection laws, you have the right to:
          </p>
          <ul className="list-disc pl-6">
            <li>Access your personal data</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to data processing</li>
            <li>Data portability</li>
            <li>Withdraw consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-red-700 mb-3">
            Cookies and Tracking
          </h2>
          <p className="mb-4">We use cookies and similar technologies to:</p>
          <ul className="list-disc pl-6">
            <li>Maintain your session</li>
            <li>Remember your preferences</li>
            <li>Analyze site usage</li>
            <li>Improve our services</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-red-700 mb-3">
            Data Sharing
          </h2>
          <p className="mb-4">
            We do not sell your personal data. We may share your information
            with:
          </p>
          <ul className="list-disc pl-6">
            <li>Payment processors for donation processing</li>
            <li>Tax authorities for donation receipts</li>
            <li>Service providers who assist in our operations</li>
          </ul>
          <p className="mt-4">
            All third parties are bound by confidentiality agreements and data
            protection requirements.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-deep-red-700 mb-3">
            Contact Us
          </h2>
          <p>
            For any privacy-related questions or to exercise your rights, please
            contact us at:
            <br />
            <a
              href="mailto:Info@TheBlackHistoryFoundation.org"
              className="text-deep-red-600 hover:text-deep-red-700"
            >
              Info@TheBlackHistoryFoundation.org
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
