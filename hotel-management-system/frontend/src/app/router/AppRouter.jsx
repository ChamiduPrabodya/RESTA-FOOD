import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import HomePage from "../../features/home/pages/HomePage";
import MenuPage from "../../features/menu/pages/MenuPage";
import VipRoomsPage from "../../features/vip-reservations/pages/VipRoomsPage";
import SignInPage from "../../features/auth/pages/SignInPage";

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
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/vip-rooms" element={<VipRoomsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default AppRouter;
