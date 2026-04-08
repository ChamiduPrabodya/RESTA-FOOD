import { useMemo, useState } from "react";
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

const ITEM_STATUSES = [
  "Pending",
  "Preparing",
  "Prepared (Ready)",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const ORDER_STATUSES = ["Mixed", ...ITEM_STATUSES];

const isCompletedOrder = (status) => ["Prepared (Ready)", "Delivered"].includes(status);
const isCancelledOrder = (status) => status === "Cancelled";

const parsePriceNumber = (value) => Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;
const formatSLR = (value) => `SLR ${Math.round(Number(value) || 0).toLocaleString()}`;
const normalizeStatus = (status) => {
  const text = String(status || "").trim();
  if (!text) return "Pending";
  const lower = text.toLowerCase();
  if (lower === "pending") return "Pending";
  if (lower === "preparing") return "Preparing";
  if (lower === "prepared" || lower === "prepared (ready)" || lower === "ready") return "Prepared (Ready)";
  if (lower === "out for delivery" || lower === "outfordelivery") return "Out for Delivery";
  if (lower === "delivered") return "Delivered";
  if (lower === "cancelled" || lower === "canceled" || lower === "canceled by admin" || lower === "cancelled by admin")
    return "Cancelled";
  return text;
};

const deriveOrderStatus = (items) => {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return "Pending";

  const normalizedStatuses = list.map((item) => normalizeStatus(item.status));
  const unique = [...new Set(normalizedStatuses)];
  if (unique.length === 1) return unique[0] || "Pending";
  return "Mixed";
};

const isOrderCancelled = (items) => {
  const list = Array.isArray(items) ? items : [];
  return list.length > 0 && list.every((item) => isCancelledOrder(normalizeStatus(item.status)));
};

const isOrderCompleted = (items) => {
  const list = Array.isArray(items) ? items : [];
  if (list.length === 0) return false;
  const notCancelled = list.filter((item) => !isCancelledOrder(normalizeStatus(item.status)));
  if (notCancelled.length === 0) return false;
  return notCancelled.every((item) => isCompletedOrder(normalizeStatus(item.status)));
};

function AdminLiveOrdersPanel({ purchases, updateOrderStatus, updatePurchaseStatus }) {
  const [liveOrdersFilter, setLiveOrdersFilter] = useState("active");
  const [cancelDialog, setCancelDialog] = useState({ open: false, targetId: "", mode: "order", reason: "" });
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });

  const orders = useMemo(() => {
    const normalizedPurchases = (Array.isArray(purchases) ? purchases : []).map((purchase) => ({
      ...purchase,
      status: normalizeStatus(purchase.status),
      size: purchase.size || "Small",
      quantity: purchase.quantity || 1,
    }));

      const groups = new Map();
      normalizedPurchases.forEach((purchase) => {
        const orderKey = String(purchase.orderId || purchase.id || "").trim() || String(purchase.id || "");
        const existing = groups.get(orderKey);
        const createdAt = String(purchase.createdAt || "").trim();
        const createdAtTime = createdAt ? new Date(createdAt).getTime() : 0;

        if (!existing) {
          groups.set(orderKey, {
            orderId: orderKey,
            orderRef: purchase.orderRef || "",
            createdAt: purchase.createdAt || "",
            createdAtTime,
            orderType: purchase.orderType || "Delivery",
            paymentMethod: purchase.paymentMethod || "",
            userEmail: purchase.userEmail || "",
          deliveryDetails: purchase.deliveryDetails || null,
          items: [purchase],
        });
        return;
      }

      existing.items.push(purchase);
      if (createdAtTime > existing.createdAtTime) {
        existing.createdAtTime = createdAtTime;
        existing.createdAt = purchase.createdAt || existing.createdAt;
      }
      existing.orderRef = existing.orderRef || purchase.orderRef || "";
      existing.orderType = existing.orderType || purchase.orderType;
      existing.paymentMethod = existing.paymentMethod || purchase.paymentMethod;
      existing.userEmail = existing.userEmail || purchase.userEmail;
      existing.deliveryDetails = existing.deliveryDetails || purchase.deliveryDetails;
    });

    return [...groups.values()]
      .map((order) => {
        const items = order.items.sort((a, b) => String(a.itemName || "").localeCompare(String(b.itemName || "")));
        const status = deriveOrderStatus(items);
        const totalValue =
          items.find((item) => typeof item.orderTotal === "number")?.orderTotal ??
          items.reduce((sum, item) => sum + parsePriceNumber(item.price), 0);
        return {
          ...order,
          items,
          status,
          cancelled: isOrderCancelled(items),
          completed: isOrderCompleted(items),
          totalValue: Number(totalValue) || 0,
        };
      })
      .sort((a, b) => (b.createdAtTime || 0) - (a.createdAtTime || 0));
  }, [purchases]);

  const activeOrders = orders.filter((order) => !order.cancelled && !order.completed);
  const completedOrders = orders.filter((order) => order.completed);
  const cancelledOrders = orders.filter((order) => order.cancelled);
  const visibleOrders =
    liveOrdersFilter === "completed"
      ? completedOrders
      : liveOrdersFilter === "cancelled"
        ? cancelledOrders
        : activeOrders;
  const closeCancelDialog = () => setCancelDialog({ open: false, targetId: "", mode: "order", reason: "" });
  const handleOrderStatusChange = (orderId, nextStatus) => {
    if (nextStatus === "Cancelled") {
      setCancelDialog({ open: true, targetId: orderId, mode: "order", reason: "" });
      return;
    }
    const result = updateOrderStatus(orderId, nextStatus);
    if (!result.success) {
      setNotice({ open: true, message: result.message || "Unable to update order status.", severity: "error" });
      return;
    }
    if (liveOrdersFilter === "cancelled" || liveOrdersFilter === "completed") {
      setLiveOrdersFilter("active");
      setNotice({ open: true, message: "Order status updated (moved to Active).", severity: "success" });
      return;
    }
    setNotice({ open: true, message: "Order status updated.", severity: "success" });
  };
  const handleItemStatusChange = (purchaseId, nextStatus) => {
    if (!updatePurchaseStatus) {
      setNotice({ open: true, message: "Item status updates are not available.", severity: "error" });
      return;
    }
    if (nextStatus === "Cancelled") {
      setCancelDialog({ open: true, targetId: purchaseId, mode: "item", reason: "" });
      return;
    }
    const result = updatePurchaseStatus(purchaseId, nextStatus);
    if (!result.success) {
      setNotice({ open: true, message: result.message || "Unable to update item status.", severity: "error" });
      return;
    }
    if (liveOrdersFilter === "cancelled" || liveOrdersFilter === "completed") {
      setLiveOrdersFilter("active");
      setNotice({ open: true, message: "Item status updated (moved to Active).", severity: "success" });
      return;
    }
    setNotice({ open: true, message: "Item status updated.", severity: "success" });
  };
  const confirmCancelWithReason = () => {
    const result =
      cancelDialog.mode === "item"
        ? updatePurchaseStatus?.(cancelDialog.targetId, "Cancelled", cancelDialog.reason)
        : updateOrderStatus(cancelDialog.targetId, "Cancelled", cancelDialog.reason);
    if (!result.success) {
      setNotice({ open: true, message: result.message || "Unable to cancel order.", severity: "error" });
      return;
    }
    setNotice({
      open: true,
      message: cancelDialog.mode === "item" ? "Item cancelled with reason." : "Order cancelled with reason.",
      severity: "success",
    });
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

      {visibleOrders.map((order, index) => (
        <Card key={order.orderId} sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Typography variant="h3" sx={{ fontSize: { xs: "20px", md: "22px" } }}>
                  {String(order.orderRef || "").trim() || `ORD-${3046 + index}`}
                </Typography>
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontSize: "0.78rem" }}>
                  {String(order.orderType || "Delivery")}
                </Typography>
              </Box>
                <Select
                  size="small"
                  value={order.status}
                  onChange={(event) => handleOrderStatusChange(order.orderId, event.target.value)}
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
                    <MenuItem key={status} value={status} disabled={status === "Mixed"}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
            </Stack>

            <Box sx={{ mt: 2.2, display: "grid", gap: 1, p: 2.2, borderRadius: 2.5, border: "1px solid rgba(212,178,95,0.12)", bgcolor: "#120d0c" }}>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="center" gap={2}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h3" sx={{ fontSize: { xs: "16px", md: "18px" }, lineHeight: 1.2 }} noWrap>
                      {item.quantity}x {item.itemName}
                    </Typography>
                    <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.78rem" }}>
                      {item.size}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: "text.secondary", fontSize: "0.9rem" }}>
                      {item.price}
                    </Typography>
                    <Select
                      size="small"
                      value={normalizeStatus(item.status)}
                      onChange={(event) => handleItemStatusChange(item.id, event.target.value)}
                      sx={{
                        minWidth: 170,
                        borderRadius: 99,
                        bgcolor: "#080c12",
                        color: "primary.main",
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(212,178,95,0.55)" },
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
                      {ITEM_STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>
                </Stack>
              ))}
            </Box>

            <Divider sx={{ borderColor: "rgba(212,178,95,0.12)", my: 2.3 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 700, fontSize: "0.78rem" }}>
                Grand Total
              </Typography>
              <Typography variant="h2" sx={{ color: "primary.main", fontSize: { xs: "24px", md: "26px" } }}>
                {formatSLR(order.totalValue)}
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
        <DialogTitle>{cancelDialog.mode === "item" ? "Cancel Item" : "Cancel Order"}</DialogTitle>
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
