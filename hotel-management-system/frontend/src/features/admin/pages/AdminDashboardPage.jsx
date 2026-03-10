import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import QrCode2OutlinedIcon from "@mui/icons-material/QrCode2Outlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import AuthHeaderActions from "../../../common/components/ui/AuthHeaderActions";
import { useAuth } from "../../auth/context/AuthContext";
import AdminBookingsPanel from "../components/AdminBookingsPanel";
import AdminLiveOrdersPanel from "../components/AdminLiveOrdersPanel";
import AdminCustomersPanel from "../components/AdminCustomersPanel";
import AdminQrSystemPanel from "../components/AdminQrSystemPanel";
import AdminFeedbackPanel from "../components/AdminFeedbackPanel";
import AdminPromotionsPanel from "../components/AdminPromotionsPanel";
import AdminMenuManagementPanel from "../components/AdminMenuManagementPanel";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };

const getPriceNumber = (price) => Number(String(price).replace(/[^\d.]/g, "")) || 0;
const isActiveOrder = (status) => !["Prepared (Ready)", "Delivered", "Cancelled"].includes(status);

function StatCard({ title, value, icon, iconColor = "primary.main" }) {
  return (
    <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
      <CardContent sx={{ p: 2.8 }}>
        <Box
          sx={{
            width: 54,
            height: 54,
            borderRadius: 2.3,
            bgcolor: "rgba(212,178,95,0.1)",
            display: "grid",
            placeItems: "center",
            mb: 1.8,
          }}
        >
          <Box sx={{ color: iconColor }}>{icon}</Box>
        </Box>
        <Stack spacing={0.5}>
          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "30px", md: "34px" } }}>
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SideItem({ icon, label, active = false, badge, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.2,
        px: 2.2,
        py: 1.45,
        borderRadius: 2.8,
        bgcolor: active ? "primary.main" : "transparent",
        color: active ? "#0e0f11" : "text.secondary",
        fontWeight: active ? 700 : 600,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <Stack direction="row" spacing={1.2} alignItems="center">
        {icon}
        <Typography sx={{ fontWeight: "inherit", color: "inherit" }}>{label}</Typography>
      </Stack>
      {badge > 0 && (
        <Box
          sx={{
            minWidth: 22,
            height: 22,
            borderRadius: 99,
            px: 0.8,
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            bgcolor: "#ff2f4f",
          }}
        >
          {badge}
        </Box>
      )}
    </Box>
  );
}

