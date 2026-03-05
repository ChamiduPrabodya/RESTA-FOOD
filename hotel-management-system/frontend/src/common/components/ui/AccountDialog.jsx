import { Link } from "react-router-dom";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";

function AccountDialog({
  open,
  onClose,
  isAdmin,
  displayName,
  email,
  phone,
  points,
  onLogout,
  ordersCount,
  bookingsCount,
}) {
  const initial = displayName?.charAt(0)?.toUpperCase() || "U";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          bgcolor: "#090d13",
          borderRadius: 4,
          border: "1px solid rgba(212,178,95,0.22)",
          overflow: "hidden",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3.5, py: 2.6, bgcolor: "#140f11" }}>
        <Typography variant="h3">My Account</Typography>
        <Button onClick={onClose} sx={{ minWidth: 36, width: 36, height: 36, color: "text.secondary" }}>
          <CloseRoundedIcon />
        </Button>
      </Stack>

      <Box sx={{ p: 3.5, display: "grid", gap: 2.8, gridTemplateColumns: { xs: "1fr", md: "0.88fr 1.52fr" } }}>
        <Stack spacing={1.1}>
          <Button startIcon={<PersonOutlineRoundedIcon />} sx={{ justifyContent: "flex-start", py: 1.4, borderRadius: 3, bgcolor: "primary.main", color: "#120f0a", fontWeight: 700 }}>
            Profile
          </Button>
          <Button startIcon={<HistoryRoundedIcon />} sx={{ justifyContent: "flex-start", py: 1.2, color: "text.secondary" }}>
            My Orders ({ordersCount})
          </Button>
          <Button startIcon={<CalendarMonthRoundedIcon />} sx={{ justifyContent: "flex-start", py: 1.2, color: "text.secondary" }}>
            My Bookings ({bookingsCount})
          </Button>
          <Divider sx={{ borderColor: "rgba(212,178,95,0.16)", my: 1.1 }} />
          {isAdmin && (
            <Button component={Link} to="/admin-dashboard" onClick={onClose} startIcon={<GridViewRoundedIcon />} sx={{ justifyContent: "flex-start", py: 1.2, color: "primary.main" }}>
              Admin Panel
            </Button>
          )}
          <Button onClick={onLogout} startIcon={<LogoutRoundedIcon />} sx={{ justifyContent: "flex-start", py: 1.2, color: "#ff5f6d" }}>
            Logout
          </Button>
        </Stack>

        <Stack spacing={2}>
          <Stack direction="row" spacing={2.2} alignItems="center">
            <Avatar sx={{ width: 84, height: 84, bgcolor: "primary.main", color: "#100d07", fontSize: 44, fontWeight: 800 }}>
              {initial}
            </Avatar>
            <Box>
              <Typography variant="h2" sx={{ fontSize: { xs: "36px", md: "48px" } }}>{displayName}</Typography>
              <Typography sx={{ color: "primary.main", textTransform: "uppercase" }}>
                {isAdmin ? "Admin Member" : "User Member"}
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ display: "grid", gap: 1.4, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <Box sx={{ p: 2.1, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box sx={{ width: 40, height: 40, borderRadius: 99, display: "grid", placeItems: "center", bgcolor: "rgba(212,178,95,0.16)" }}>
                  <EmojiEventsOutlinedIcon sx={{ color: "primary.main" }} />
                </Box>
                <Box>
                  <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700 }}>LOYALTY POINTS</Typography>
                  <Typography variant="h3" sx={{ fontSize: "34px" }}>{points} Points</Typography>
                </Box>
              </Stack>
            </Box>
            <Box sx={{ p: 2.1, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
              <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700, mb: 0.5 }}>EMAIL</Typography>
              <Typography variant="h3" sx={{ fontSize: "30px", lineHeight: 1.2 }}>{email}</Typography>
            </Box>
            <Box sx={{ p: 2.1, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
              <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700, mb: 0.5 }}>PHONE</Typography>
              <Typography variant="h3" sx={{ fontSize: "30px", lineHeight: 1.2 }}>{phone}</Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Dialog>
  );
}

export default AccountDialog;
