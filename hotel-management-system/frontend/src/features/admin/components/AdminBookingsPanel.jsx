import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

const normalizeStatus = (status) => String(status || "Pending");
const formatSuite = (suiteId) => {
  if (suiteId === "platinum") return "VIP PLATINUM";
  if (suiteId === "gold") return "VIP GOLD";
  return String(suiteId || "VIP");
};
const formatBookingTime = (booking) => {
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

function AdminBookingsPanel({ vipBookings, users, updateVipBookingStatus }) {
  const [cancelDialog, setCancelDialog] = useState({ open: false, bookingId: "", reason: "" });
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const pending = vipBookings.filter((item) => normalizeStatus(item.status) === "Pending");
  const confirmed = vipBookings.filter((item) => normalizeStatus(item.status) === "Confirmed");
  const cancelled = vipBookings.filter((item) => normalizeStatus(item.status) === "Cancelled");
  const allSortedBookings = [...vipBookings].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const visibleBookings = allSortedBookings.filter((booking) => {
    if (statusFilter === "all") return true;
    return normalizeStatus(booking.status).toLowerCase() === statusFilter;
  });

  const closeCancelDialog = () => setCancelDialog({ open: false, bookingId: "", reason: "" });
  const confirmCancel = async () => {
    const result = await updateVipBookingStatus?.(cancelDialog.bookingId, "Cancelled", cancelDialog.reason);
    if (!result?.success) {
      setNotice({ open: true, message: result?.message || "Unable to cancel booking.", severity: "error" });
      return;
    }
    setNotice({ open: true, message: "Booking cancelled with reason.", severity: "success" });
    closeCancelDialog();
  };

  if (allSortedBookings.length === 0) {
    return (
      <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
            No VIP room bookings yet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1.4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
        <Typography variant="h2" sx={{ fontSize: { xs: "22px", md: "26px" } }}>
          VIP Room Reservations
        </Typography>
        <Stack direction="row" spacing={1.6} flexWrap="wrap" useFlexGap>
          <Typography sx={{ color: "#c49a00", fontSize: "0.9rem" }}>Pending ({pending.length})</Typography>
          <Typography sx={{ color: "#00b15a", fontSize: "0.9rem" }}>Confirmed ({confirmed.length})</Typography>
          <Typography sx={{ color: "#ff4d4f", fontSize: "0.9rem" }}>Cancelled ({cancelled.length})</Typography>
        </Stack>
      </Stack>
      <Select
        size="small"
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        sx={{ width: { xs: "100%", sm: 220 }, bgcolor: "#07090d", borderRadius: 2.5 }}
      >
        <MenuItem value="all">All Bookings ({allSortedBookings.length})</MenuItem>
        <MenuItem value="pending">Pending ({pending.length})</MenuItem>
        <MenuItem value="confirmed">Confirmed ({confirmed.length})</MenuItem>
        <MenuItem value="cancelled">Cancelled ({cancelled.length})</MenuItem>
      </Select>

      <Stack spacing={1.4}>
        {visibleBookings.map((booking) => {
          const customer = users.find((item) => item.email === booking.userEmail);
          const customerName = customer?.fullName || booking.userEmail || "Guest";
          const customerPhone = customer?.phone || "No phone number";
          const bookingStatus = normalizeStatus(booking.status);

          return (
            <Card key={booking.id} sx={{ bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.45)", borderRadius: 4 }}>
              <CardContent sx={{ p: { xs: 2.2, md: 3 } }}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.7fr 0.7fr" }, gap: 2 }}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 1.8 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: "rgba(212,178,95,0.15)",
                          display: "grid",
                          placeItems: "center",
                          color: "primary.main",
                        }}
                      >
                        <CalendarMonthOutlinedIcon />
                      </Box>
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Typography variant="h3" sx={{ fontSize: { xs: "20px", md: "24px" } }}>
                            #{String(booking.id).slice(0, 4)}
                          </Typography>
                          <Box
                            sx={{
                              px: 1.1,
                              py: 0.25,
                              borderRadius: 99,
                              border: "1px solid rgba(212,178,95,0.35)",
                              color: "primary.main",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                            }}
                          >
                            {formatSuite(booking.suiteId)}
                          </Box>
                        </Stack>
                        <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.75rem" }}>
                          Booking Reference
                        </Typography>
                      </Box>
                    </Stack>

                    <Box sx={{ p: 2, borderRadius: 2.5, border: "1px solid rgba(212,178,95,0.14)", mb: 1.6 }}>
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.6 }}>
                        <Box>
                          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.75rem" }}>Date</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{booking.date}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.75rem" }}>Time</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{formatBookingTime(booking)}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.75rem" }}>Guests</Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Groups2RoundedIcon sx={{ color: "primary.main", fontSize: 17 }} />
                            <Typography sx={{ fontWeight: 700 }}>{booking.guests} People</Typography>
                          </Stack>
                        </Box>
                        <Box>
                          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.75rem" }}>Status</Typography>
                          <Box
                            sx={{
                              display: "inline-flex",
                              mt: 0.2,
                              px: 1.1,
                              py: 0.3,
                              borderRadius: 99,
                              border: "1px solid rgba(212,178,95,0.4)",
                              color:
                                bookingStatus === "Confirmed"
                                  ? "#00b15a"
                                  : bookingStatus === "Cancelled"
                                    ? "#ff4d4f"
                                    : "primary.main",
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              textTransform: "uppercase",
                            }}
                          >
                            {bookingStatus}
                          </Box>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ p: 2, borderRadius: 2.5, border: "1px solid rgba(212,178,95,0.14)" }}>
                      <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mb: 1.2 }}>
                        <PersonOutlineRoundedIcon sx={{ color: "primary.main", fontSize: 17 }} />
                        <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.8, fontSize: "0.9rem" }}>
                          Customer Information
                        </Typography>
                      </Stack>
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.4 }}>
                        <Box>
                          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.75rem" }}>Name</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{customerName}</Typography>
                        </Box>
                        <Box>
                          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.75rem" }}>Phone</Typography>
                          <Typography sx={{ fontWeight: 700 }}>{customerPhone}</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box>
                    <Button
                      fullWidth
                      startIcon={<CheckRoundedIcon />}
                      variant="contained"
                      color="success"
                      sx={{ py: 1.2, borderRadius: 3 }}
                      disabled={bookingStatus === "Confirmed"}
                      onClick={async () => {
                        const result = await updateVipBookingStatus?.(booking.id, "Confirmed");
                        setNotice({
                          open: true,
                          message: result?.message || (result?.success ? "Booking approved." : "Unable to approve booking."),
                          severity: result?.success ? "success" : "error",
                        });
                      }}
                    >
                      Approve Booking
                    </Button>
                    <Button
                      fullWidth
                      startIcon={<CloseRoundedIcon />}
                      variant="outlined"
                      color="error"
                      sx={{ py: 1.2, borderRadius: 3, mt: 1.2 }}
                      disabled={bookingStatus === "Cancelled"}
                      onClick={() => setCancelDialog({ open: true, bookingId: booking.id, reason: "" })}
                    >
                      Reject Booking
                    </Button>
                    <Divider sx={{ borderColor: "rgba(212,178,95,0.12)", my: 1.8 }} />
                    <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1.1, fontSize: "0.8rem" }}>
                      Call {customerPhone} to confirm
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Dialog
        open={cancelDialog.open}
        onClose={closeCancelDialog}
        PaperProps={{ sx: { bgcolor: "#0f1116", border: "1px solid rgba(212,178,95,0.2)", color: "text.primary" } }}
      >
        <DialogTitle>Cancel Booking</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", mb: 1 }}>Please provide a reason to send to the customer.</Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            value={cancelDialog.reason}
            onChange={(event) => setCancelDialog((current) => ({ ...current, reason: event.target.value }))}
            placeholder="Reason for cancelling this booking..."
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#07090d", borderRadius: 2.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.2, pb: 1.8 }}>
          <Button onClick={closeCancelDialog} color="inherit">Close</Button>
          <Button variant="contained" color="error" onClick={confirmCancel}>
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notice.open}
        autoHideDuration={2400}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setNotice((current) => ({ ...current, open: false }))} severity={notice.severity} variant="filled">
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminBookingsPanel;