function AdminDashboardPage() {
  const {
    purchases,
    vipBookings,
    users,
    feedbacks,
    promotions,
    menuItems,
    menuCategories,
    updatePurchaseStatus,
    updateVipBookingStatus,
    addPromotion,
    togglePromotionStatus,
    addMenuItem,
    addMenuCategory,
    updateMenuCategory,
    deleteMenuCategory,
    updateMenuItem,
    deleteMenuItem,
  } = useAuth();
  const [activeSection, setActiveSection] = useState("dashboard");

  const normalizedPurchases = purchases.map((purchase) => ({
    ...purchase,
    status: purchase.status || "Pending",
    size: purchase.size || "Small",
    quantity: purchase.quantity || 1,
  }));

  const totalSales = normalizedPurchases.reduce((sum, purchase) => sum + getPriceNumber(purchase.price), 0);
  const activeOrders = normalizedPurchases.filter((purchase) => isActiveOrder(purchase.status));
  const pendingBookingsCount = vipBookings.filter((item) => String(item.status || "Pending") === "Pending").length;
  const feedbackCount = feedbacks.length;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <Box sx={{ px: sectionPaddingX, borderBottom: "1px solid rgba(212,178,95,0.2)", bgcolor: "rgba(7,9,13,0.92)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 23, color: "primary.main" }}>RESTA FAST FOOD</Typography>
          <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <HomeRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography component={Link} to="/" sx={{ color: "text.secondary", fontWeight: 600, textDecoration: "none" }}>
                Home
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <RestaurantMenuRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography component={Link} to="/menu" sx={{ color: "text.secondary", fontWeight: 600, textDecoration: "none" }}>
                Menu
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <MeetingRoomRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography component={Link} to="/vip-rooms" sx={{ color: "text.secondary", fontWeight: 600, textDecoration: "none" }}>
                VIP Rooms
              </Typography>
            </Stack>
          </Stack>
          <AuthHeaderActions />
        </Stack>
      </Box>

      <Box sx={{ px: sectionPaddingX, py: { xs: 3.5, md: 4.5 } }}>
        <Typography variant="h1" sx={{ fontSize: { xs: "34px", md: "44px" }, mb: 2.1 }}>
          Admin Dashboard
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "300px 1fr" }, gap: 2.4 }}>
          <Card
            sx={{
              bgcolor: "#0a0d13",
              border: "1px solid rgba(212,178,95,0.15)",
              borderRadius: 4,
              p: 1.4,
              height: "fit-content",
              minHeight: { lg: "calc(100vh - 190px)" },
              position: { lg: "sticky" },
              top: { lg: 16 },
              alignSelf: "start",
            }}
          >
            <Stack spacing={0.6} sx={{ height: "100%" }}>
              <SideItem
                icon={<GridViewRoundedIcon fontSize="small" />}
                label="Dashboard"
                active={activeSection === "dashboard"}
                onClick={() => setActiveSection("dashboard")}
              />
              <SideItem
                icon={<Inventory2OutlinedIcon fontSize="small" />}
                label="Live Orders"
                active={activeSection === "liveOrders"}
                badge={activeOrders.length}
                onClick={() => setActiveSection("liveOrders")}
              />
              <SideItem
                icon={<RestaurantMenuRoundedIcon fontSize="small" />}
                label="Menu Manage"
                active={activeSection === "menuManagement"}
                badge={menuItems.filter((item) => item.outOfStock).length}
                onClick={() => setActiveSection("menuManagement")}
              />
              <SideItem
                icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                label="Bookings"
                active={activeSection === "bookings"}
                badge={pendingBookingsCount}
                onClick={() => setActiveSection("bookings")}
              />
              <SideItem
                icon={<GroupOutlinedIcon fontSize="small" />}
                label="Customers"
                active={activeSection === "customers"}
                onClick={() => setActiveSection("customers")}
              />
              <SideItem
                icon={<QrCode2OutlinedIcon fontSize="small" />}
                label="QR System"
                active={activeSection === "qrSystem"}
                onClick={() => setActiveSection("qrSystem")}
              />
              <SideItem
                icon={<ChatBubbleOutlineRoundedIcon fontSize="small" />}
                label="Feedback"
                active={activeSection === "feedback"}
                badge={feedbackCount}
                onClick={() => setActiveSection("feedback")}
              />
              <SideItem
                icon={<LocalOfferOutlinedIcon fontSize="small" />}
                label="Promotions"
                active={activeSection === "promotions"}
                badge={promotions.filter((item) => item.active).length}
                onClick={() => setActiveSection("promotions")}
              />
            </Stack>
          </Card>

          {activeSection === "dashboard" && (
            <Box sx={{ display: "grid", gap: 2.2 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
                <StatCard title="Total Sales (SLR)" value={totalSales} icon={<TrendingUpRoundedIcon />} iconColor="#00d084" />
                <StatCard title="Live Orders" value={activeOrders.length} icon={<AccessTimeRoundedIcon />} />
                <StatCard title="Room Bookings" value={vipBookings.length} icon={<CalendarMonthOutlinedIcon />} iconColor="#2f8dff" />
                <StatCard title="Active Ads" value={2} icon={<RestaurantRoundedIcon />} iconColor="#9a6a3f" />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" }, gap: 2 }}>
                <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.8 }}>
                      <Inventory2OutlinedIcon sx={{ color: "primary.main" }} />
                      <Typography variant="h3">Active Orders</Typography>
                    </Stack>
                    <Divider sx={{ borderColor: "rgba(212,178,95,0.12)", mb: 2 }} />
                    <Stack spacing={1.2}>
                      {activeOrders.slice(0, 4).map((purchase) => (
                        <Box key={purchase.id}>
                          <Typography sx={{ fontWeight: 700 }}>{purchase.itemName}</Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {purchase.userEmail} - {purchase.price}
                          </Typography>
                        </Box>
                      ))}
                      {activeOrders.length === 0 && (
                        <Typography sx={{ color: "text.secondary", py: 3.6, textAlign: "center" }}>No pending orders</Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.8 }}>
                      <CalendarMonthOutlinedIcon sx={{ color: "primary.main" }} />
                      <Typography variant="h3">Recent Bookings</Typography>
                    </Stack>
                    <Divider sx={{ borderColor: "rgba(212,178,95,0.12)", mb: 2 }} />
                    <Stack spacing={1.2}>
                      {vipBookings.slice(0, 4).map((booking) => (
                        <Box key={booking.id}>
                          <Typography sx={{ fontWeight: 700 }}>{booking.suiteId}</Typography>
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            {booking.userEmail} - {booking.date} {booking.time}
                          </Typography>
                        </Box>
                      ))}
                      {vipBookings.length === 0 && (
                        <Typography sx={{ color: "text.secondary", py: 3.6, textAlign: "center" }}>No recent bookings</Typography>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}

          {activeSection === "liveOrders" && (
            <AdminLiveOrdersPanel purchases={purchases} updatePurchaseStatus={updatePurchaseStatus} />
          )}
          {activeSection === "menuManagement" && (
            <AdminMenuManagementPanel
              menuItems={menuItems}
              menuCategories={menuCategories}
              addMenuItem={addMenuItem}
              addMenuCategory={addMenuCategory}
              updateMenuCategory={updateMenuCategory}
              deleteMenuCategory={deleteMenuCategory}
              updateMenuItem={updateMenuItem}
              deleteMenuItem={deleteMenuItem}
            />
          )}

          {activeSection === "bookings" && (
            <AdminBookingsPanel
              vipBookings={vipBookings}
              users={users}
              updateVipBookingStatus={updateVipBookingStatus}
            />
          )}

          {activeSection === "customers" && (
            <AdminCustomersPanel users={users} purchases={purchases} />
          )}

          {activeSection === "qrSystem" && <AdminQrSystemPanel />}

          {activeSection === "feedback" && <AdminFeedbackPanel feedbacks={feedbacks} />}

          {activeSection === "promotions" && (
            <AdminPromotionsPanel
              promotions={promotions}
              addPromotion={addPromotion}
              togglePromotionStatus={togglePromotionStatus}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default AdminDashboardPage;
