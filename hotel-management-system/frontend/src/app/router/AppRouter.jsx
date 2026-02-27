import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "../../features/home/pages/HomePage";
import MenuPage from "../../features/menu/pages/MenuPage";
import VipRoomsPage from "../../features/vip-reservations/pages/VipRoomsPage";

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/vip-rooms" element={<VipRoomsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
