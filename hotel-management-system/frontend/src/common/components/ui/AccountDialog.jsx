import { useMemo, useState } from "react";
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

const normalizeOrderStatus = (status) => String(status || "").trim().toLowerCase();
const isCancelledOrder = (status) => normalizeOrderStatus(status) === "cancelled";
const isCompletedOrder = (status) => {
  const normalized = normalizeOrderStatus(status);
  return normalized === "delivered" || normalized.includes("ready");
};
const isActiveOrder = (status) => !isCancelledOrder(status) && !isCompletedOrder(status);
const formatVipBookingTime = (booking) => {
  const rawSlots = Array.isArray(booking?.timeSlots) && booking.timeSlots.length > 0
    ? booking.timeSlots
    : String(booking?.time || "").includes("|")
      ? String(booking.time || "").split("|")
      : [booking?.time];
  const slots = rawSlots.map((value) => String(value || "").trim()).filter(Boolean);
  if (slots.length === 0) return String(booking?.time || "").trim();

  const first = slots[0];
  const last = slots[slots.length - 1];
  if (!first.includes("-")) return first;

  const start = first.split("-")[0].trim();
  const end = last.includes("-") ? last.split("-")[1].trim() : last;
  return slots.length > 1 ? `${start} - ${end} (${slots.length} slots)` : `${start} - ${end}`;
};

