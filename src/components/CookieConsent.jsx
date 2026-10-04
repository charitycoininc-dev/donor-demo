import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookieConsent");
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allAccepted);
    localStorage.setItem("cookieConsent", JSON.stringify(allAccepted));
    setShowConsent(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookieConsent", JSON.stringify(preferences));
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 z-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-deep-red-800 mb-2">
              Cookie Preferences
            </h3>
            <p className="text-gray-600 mb-4">
              We use cookies to enhance your browsing experience, serve
              personalized content, and analyze our traffic. Please select which
              cookies you&apos;re willing to store on your browser.
            </p>

            <div className="space-y-3 mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="necessary"
                  checked={preferences.necessary}
                  disabled
                  className="h-4 w-4 text-deep-red-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="necessary"
                  className="ml-2 text-sm text-gray-700"
                >
                  Necessary cookies (required)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="analytics"
                  checked={preferences.analytics}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      analytics: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-deep-red-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="analytics"
                  className="ml-2 text-sm text-gray-700"
                >
                  Analytics cookies (help us improve our website)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="marketing"
                  checked={preferences.marketing}
                  onChange={(e) =>
                    setPreferences((prev) => ({
                      ...prev,
                      marketing: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 text-deep-red-600 border-gray-300 rounded"
                />
                <label
                  htmlFor="marketing"
                  className="ml-2 text-sm text-gray-700"
                >
                  Marketing cookies (personalized content)
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleAcceptAll}
                className="bg-deep-red-600 hover:bg-deep-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Accept All
              </button>
              <button
                onClick={handleSavePreferences}
                className="bg-white hover:bg-gray-50 text-deep-red-600 border border-deep-red-600 px-4 py-2 rounded-lg text-sm font-medium"
              >
                Save Preferences
              </button>
            </div>
          </div>

          <button
            onClick={() => setShowConsent(false)}
            className="ml-4 text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
