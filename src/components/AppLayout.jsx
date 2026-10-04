import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import CookieConsent from "./CookieConsent";
import ErrorBoundary from "./ErrorBoundary";
import Notifications from "./Notifications";
import PrizeWinBanner from "./PrizeWinBanner";
import useScrollToTop from "../stores/hooks/useScrollToTop";
import WalletProviderWrapper from "./WalletProviderWrapper";
import useAuthStore from "../stores/authStore";
import { usePrizeWin } from "../stores";

export default function AppLayout() {
  useScrollToTop();
  
  // Global auth initialization - only initialize once at the app level
  const { initializeAuth } = useAuthStore();
  
  // Check for active prize wins to display congratulations banner
  const { activePrizeWin, isDismissing, dismissPrizeWin } = usePrizeWin();
  
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <ErrorBoundary>
      <WalletProviderWrapper>
        <div className="min-h-screen flex flex-col">
          <Header />
          {/* Prize Win Banner - appears on all pages when user wins */}
          {/* Banner is positioned below the fixed header (header is fixed, so we need mt-28) */}
          {activePrizeWin && (
            <div className="mt-28">
              <PrizeWinBanner
                prizeWin={activePrizeWin}
                onDismiss={dismissPrizeWin}
                isDismissing={isDismissing}
              />
            </div>
          )}
          {/* Main content - padding-top accounts for fixed header, and banner pushes it down if visible */}
          <main className={`flex-grow ${activePrizeWin ? 'pt-0' : 'pt-28'}`}>
            <Outlet />
          </main>
          <Footer />
          <CookieConsent />
          <Notifications />
        </div>
      </WalletProviderWrapper>
    </ErrorBoundary>
  );
}