function AccountDialog({
  open,
  onClose,
  isAdmin,
  displayName,
  email,
  authProvider,
  googleSub,
  avatarUrl,
  googleName,
  phone,
  address,
  streetAddress1 = "",
  streetAddress2 = "",
  cityTown = "",
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
  const normalizedProvider = String(authProvider || "").trim().toLowerCase();
  const isGoogleUser = !isAdmin && normalizedProvider === "google";
  const safeAvatarUrl = isGoogleUser && String(avatarUrl || "").trim() ? String(avatarUrl || "").trim() : "";
  const [activeSection, setActiveSection] = useState("profile");
  const [ordersFilter, setOrdersFilter] = useState("active");
  const [notice, setNotice] = useState({ message: "", severity: "success" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [cancelingBookingId, setCancelingBookingId] = useState("");
  const defaultProfileForm = useMemo(
    () => ({
      fullName: displayName || "",
      phone: phone || "",
      streetAddress1: streetAddress1 || "",
      streetAddress2: streetAddress2 || "",
      cityTown: cityTown || "",
    }),
    [displayName, phone, streetAddress1, streetAddress2, cityTown]
  );
  const [profileForm, setProfileForm] = useState({
    fullName: displayName || "",
    phone: phone || "",
    streetAddress1: streetAddress1 || "",
    streetAddress2: streetAddress2 || "",
    cityTown: cityTown || "",
  });
  const sortedOrders = useMemo(
    () => [...userOrders].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [userOrders]
  );
  const normalizedOrders = useMemo(
    () =>
      sortedOrders.map((order) => ({
        ...order,
        status: order.status || "Pending",
        quantity: order.quantity || 1,
      })),
    [sortedOrders]
  );
  const activeOrders = useMemo(() => normalizedOrders.filter((order) => isActiveOrder(order.status)), [normalizedOrders]);
  const completedOrders = useMemo(
    () => normalizedOrders.filter((order) => isCompletedOrder(order.status)),
    [normalizedOrders]
  );
  const cancelledOrders = useMemo(
    () => normalizedOrders.filter((order) => isCancelledOrder(order.status)),
    [normalizedOrders]
  );
  const visibleOrders =
    ordersFilter === "completed"
      ? completedOrders
      : ordersFilter === "cancelled"
        ? cancelledOrders
        : activeOrders;
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
  const normalizeBookingStatus = (status) => String(status || "Pending").trim().toLowerCase();
  const canCancelBooking = (booking) => normalizeBookingStatus(booking?.status) === "pending";
  const handleDialogClose = () => {
    setActiveSection("profile");
    setOrdersFilter("active");
    setIsEditingProfile(false);
    setNotice({ message: "", severity: "success" });
    setProfileForm(defaultProfileForm);
    onClose?.();
  };

  const handleSaveProfile = async () => {
    try {
      const result = await onSaveProfile?.({
        fullName: profileForm.fullName,
        phone: profileForm.phone,
        streetAddress1: profileForm.streetAddress1,
        streetAddress2: profileForm.streetAddress2,
        cityTown: profileForm.cityTown,
      });
      setNotice({
        message: result?.message || "Unable to update profile.",
        severity: result?.success ? "success" : "error",
      });
      if (result?.success) {
        setIsEditingProfile(false);
      }
    } catch {
      setNotice({ message: "Unable to update profile.", severity: "error" });
    }
  };

  return (
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: { xs: "92vw", sm: 920, md: 980 },
            maxWidth: "96vw",
            height: { xs: "auto", md: 600 },
            maxHeight: { xs: "92vh", md: "84vh" },
            bgcolor: "#090d13",
            borderRadius: 4,
            border: "1px solid rgba(212,178,95,0.22)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3.5, py: 2.6, bgcolor: "#140f11" }}>
        <Typography variant="h3" sx={{ fontSize: "24px" }}>My Account</Typography>
        <Button onClick={onClose} sx={{ minWidth: 36, width: 36, height: 36, color: "text.secondary" }}>
          <CloseRoundedIcon />
        </Button>
      </Stack>

      <Box
        sx={{
          p: 3.2,
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "grid",
          gap: 0,
          gridTemplateColumns: { xs: "1fr", md: "240px 1px minmax(0, 1fr)" },
        }}
      >
        <Box sx={{ pr: { xs: 0, md: 2.2 }, mb: { xs: 2.2, md: 0 } }}>
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

        <Box
          sx={{
            display: { xs: "none", md: "block" },
            bgcolor: "rgba(212,178,95,0.14)",
            borderRadius: 99,
          }}
        />

        <Stack spacing={2} sx={{ pl: { xs: 0, md: 2.2 } }}>
          {notice.message && (
            <Alert severity={notice.severity} onClose={() => setNotice({ message: "", severity: "success" })}>
              {notice.message}
            </Alert>
          )}
          {activeSection === "profile" && (
            <>
              <Stack direction="row" spacing={2.2} alignItems="center">
                <Avatar
                  src={safeAvatarUrl || undefined}
                  imgProps={{ referrerPolicy: "no-referrer" }}
                  sx={{ width: 74, height: 74, bgcolor: "primary.main", color: "#100d07", fontSize: 36, fontWeight: 800 }}
                >
                  {initial}
                </Avatar>
                <Box>
                  <Typography variant="h2" sx={{ fontSize: { xs: "30px", md: "36px" }, lineHeight: 1.1 }}>{displayName}</Typography>
                  <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontSize: 13, letterSpacing: 0.8 }}>
                    {isAdmin ? "Admin Member" : "User Member"}
                  </Typography>
                  {!isAdmin && (
                    <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.6 }}>
                      Login: {isGoogleUser ? "Google" : "Email/Password"}
                      {isGoogleUser && String(googleName || "").trim() ? ` • ${String(googleName || "").trim()}` : ""}
                      {isGoogleUser && String(googleSub || "").trim() ? ` • Google ID: ${String(googleSub || "").trim()}` : ""}
                    </Typography>
                  )}
                </Box>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.4,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gridTemplateAreas: {
                    xs: `"points" "email" "phone" "address"`,
                    sm: `"points email" "phone address"`,
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
                  {!isAdmin && isGoogleUser && String(googleSub || "").trim() && (
                    <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.8, wordBreak: "break-word" }}>
                      Google ID: {String(googleSub || "").trim()}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ gridArea: "phone", p: 2.1, minHeight: 86, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
                  <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700, mb: 0.5 }}>PHONE</Typography>
                  <Typography variant="h3" sx={{ fontSize: "22px", lineHeight: 1.2 }}>{phone}</Typography>
                </Box>
                <Box sx={{ gridArea: "address", p: 2.1, minHeight: 86, borderRadius: 3, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
                  <Typography sx={{ color: "primary.main", fontSize: 13, fontWeight: 700, mb: 0.5 }}>ADDRESS</Typography>
                  <Typography sx={{ color: "text.primary", fontWeight: 700, wordBreak: "break-word" }}>
                    {String(address || "").trim() || "—"}
                  </Typography>
                </Box>
              </Box>
              {!isAdmin && (
                <Box sx={{ mt: 1 }}>
                  {!isEditingProfile ? (
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setProfileForm(defaultProfileForm);
                        setIsEditingProfile(true);
                      }}
                    >
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
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <TextField
                          label="Street address"
                          size="small"
                          value={profileForm.streetAddress1}
                          onChange={(event) =>
                            setProfileForm((current) => ({ ...current, streetAddress1: event.target.value }))
                          }
                          fullWidth
                        />
                        <TextField
                          label="Apt / Suite (optional)"
                          size="small"
                          value={profileForm.streetAddress2}
                          onChange={(event) =>
                            setProfileForm((current) => ({ ...current, streetAddress2: event.target.value }))
                          }
                          fullWidth
                        />
                      </Stack>
                      <TextField
                        label="Town / City"
                        size="small"
                        value={profileForm.cityTown}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, cityTown: event.target.value }))
                        }
                      />
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" onClick={handleSaveProfile}>
                          Save
                        </Button>
                        <Button
                          variant="text"
                          onClick={() => {
                            setProfileForm(defaultProfileForm);
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
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Button
                  size="small"
                  variant={ordersFilter === "active" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setOrdersFilter("active")}
                >
                  Active ({activeOrders.length})
                </Button>
                <Button
                  size="small"
                  variant={ordersFilter === "completed" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setOrdersFilter("completed")}
                >
                  Completed ({completedOrders.length})
                </Button>
                <Button
                  size="small"
                  variant={ordersFilter === "cancelled" ? "contained" : "outlined"}
                  color="primary"
                  onClick={() => setOrdersFilter("cancelled")}
                >
                  Cancelled ({cancelledOrders.length})
                </Button>
              </Stack>

              {normalizedOrders.length === 0 && <Typography sx={{ color: "text.secondary" }}>No orders yet.</Typography>}
              {visibleOrders.slice(0, 8).map((order) => (
                <Box key={order.id} sx={{ p: 1.4, borderRadius: 2.5, bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.14)" }}>
                  <Typography sx={{ fontWeight: 700 }}>{order.itemName} ({order.quantity}x)</Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                    {order.price} • {order.status || "Pending"}
                  </Typography>
                  {!!String(order.orderRef || "").trim() && (
                    <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.4 }}>
                      {String(order.orderRef || "").trim()}
                    </Typography>
                  )}
                  {isCancelledOrder(order.status) && String(order.cancelReason || "").trim() && (
                    <Typography sx={{ color: "#ff7a84", fontSize: 14, mt: 0.5 }}>
                      Cancellation reason: {order.cancelReason}
                    </Typography>
                  )}
                </Box>
              ))}
              {visibleOrders.length === 0 && normalizedOrders.length > 0 && (
                <Typography sx={{ color: "text.secondary" }}>No {ordersFilter} orders found.</Typography>
              )}
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
                        {booking.date} {formatVipBookingTime(booking)} • {booking.status || "Pending"}
                      </Typography>
                      {!!String(booking.id || "").trim() && (
                        <Typography sx={{ color: "text.secondary", fontSize: 12, mt: 0.4 }}>
                          #{String(booking.id || "").trim().slice(0, 4)}
                        </Typography>
                      )}
                      {normalizeOrderStatus(booking.status) === "cancelled" && String(booking.cancelReason || "").trim() && (
                        <Typography sx={{ color: "#ff9aa0", fontSize: 13, mt: 0.4 }}>
                          Cancellation reason: {booking.cancelReason}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      disabled={!canCancelBooking(booking) || Boolean(cancelingBookingId)}
                      onClick={async () => {
                        const bookingId = String(booking.id || "").trim();
                        if (!bookingId || cancelingBookingId) return;

                        try {
                          setCancelingBookingId(bookingId);
                          const result = await onCancelBooking?.(bookingId);
                          setNotice({
                            message: result?.message || "Unable to cancel booking.",
                            severity: result?.success ? "success" : "error",
                          });
                        } finally {
                          setCancelingBookingId("");
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </Stack>
                </Box>
              ))}
              <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                You can cancel only before admin approval and at least 3 hours before the booking time.
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Dialog>
  );
}

export default AccountDialog;
