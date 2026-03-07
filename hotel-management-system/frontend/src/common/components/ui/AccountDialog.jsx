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
      maxWidth={false}
      PaperProps={{
        sx: {
          width: { xs: "92vw", sm: 760 },
          maxWidth: "92vw",
          bgcolor: "#090d13",
          borderRadius: 4,
          border: "1px solid rgba(212,178,95,0.22)",
          overflow: "hidden",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3.5, py: 2.6, bgcolor: "#140f11" }}>
        <Typography variant="h3" sx={{ fontSize: "24px" }}>My Account</Typography>
        <Button onClick={onClose} sx={{ minWidth: 36, width: 36, height: 36, color: "text.secondary" }}>
          <CloseRoundedIcon />
        </Button>
      </Stack>

      <Box sx={{ p: 3.2, display: "grid", gap: 0, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
        <Box sx={{ pr: { xs: 0, md: 2.2 }, borderRight: { xs: "none", md: "1px solid rgba(212,178,95,0.14)" }, mb: { xs: 2.2, md: 0 } }}>
          <Stack spacing={1.1}>
            <Button startIcon={<PersonOutlineRoundedIcon />} sx={{ alignSelf: "flex-start", minWidth: 220, justifyContent: "flex-start", py: 1.2, borderRadius: 3, bgcolor: "primary.main", color: "#120f0a", fontWeight: 700 }}>
              Profile
            </Button>
            <Button startIcon={<HistoryRoundedIcon />} sx={{ alignSelf: "flex-start", minWidth: 220, justifyContent: "flex-start", py: 1.05, color: "text.secondary" }}>
              My Orders ({ordersCount})
            </Button>
            <Button startIcon={<CalendarMonthRoundedIcon />} sx={{ alignSelf: "flex-start", minWidth: 220, justifyContent: "flex-start", py: 1.05, color: "text.secondary" }}>
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
        </Box>

        <Stack spacing={2} sx={{ pl: { xs: 0, md: 2.2 } }}>
          <Stack direction="row" spacing={2.2} alignItems="center">
            <Avatar sx={{ width: 74, height: 74, bgcolor: "primary.main", color: "#100d07", fontSize: 36, fontWeight: 800 }}>
              {initial}
            </Avatar>
            <Box>
              <Typography variant="h2" sx={{ fontSize: { xs: "30px", md: "36px" }, lineHeight: 1.1 }}>{displayName}</Typography>
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontSize: 13, letterSpacing: 0.8 }}>
                {isAdmin ? "Admin Member" : "User Member"}
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              display: "grid",
              gap: 1.4,
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gridTemplateAreas: {
                xs: `"points" "email" "phone"`,
                sm: `"points email" "phone phone"`,
              },
            }}
          >
            <Box sx={{ gridArea: "points", p: 2.1, minHeight: 98, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box sx={{ width: 40, height: 40, borderRadius: 99, display: "grid", placeItems: "center", bgcolor: "rgba(212,178,95,0.16)" }}>
                  <EmojiEventsOutlinedIcon sx={{ color: "primary.main" }} />
                </Box>
                <Box>
                  <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700 }}>LOYALTY POINTS</Typography>
                  <Typography variant="h3" sx={{ fontSize: "22px", lineHeight: 1.2 }}>{points} Points</Typography>
                </Box>
              </Stack>
            </Box>
            <Box sx={{ gridArea: "email", p: 2.1, minHeight: 98, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
              <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700, mb: 0.5 }}>EMAIL</Typography>
              <Typography variant="h3" sx={{ fontSize: "22px", lineHeight: 1.2, wordBreak: "break-word" }}>{email}</Typography>
            </Box>
            <Box sx={{ gridArea: "phone", p: 2.1, minHeight: 86, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
              <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700, mb: 0.5 }}>PHONE</Typography>
              <Typography variant="h3" sx={{ fontSize: "22px", lineHeight: 1.2 }}>{phone}</Typography>
            </Box>
          </Box>
        </Stack>
      </Box>
    </Dialog>
  );
}

export default AccountDialog;
