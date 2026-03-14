import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "../../features/home/pages/HomePage";
import MenuPage from "../../features/menu/pages/MenuPage";
import VipRoomsPage from "../../features/vip-reservations/pages/VipRoomsPage";
import SignInPage from "../../features/auth/pages/SignInPage";
import SignUpPage from "../../features/auth/pages/SignUpPage";
import AdminDashboardPage from "../../features/admin/pages/AdminDashboardPage";
import CheckoutPage from "../../features/checkout/pages/CheckoutPage";
import ProtectedRoute from "./ProtectedRoute";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/vip-rooms" element={<VipRoomsPage />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute roles={["user"]}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default AppRouter;
