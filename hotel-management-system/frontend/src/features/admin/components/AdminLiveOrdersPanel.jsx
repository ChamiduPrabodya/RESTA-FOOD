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

const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Prepared (Ready)",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const isActiveOrder = (status) => !["Prepared (Ready)", "Delivered", "Cancelled"].includes(status);
const isCompletedOrder = (status) => ["Prepared (Ready)", "Delivered"].includes(status);
const isCancelledOrder = (status) => status === "Cancelled";

function AdminLiveOrdersPanel({ purchases, updatePurchaseStatus }) {
  const [liveOrdersFilter, setLiveOrdersFilter] = useState("active");
  const [cancelDialog, setCancelDialog] = useState({ open: false, orderId: "", reason: "" });
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });

  const normalizedPurchases = purchases.map((purchase) => ({
    ...purchase,
    status: purchase.status || "Pending",
    size: purchase.size || "Small",
    quantity: purchase.quantity || 1,
  }));

  const activeOrders = normalizedPurchases.filter((purchase) => isActiveOrder(purchase.status));
  const completedOrders = normalizedPurchases.filter((purchase) => isCompletedOrder(purchase.status));
  const cancelledOrders = normalizedPurchases.filter((purchase) => isCancelledOrder(purchase.status));
  const visibleOrders =
    liveOrdersFilter === "completed"
      ? completedOrders
      : liveOrdersFilter === "cancelled"
        ? cancelledOrders
        : activeOrders;
  const closeCancelDialog = () => setCancelDialog({ open: false, orderId: "", reason: "" });
  const handleStatusChange = (orderId, nextStatus) => {
    if (nextStatus === "Cancelled") {
      setCancelDialog({ open: true, orderId, reason: "" });
      return;
    }
    const result = updatePurchaseStatus(orderId, nextStatus);
    if (!result.success) {
      setNotice({ open: true, message: result.message || "Unable to update order status.", severity: "error" });
      return;
    }
    setNotice({ open: true, message: "Order status updated.", severity: "success" });
  };
  const confirmCancelWithReason = () => {
    const result = updatePurchaseStatus(cancelDialog.orderId, "Cancelled", cancelDialog.reason);
    if (!result.success) {
      setNotice({ open: true, message: result.message || "Unable to cancel order.", severity: "error" });
      return;
    }
    setNotice({ open: true, message: "Order cancelled with reason.", severity: "success" });
    closeCancelDialog();
  };

  return (
    <Box sx={{ display: "grid", gap: 1.8, alignContent: "start" }}>
      <Typography variant="h2" sx={{ fontSize: { xs: "22px", md: "24px" } }}>
        Live Kitchen Queue
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
        <Button
          size="small"
          variant={liveOrdersFilter === "active" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setLiveOrdersFilter("active")}
          sx={{ minWidth: 132, height: 36, px: 2, flex: "0 0 auto", whiteSpace: "nowrap" }}
        >
          Active ({activeOrders.length})
        </Button>
        <Button
          size="small"
          variant={liveOrdersFilter === "completed" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setLiveOrdersFilter("completed")}
          sx={{ minWidth: 132, height: 36, px: 2, flex: "0 0 auto", whiteSpace: "nowrap" }}
        >
          Completed ({completedOrders.length})
        </Button>
        <Button
          size="small"
          variant={liveOrdersFilter === "cancelled" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setLiveOrdersFilter("cancelled")}
          sx={{ minWidth: 132, height: 36, px: 2, flex: "0 0 auto", whiteSpace: "nowrap" }}
        >
          Cancelled ({cancelledOrders.length})
        </Button>
      </Stack>

      {visibleOrders.map((purchase, index) => (
        <Card key={purchase.id} sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Typography variant="h3" sx={{ fontSize: { xs: "20px", md: "22px" } }}>
                  ORD-{3046 + index}
                </Typography>
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.78rem" }}>
                  Delivery
                </Typography>
              </Box>
              <Select
                size="small"
                value={purchase.status}
                onChange={(event) => handleStatusChange(purchase.id, event.target.value)}
                sx={{
                  minWidth: 180,
                  borderRadius: 99,
                  bgcolor: "#080c12",
                  color: "primary.main",
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(212,178,95,0.7)" },
                  "& .MuiSelect-icon": { color: "primary.main" },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      bgcolor: "#080c12",
                      border: "1px solid rgba(212,178,95,0.35)",
                      color: "primary.main",
                    },
                  },
                }}
              >
                {ORDER_STATUSES.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Box sx={{ mt: 2.2, p: 2.2, borderRadius: 2.5, border: "1px solid rgba(212,178,95,0.12)", bgcolor: "#120d0c" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h3" sx={{ fontSize: { xs: "18px", md: "20px" }, lineHeight: 1.2 }}>
                    {purchase.quantity}x {purchase.itemName}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.78rem" }}>
                    {purchase.size}
                  </Typography>
                </Box>
                <Typography sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.9rem" }}>{purchase.price}</Typography>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: "rgba(212,178,95,0.12)", my: 2.3 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, fontSize: "0.78rem" }}>
                Grand Total
              </Typography>
              <Typography variant="h2" sx={{ color: "primary.main", fontSize: { xs: "24px", md: "26px" } }}>
                {purchase.price}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
      ))}

      {visibleOrders.length === 0 && (
        <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
              No {liveOrdersFilter} orders found.
            </Typography>
          </CardContent>
        </Card>
      )}
      <Dialog
        open={cancelDialog.open}
        onClose={closeCancelDialog}
        PaperProps={{ sx: { bgcolor: "#0f1116", border: "1px solid rgba(212,178,95,0.2)", color: "text.primary" } }}
      >
        <DialogTitle>Cancel Order</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", mb: 1 }}>Please provide a reason for cancellation.</Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            value={cancelDialog.reason}
            onChange={(event) =>
              setCancelDialog((current) => ({ ...current, reason: event.target.value }))
            }
            placeholder="Reason for cancelling this order..."
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#07090d", borderRadius: 2.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.2, pb: 1.8 }}>
          <Button onClick={closeCancelDialog} color="inherit">Close</Button>
          <Button variant="contained" color="error" onClick={confirmCancelWithReason}>
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

export default AdminLiveOrdersPanel;
