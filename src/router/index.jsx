import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../components/AppLayout";
import AdminAddUserComponent from "../components/AdminAddUserComponent";
import Home from "../pages/Home";
import Donate from "../pages/Donate";
import Wallet from "../pages/Wallet";
import About from "../pages/About";
import Contact from "../pages/Contact";
import Raffle from "../pages/Raffle";
import Rules from "../pages/Rules";
import PrivacyPolicy from "../components/PrivacyPolicy";
import FAQ from "../pages/FAQ";
import Admin from "../pages/Admin";
import AdminUsers from "../pages/Admin/UserManagement";
import AdminDataManagement from "../pages/Admin/DataManagement";
import Login from "../pages/Login";
import AdminRaffles from "../pages/Admin/RaffleManagement";
import AdminNonprofits from "../pages/Admin/NonprofitManagement";
import AdminTransactions from "../pages/Admin/TransactionManagement";
import AdminSweepstakes from "../pages/Admin/SweepstakesManagement";
import AdminStateEligibility from "../pages/Admin/StateEligibilityManagement";
import TestPage from "../pages/TestPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/donate",
        element: <Donate />,
      },
      {
        path: "/wallet",
        element: <Wallet />,
      },
      {
        path: "/about",
        element: <About />,
      },
      {
        path: "/contact",
        element: <Contact />,
      },
      {
        path: "/raffle",
        element: <Raffle />,
      },
      {
        path: "/rules",
        element: <Rules />,
      },
      {
        path: "/privacy",
        element: <PrivacyPolicy />,
      },
      {
        path: "/faq",
        element: <FAQ />,
      },
      {
        path: "/admin-add-user",
        element: <AdminAddUserComponent />,
      },
      {
        path: "/admin",
        element: <Admin />,
      },
      {
        path: "/admin/users",
        element: <AdminUsers />,
      },
      {
        path: "/admin/data",
        element: <AdminDataManagement />,
      },
      {
        path: "/admin/raffles",
        element: <AdminRaffles />,
      },
      {
        path: "/admin/nonprofits",
        element: <AdminNonprofits />,
      },
      {
        path: "/admin/transactions",
        element: <AdminTransactions />,
      },
      {
        path: "/admin/sweepstakes",
        element: <AdminSweepstakes />,
      },
      {
        path: "/admin/state-eligibility",
        element: <AdminStateEligibility />,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/test",
        element: <TestPage />,
      },
    ],
  },
]);
