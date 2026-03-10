import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  Drawer,
  FormControlLabel,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import { useAuth } from "../../../features/auth/context/AuthContext";

const toSLR = (value) => `SLR ${Math.round(value).toLocaleString()}`;
const SAVED_CARD_STORAGE_KEY = "hms_saved_cards";

const readSavedCards = () => {
  try {
    const raw = localStorage.getItem(SAVED_CARD_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const writeSavedCards = (value) => {
  localStorage.setItem(SAVED_CARD_STORAGE_KEY, JSON.stringify(value));
};

const detectCardBrand = (digits) => {
  if (/^4/.test(digits)) return "VISA";
  if (/^(34|37)/.test(digits)) return "AMEX";
  if (/^5[1-5]/.test(digits)) return "MASTERCARD";
  if (/^6(?:011|5)/.test(digits)) return "DISCOVER";
  return "CARD";
};

function CartDialog({
  open,
  onClose,
  cartItems,
  onIncrease,
  onDecrease,
  onRemove,
  onPlaceOrder,
}) {
  const { authUser } = useAuth();
  const [orderType, setOrderType] = useState("Delivery");
  const [paymentMethod, setPaymentMethod] = useState("Card (Online)");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCardDetails, setSaveCardDetails] = useState(true);
  const [cardErrors, setCardErrors] = useState({ cardNumber: "", cardExpiry: "", cardCvv: "" });
  const [errorMessage, setErrorMessage] = useState("");

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );
  const cardDigits = cardNumber.replace(/\D/g, "");
  const cardBrand = detectCardBrand(cardDigits);
  const expiryOk = /^\d{2}\/\d{2}$/.test(cardExpiry);
  const cvvOk = /^\d{3,4}$/.test(cardCvv);
  const cardFormComplete = cardDigits.length === 16 && expiryOk && cvvOk;
  const profileDelivery = {
    name: String(authUser?.fullName || "").trim(),
    phone: String(authUser?.phone || "").trim(),
    address: String(authUser?.address || "").trim(),
  };
  const hasDeliveryProfile =
    profileDelivery.name.length > 1 &&
    /^[0-9+\-\s]{9,15}$/.test(profileDelivery.phone) &&
    profileDelivery.address.length > 5;

  const validateCardNumber = (value) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 16) return "Card number must be 16 digits.";
    return "";
  };

  const validateExpiry = (value) => {
    if (!/^\d{2}\/\d{2}$/.test(value)) return "Expiry must be in MM/YY format.";
    const [monthText, yearText] = value.split("/");
    const month = Number(monthText);
    if (month < 1 || month > 12) return "Invalid expiry month.";

    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    const year = Number(yearText);
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "Card has expired.";
    }
    return "";
  };

  const validateCvv = (value) => {
    if (!/^\d{3,4}$/.test(value)) return "CVV must be 3 or 4 digits.";
    return "";
  };

  const validateCardDetails = () => {
    const nextErrors = {
      cardNumber: validateCardNumber(cardNumber),
      cardExpiry: validateExpiry(cardExpiry),
      cardCvv: validateCvv(cardCvv),
    };
    setCardErrors(nextErrors);
    return !nextErrors.cardNumber && !nextErrors.cardExpiry && !nextErrors.cardCvv;
  };

  useEffect(() => {
    if (!open || !authUser?.email) return;
    const savedCards = readSavedCards();
    const saved = savedCards[authUser.email];
    if (saved) {
      setCardNumber(saved.cardNumber ?? "");
      setCardExpiry(saved.cardExpiry ?? "");
      setCardCvv(saved.cardCvv ?? "");
      setSaveCardDetails(true);
    }
  }, [open, authUser]);

  const handlePlaceOrder = () => {
    if (orderType === "Delivery" && !hasDeliveryProfile) {
      setErrorMessage("Delivery profile is incomplete. Please update your account details.");
      return;
    }

    if (paymentMethod === "Card (Online)") {
      if (!validateCardDetails()) {
        setErrorMessage("Please enter valid card details.");
        return;
      }
    }

    setErrorMessage("");
    const result = onPlaceOrder({
      orderType,
      paymentMethod,
    });
    if (!result.success) {
      setErrorMessage(result.message);
      return;
    }

    if (paymentMethod === "Card (Online)" && authUser?.email && saveCardDetails) {
      const savedCards = readSavedCards();
      savedCards[authUser.email] = { cardNumber, cardExpiry, cardCvv };
      writeSavedCards(savedCards);
    }

    onClose();
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardErrors({ cardNumber: "", cardExpiry: "", cardCvv: "" });
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
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
          <Typography variant="h3" sx={{ fontSize: "28px", lineHeight: 1.2 }}>Your Cart</Typography>
        </Stack>
        <IconButton onClick={onClose} sx={{ color: "text.secondary" }}>
          <CloseRoundedIcon sx={{ fontSize: 26 }} />
        </IconButton>
      </Stack>

      <Divider sx={{ borderColor: "rgba(212,178,95,0.14)" }} />

      <Box sx={{ flex: 1, minHeight: { xs: 180, sm: 220 }, overflowY: "auto", px: 3.2, py: 2.4 }}>
        <Stack spacing={2}>
          {cartItems.map((item) => (
            <Stack key={item.id} direction="row" spacing={1.8} alignItems="flex-start">
              <Box
                component="img"
                src={item.image}
                alt={item.itemName}
                sx={{ width: 86, height: 86, borderRadius: 3, objectFit: "cover" }}
              />
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h3" sx={{ fontSize: "22px", lineHeight: 1.2 }}>{item.itemName}</Typography>
                    <Typography sx={{ color: "primary.main" }}>
                      {item.size} - {toSLR(item.unitPrice)}
                    </Typography>
                  </Box>
                  <IconButton onClick={() => onRemove(item.id)} sx={{ color: "text.secondary" }}>
                    <DeleteOutlineRoundedIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Stack>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 1.2 }}>
                  <Button onClick={() => onDecrease(item.id)} sx={{ minWidth: 42, width: 42, height: 42, borderRadius: 2.5, border: "1px solid rgba(212,178,95,0.25)", color: "text.primary" }}>
                    <RemoveRoundedIcon sx={{ fontSize: 22 }} />
                  </Button>
                  <Typography sx={{ minWidth: 20, textAlign: "center", fontWeight: 700 }}>
                    {item.quantity}
                  </Typography>
                  <Button onClick={() => onIncrease(item.id)} sx={{ minWidth: 42, width: 42, height: 42, borderRadius: 2.5, border: "1px solid rgba(212,178,95,0.25)", color: "text.primary" }}>
                    <AddRoundedIcon sx={{ fontSize: 22 }} />
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ))}

          {cartItems.length === 0 && (
            <Typography sx={{ color: "text.secondary", py: 2, textAlign: "center" }}>
              Your cart is empty.
            </Typography>
          )}
        </Stack>

      </Box>

      <Box
        sx={{
          mt: "auto",
          maxHeight: { xs: paymentMethod === "Card (Online)" ? "68vh" : "46vh", sm: paymentMethod === "Card (Online)" ? "62vh" : "40vh" },
          overflowY: "auto",
          bgcolor: "#17100d",
          borderTop: "1px solid rgba(212,178,95,0.16)",
          px: 3.2,
          py: 2.4,
        }}
      >
        <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, mb: 1 }}>
          Order Type
        </Typography>
        <Stack direction="row" spacing={1.4} sx={{ mb: 2.3 }}>
          {["Delivery", "Takeaway"].map((type) => (
            <Button
              key={type}
              onClick={() => {
                setOrderType(type);
                setErrorMessage("");
              }}
              sx={{
                flex: 1,
                borderRadius: 3,
                py: 1.2,
                bgcolor: orderType === type ? "primary.main" : "transparent",
                color: orderType === type ? "#111214" : "text.secondary",
                border: "1px solid rgba(212,178,95,0.28)",
                fontWeight: 700,
              }}
            >
              {type}
            </Button>
          ))}
        </Stack>

        {orderType === "Delivery" && (
          <Card sx={{ bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.2)", borderRadius: 3, mb: 2.2 }}>
            <CardContent sx={{ p: 2.2 }}>
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700, mb: 1.1 }}>
                Delivery Details
              </Typography>
              <Stack spacing={0.8}>
                <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Name</Typography>
                <Typography sx={{ fontWeight: 700 }}>{profileDelivery.name || "-"}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Phone</Typography>
                <Typography sx={{ fontWeight: 700 }}>{profileDelivery.phone || "-"}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Address</Typography>
                <Typography sx={{ fontWeight: 700 }}>{profileDelivery.address || "-"}</Typography>
              </Stack>
              
            </CardContent>
          </Card>
        )}

        <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, mb: 1 }}>
          Payment Method
        </Typography>
        <Stack direction="row" spacing={1.4} sx={{ mb: 2.2 }}>
          {["Cash", "Card"].map((method) => (
            <Button
              key={method}
              onClick={() => {
                setPaymentMethod(method === "Card" ? "Card (Online)" : "Cash");
                setErrorMessage("");
                if (method === "Cash") {
                  setCardErrors({ cardNumber: "", cardExpiry: "", cardCvv: "" });
                }
              }}
              sx={{
                flex: 1,
                borderRadius: 3,
                py: 1.2,
                bgcolor: (paymentMethod === "Card (Online)" ? "Card" : "Cash") === method ? "primary.main" : "transparent",
                color: (paymentMethod === "Card (Online)" ? "Card" : "Cash") === method ? "#111214" : "text.secondary",
                border: "1px solid rgba(212,178,95,0.28)",
                fontWeight: 700,
              }}
            >
              {method}
            </Button>
          ))}
        </Stack>

        {paymentMethod === "Card (Online)" && (
          <Card sx={{ bgcolor: "#16100d", border: "1px solid rgba(212,178,95,0.2)", borderRadius: 3, mb: 2.2 }}>
            <CardContent sx={{ p: 2.2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700 }}>
                  Card Payment
                </Typography>
                <Box sx={{ px: 1, py: 0.3, borderRadius: 1.5, bgcolor: "rgba(212,178,95,0.16)", color: "primary.main", fontWeight: 700, fontSize: 12 }}>
                  {cardBrand}
                </Box>
              </Stack>
              <Typography sx={{ color: "text.secondary", fontSize: 13, mb: 1.5 }}>
                Enter your card details to complete the order securely.
              </Typography>

              <Divider sx={{ borderColor: "rgba(212,178,95,0.14)", mb: 1.4 }} />

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                <CreditCardRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700 }}>
                  Card Details
                </Typography>
              </Stack>

              <TextField
                fullWidth
                placeholder="Card Number"
                value={cardNumber}
                onChange={(event) => {
                  const digits = event.target.value.replace(/\D/g, "").slice(0, 16);
                  const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
                  setCardNumber(formatted);
                  setCardErrors((current) => ({ ...current, cardNumber: "" }));
                }}
                error={Boolean(cardErrors.cardNumber)}
                helperText={cardErrors.cardNumber || " "}
                sx={{ mb: 1.2, "& .MuiOutlinedInput-root": { bgcolor: "#0d1118", borderRadius: 2.5 } }}
              />
              <Stack direction="row" spacing={1.3}>
                <TextField
                  fullWidth
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                    const formatted =
                      digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                    setCardExpiry(formatted);
                    setCardErrors((current) => ({ ...current, cardExpiry: "" }));
                  }}
                  error={Boolean(cardErrors.cardExpiry)}
                  helperText={cardErrors.cardExpiry || " "}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0d1118", borderRadius: 2.5 } }}
                />
                <TextField
                  fullWidth
                  placeholder="CVV"
                  value={cardCvv}
                  onChange={(event) => {
                    const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                    setCardCvv(digits);
                    setCardErrors((current) => ({ ...current, cardCvv: "" }));
                  }}
                  error={Boolean(cardErrors.cardCvv)}
                  helperText={cardErrors.cardCvv || " "}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0d1118", borderRadius: 2.5 } }}
                />
              </Stack>
              <FormControlLabel
                sx={{ mt: 1.2, ml: 0 }}
                control={
                  <Checkbox
                    checked={saveCardDetails}
                    onChange={(event) => setSaveCardDetails(event.target.checked)}
                    sx={{ color: "primary.main", "&.Mui-checked": { color: "primary.main" } }}
                  />
                }
                label={<Typography sx={{ color: "text.secondary", fontSize: 13 }}>Save card details for next time</Typography>}
              />
              <Typography sx={{ color: cardFormComplete ? "#7ce6a2" : "text.secondary", fontSize: 12, mt: 0.4 }}>
                {cardFormComplete ? "Card details look good." : "Fill all card fields to continue."}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Divider sx={{ borderColor: "rgba(212,178,95,0.14)", mb: 1.8 }} />
        <Stack spacing={1.1} sx={{ mb: 1.8 }}>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ color: "text.secondary" }}>Subtotal</Typography>
            <Typography sx={{ color: "text.primary", fontWeight: 700 }}>{toSLR(subtotal)}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography sx={{ color: "text.secondary" }}>Delivery Fee</Typography>
            <Typography sx={{ color: "primary.main", fontWeight: 700 }}>Free</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h3" sx={{ fontSize: "18px" }}>Total</Typography>
            <Typography variant="h2" sx={{ color: "primary.main", fontSize: "24px", lineHeight: 1.1 }}>{toSLR(subtotal)}</Typography>
          </Stack>
          {errorMessage && (
            <Typography sx={{ color: "#ff6b7a", fontSize: 13 }}>{errorMessage}</Typography>
          )}
        </Stack>
        <Button
          fullWidth
          onClick={handlePlaceOrder}
          disabled={
            cartItems.length === 0 ||
            (orderType === "Delivery" && !hasDeliveryProfile) ||
            (paymentMethod === "Card (Online)" && !cardFormComplete)
          }
          sx={{ py: 1.5, borderRadius: 3.2, bgcolor: "primary.main", color: "#111214", fontWeight: 800, fontSize: "18px", "&:hover": { bgcolor: "#d4b25f" } }}
        >
          Place Order
        </Button>
      </Box>
    </Drawer>
  );
}

export default CartDialog;
