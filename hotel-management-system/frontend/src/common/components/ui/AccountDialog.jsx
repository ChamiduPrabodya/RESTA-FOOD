import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  Divider,
  Stack,
  TextField,
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
  userOrders,
  userBookings,
  onCancelBooking,
  onSaveProfile,
}) {
  const initial = displayName?.charAt(0)?.toUpperCase() || "U";
  const [activeSection, setActiveSection] = useState("profile");
  const [notice, setNotice] = useState({ message: "", severity: "success" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: displayName || "", phone: phone || "" });
  const sortedOrders = useMemo(
    () => [...userOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [userOrders]
  );
  const cancelledOrderNotifications = useMemo(
    () =>
      sortedOrders.filter(
        (order) =>
          String(order.status || "").toLowerCase() === "cancelled" &&
          String(order.cancelReason || "").trim()
      ),
    [sortedOrders]
  );
  const sortedBookings = useMemo(
    () => [...userBookings].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [userBookings]
  );
  const canCancelBooking = (booking) => {
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    if (Number.isNaN(bookingDateTime.getTime())) return false;
    if (String(booking.status || "").toLowerCase() === "cancelled") return false;
    return bookingDateTime.getTime() - Date.now() >= 3 * 60 * 60 * 1000;
  };
  useEffect(() => {
    if (!open) {
      setActiveSection("profile");
      setIsEditingProfile(false);
      setNotice({ message: "", severity: "success" });
    }
  }, [open]);

  useEffect(() => {
    setProfileForm({ fullName: displayName || "", phone: phone || "" });
  }, [displayName, phone]);

  const handleSaveProfile = () => {
    const result = onSaveProfile?.({
      fullName: profileForm.fullName,
      phone: profileForm.phone,
    });
    setNotice({
      message: result?.message || "Unable to update profile.",
      severity: result?.success ? "success" : "error",
    });
    if (result?.success) {
      setIsEditingProfile(false);
    }
  };

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
            <Button
              startIcon={<PersonOutlineRoundedIcon />}
              onClick={() => setActiveSection("profile")}
              sx={{ alignSelf: "flex-start", minWidth: 220, justifyContent: "flex-start", py: 1.2, borderRadius: 3, bgcolor: activeSection === "profile" ? "primary.main" : "transparent", color: activeSection === "profile" ? "#120f0a" : "text.secondary", fontWeight: 700 }}
            >
              Profile
            </Button>
            <Button
              startIcon={<HistoryRoundedIcon />}
              onClick={() => setActiveSection("orders")}
              sx={{ alignSelf: "flex-start", minWidth: 220, justifyContent: "flex-start", py: 1.05, borderRadius: 3, bgcolor: activeSection === "orders" ? "primary.main" : "transparent", color: activeSection === "orders" ? "#120f0a" : "text.secondary", fontWeight: activeSection === "orders" ? 700 : 600 }}
            >
              My Orders ({ordersCount})
            </Button>
            <Button
              startIcon={<CalendarMonthRoundedIcon />}
              onClick={() => setActiveSection("bookings")}
              sx={{ alignSelf: "flex-start", minWidth: 220, justifyContent: "flex-start", py: 1.05, borderRadius: 3, bgcolor: activeSection === "bookings" ? "primary.main" : "transparent", color: activeSection === "bookings" ? "#120f0a" : "text.secondary", fontWeight: activeSection === "bookings" ? 700 : 600 }}
            >
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
          {notice.message && (
            <Alert severity={notice.severity} onClose={() => setNotice({ message: "", severity: "success" })}>
              {notice.message}
            </Alert>
          )}
          {activeSection === "profile" && (
            <>
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
              {!isAdmin && (
                <Box sx={{ mt: 1 }}>
                  {!isEditingProfile ? (
                    <Button variant="outlined" onClick={() => setIsEditingProfile(true)}>
                      Edit Profile
                    </Button>
                  ) : (
                    <Stack spacing={1.2}>
                      <TextField
                        label="Full Name"
                        size="small"
                        value={profileForm.fullName}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, fullName: event.target.value }))
                        }
                      />
                      <TextField
                        label="Phone"
                        size="small"
                        value={profileForm.phone}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, phone: event.target.value }))
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" onClick={handleSaveProfile}>
                          Save
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => {
                            setProfileForm({ fullName: displayName || "", phone: phone || "" });
                            setIsEditingProfile(false);
                          }}
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                </Box>
              )}
            </>
          )}

          {activeSection === "orders" && (
            <Box sx={{ display: "grid", gap: 1.1 }}>
              <Typography variant="h3" sx={{ fontSize: "22px" }}>My Orders</Typography>
              {cancelledOrderNotifications.length > 0 && (
                <Alert severity="warning">
                  {cancelledOrderNotifications.length} cancelled order notification(s). Check reason below.
                </Alert>
              )}
              {sortedOrders.length === 0 && <Typography sx={{ color: "text.secondary" }}>No orders yet.</Typography>}
              {sortedOrders.slice(0, 8).map((order) => (
                <Box key={order.id} sx={{ p: 1.4, borderRadius: 2.5, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
                  <Typography sx={{ fontWeight: 700 }}>{order.itemName} ({order.quantity}x)</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                    {order.price} • {order.status || "Pending"}
                  </Typography>
                  {String(order.status || "").toLowerCase() === "cancelled" && String(order.cancelReason || "").trim() && (
                    <Typography sx={{ color: "#ff7a84", fontSize: 14, mt: 0.5 }}>
                      Cancellation reason: {order.cancelReason}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {activeSection === "bookings" && (
            <Box sx={{ display: "grid", gap: 1.1 }}>
              <Typography variant="h3" sx={{ fontSize: "22px" }}>My Bookings</Typography>
              {sortedBookings.length === 0 && <Typography sx={{ color: "text.secondary" }}>No bookings yet.</Typography>}
              {sortedBookings.slice(0, 8).map((booking) => (
                <Box key={booking.id} sx={{ p: 1.4, borderRadius: 2.5, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{String(booking.suiteId || "").toUpperCase()} • {booking.guests} guests</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                        {booking.date} {booking.time} • {booking.status || "Pending"}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      disabled={!canCancelBooking(booking)}
                      onClick={() => {
                        const result = onCancelBooking?.(booking.id);
                        setNotice({
                          message: result?.message || "Unable to cancel booking.",
                          severity: result?.success ? "success" : "error",
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              ))}
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                You can cancel only up to 3 hours before the booking time.
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Dialog>
  );
}

export default AccountDialog;
