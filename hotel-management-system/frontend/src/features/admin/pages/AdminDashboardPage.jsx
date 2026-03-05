import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import { useAuth } from "../../auth/context/AuthContext";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };

function StatCard({ title, value, icon }) {
  return (
    <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.24)" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8 }}>
            {title}
          </Typography>
          <Box sx={{ color: "primary.main" }}>{icon}</Box>
        </Stack>
        <Typography variant="h2" sx={{ fontSize: { xs: "34px", md: "44px" } }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

function AdminDashboardPage() {
  const { users, purchases, vipBookings, logout } = useAuth();

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", color: "text.primary" }}>
      <Box sx={{ px: sectionPaddingX, borderBottom: "1px solid rgba(212,178,95,0.2)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 26, color: "primary.main" }}>
            ADMIN DASHBOARD
          </Typography>
          <Stack direction="row" spacing={1.2}>
            <Button component={Link} to="/" startIcon={<HomeRoundedIcon />} sx={{ color: "text.secondary" }}>
              Home
            </Button>
            <Button
              onClick={logout}
              component={Link}
              to="/sign-in"
              variant="outlined"
              color="primary"
              startIcon={<LogoutRoundedIcon />}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: sectionPaddingX, py: { xs: 4, md: 6 } }}>
        <Typography variant="h1" sx={{ fontSize: { xs: "40px", md: "56px" }, mb: 1.2 }}>
          Overview
        </Typography>
        <Typography sx={{ color: "text.secondary", mb: 3.2 }}>
          Frontend analytics for users, menu purchases, and VIP room bookings.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
          <StatCard title="Registered Users" value={users.length} icon={<GroupRoundedIcon />} />
          <StatCard title="Menu Purchases" value={purchases.length} icon={<RestaurantRoundedIcon />} />
          <StatCard title="VIP Bookings" value={vipBookings.length} icon={<MeetingRoomRoundedIcon />} />
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 2.5 }}>
          <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.24)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ mb: 1.8 }}>Recent Purchases</Typography>
              <Divider sx={{ borderColor: "rgba(212,178,95,0.18)", mb: 1.8 }} />
              <Stack spacing={1.4}>
                {purchases.slice(0, 5).map((purchase) => (
                  <Box key={purchase.id}>
                    <Typography sx={{ fontWeight: 700 }}>{purchase.itemName}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {purchase.userEmail} • {purchase.price}
                    </Typography>
                  </Box>
                ))}
                {purchases.length === 0 && (
                  <Typography sx={{ color: "text.secondary" }}>No purchases yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.24)" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h3" sx={{ mb: 1.8 }}>Recent VIP Bookings</Typography>
              <Divider sx={{ borderColor: "rgba(212,178,95,0.18)", mb: 1.8 }} />
              <Stack spacing={1.4}>
                {vipBookings.slice(0, 5).map((booking) => (
                  <Box key={booking.id}>
                    <Typography sx={{ fontWeight: 700 }}>{booking.suiteId}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {booking.userEmail} • {booking.date} {booking.time} • {booking.guests} guests
                    </Typography>
                  </Box>
                ))}
                {vipBookings.length === 0 && (
                  <Typography sx={{ color: "text.secondary" }}>No VIP bookings yet.</Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminDashboardPage;
