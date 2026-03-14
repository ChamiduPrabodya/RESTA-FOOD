import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DeleteSweepRoundedIcon from "@mui/icons-material/DeleteSweepRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";

const toSLR = (value) => `SLR ${Math.round(value).toLocaleString()}`;

function CartDialog({
  open,
  onClose,
  cartItems,
  onIncrease,
  onDecrease,
  onRemove,
  onClear,
}) {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );

  const handleClose = () => {
    setErrorMessage("");
    onClose();
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    const confirmed = window.confirm("Clear all items from your cart?");
    if (!confirmed) return;
    const result = onClear?.();
    if (result && result.success === false) {
      setErrorMessage(result.message || "Unable to clear cart.");
      return;
    }
    setErrorMessage("");
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) return;
    handleClose();
    navigate("/checkout");
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={handleClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 560 },
          maxWidth: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "#090d13",
          border: "1px solid rgba(212,178,95,0.22)",
          overflow: "hidden",
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3.2, py: 2.4 }}>
        <Stack direction="row" spacing={1.2} alignItems="center">
          <Inventory2OutlinedIcon sx={{ color: "primary.main", fontSize: 26 }} />
          <Box>
            <Typography variant="h3" sx={{ fontSize: "28px", lineHeight: 1.15 }}>
              Your Cart
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              {cartItems.length} item{cartItems.length === 1 ? "" : "s"} - {toSLR(subtotal)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.6} alignItems="center">
          <Tooltip title="Clear cart" placement="bottom">
            <span>
              <IconButton
                onClick={handleClearCart}
                disabled={cartItems.length === 0}
                sx={{ color: cartItems.length === 0 ? "rgba(255,255,255,0.25)" : "text.secondary" }}
                aria-label="Clear cart"
              >
                <DeleteSweepRoundedIcon sx={{ fontSize: 24 }} />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Close" placement="bottom">
            <IconButton onClick={handleClose} sx={{ color: "text.secondary" }} aria-label="Close cart">
              <CloseRoundedIcon sx={{ fontSize: 26 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Divider sx={{ borderColor: "rgba(212,178,95,0.14)" }} />

      <Box sx={{ flex: 1, minHeight: { xs: 180, sm: 220 }, overflowY: "auto", px: 3.2, py: 2.4 }}>
        <Stack spacing={1.5}>
          {cartItems.map((item) => (
            <Card key={item.id} sx={{ bgcolor: "#0f1116", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
              <CardContent sx={{ p: 2.2 }}>
                <Stack direction="row" spacing={1.6} alignItems="flex-start">
                  {item.image ? (
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.itemName}
                      sx={{ width: 84, height: 84, borderRadius: 3, objectFit: "cover", flexShrink: 0 }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 84,
                        height: 84,
                        borderRadius: 3,
                        flexShrink: 0,
                        bgcolor: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(212,178,95,0.12)",
                      }}
                    />
                  )}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="h3" sx={{ fontSize: "20px", lineHeight: 1.25 }} noWrap>
                          {item.itemName}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                          {item.size} - {toSLR(item.unitPrice)} each
                        </Typography>
                      </Box>
                      <Tooltip title="Remove item" placement="bottom">
                        <IconButton onClick={() => onRemove(item.id)} sx={{ color: "text.secondary" }} aria-label="Remove item">
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.4 }}>
                      <Stack direction="row" spacing={1.2} alignItems="center">
                        <Button
                          onClick={() => onDecrease(item.id)}
                          sx={{
                            minWidth: 42,
                            width: 42,
                            height: 42,
                            borderRadius: 2.5,
                            border: "1px solid rgba(212,178,95,0.25)",
                            color: "text.primary",
                          }}
                          aria-label="Decrease quantity"
                        >
                          <RemoveRoundedIcon sx={{ fontSize: 22 }} />
                        </Button>
                        <Typography sx={{ minWidth: 20, textAlign: "center", fontWeight: 800 }}>
                          {item.quantity}
                        </Typography>
                        <Button
                          onClick={() => onIncrease(item.id)}
                          sx={{
                            minWidth: 42,
                            width: 42,
                            height: 42,
                            borderRadius: 2.5,
                            border: "1px solid rgba(212,178,95,0.25)",
                            color: "text.primary",
                          }}
                          aria-label="Increase quantity"
                        >
                          <AddRoundedIcon sx={{ fontSize: 22 }} />
                        </Button>
                      </Stack>
                      <Typography sx={{ fontWeight: 800, color: "primary.main" }}>
                        {toSLR(item.unitPrice * item.quantity)}
                      </Typography>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}

          {cartItems.length === 0 && (
            <Box sx={{ py: 4, display: "grid", placeItems: "center", gap: 1.2 }}>
              <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
                Your cart is empty.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleClose}
                sx={{ borderRadius: 3, borderColor: "rgba(212,178,95,0.4)", color: "primary.main" }}
              >
                Continue browsing
              </Button>
            </Box>
          )}
        </Stack>
      </Box>

      <Box
        sx={{
          mt: "auto",
          bgcolor: "#17100d",
          borderTop: "1px solid rgba(212,178,95,0.16)",
          px: 3.2,
          py: 2.2,
        }}
      >
        <Stack spacing={1.2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: "text.secondary" }}>Subtotal</Typography>
            <Typography sx={{ color: "text.primary", fontWeight: 800 }}>{toSLR(subtotal)}</Typography>
          </Stack>
          {errorMessage && (
            <Typography sx={{ color: "#ff6b7a", fontSize: 13 }}>{errorMessage}</Typography>
          )}
          <Button
            fullWidth
            onClick={proceedToCheckout}
            disabled={cartItems.length === 0}
            startIcon={<ShoppingCartCheckoutRoundedIcon />}
            sx={{
              py: 1.45,
              borderRadius: 3.2,
              bgcolor: "primary.main",
              color: "#111214",
              fontWeight: 900,
              fontSize: "18px",
              "&:hover": { bgcolor: "#d4b25f" },
            }}
          >
            Proceed to Checkout
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}

export default CartDialog;

