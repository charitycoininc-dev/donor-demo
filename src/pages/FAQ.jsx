export default function FAQ() {
  const faqs = [
    {
      question: "Can I choose which nonprofit receives my donation?",
      answer:
        "You may recommend an eligible nonprofit aligned with TBHF's mission. Final grant decisions are made by TBHF to ensure legal and charitable compliance.",
    },
    {
      question: "Are my donations tax-deductible?",
      answer:
        "Yes. Donations to TBHF are tax-deductible to the extent allowed by law.",
    },
    {
      question: "Does TBHF pass my donation directly to another organization?",
      answer:
        "No. TBHF retains control of all donations and makes independent grant decisions.",
    },
    {
      question: "Do Charity Coins have cash or investment value?",
      answer:
        "No. Charity Coins are non-financial recognition and participation tokens. They are not investments and have no cash value.",
    },
    {
      question: "Are Charity Coins raffle entries or prizes?",
      answer:
        "No. Charity Coins are not raffle entries, prizes, or wagers.",
    },
    {
      question: "How does TBHF ensure accountability?",
      answer:
        "TBHF uses a formal grants committee, written agreements, and reporting requirements to ensure funds are used for charitable purposes.",
    },
    {
      question: "Why does TBHF work with a for-profit subsidiary?",
      answer:
        "TBHF uses technology services from its subsidiary at fair market value to support transparency, engagement, and mission delivery while maintaining full legal separation.",
    },
  ];

  return (
    <div className="min-h-screen py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-deep-red-800 mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about The Black History Foundation
            and our Charity Coin program.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
            >
              <h2 className="text-xl font-bold text-deep-red-800 mb-3">
                {faq.question}
              </h2>
              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-deep-red-800 to-deep-red-900 text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-lg mb-6 text-gray-200">
            We're here to help! Reach out to us and we'll get back to you as
            soon as possible.
          </p>
          <a
            href="/contact"
            className="inline-block bg-gold-500 hover:bg-gold-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}

