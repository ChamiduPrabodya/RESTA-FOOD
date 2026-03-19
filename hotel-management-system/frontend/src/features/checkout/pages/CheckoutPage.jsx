import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";
import AuthHeaderActions from "../../../common/components/ui/AuthHeaderActions";
import { useAuth } from "../../auth/context/AuthContext";
import { calculateCheckoutPricing } from "../../../common/utils/pricing";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };
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

function CheckoutPage() {
  const navigate = useNavigate();
  const { authUser, cartItems, placeOrderFromCart, purchases, promotions, loyaltyRules } = useAuth();

  const userCartItems = useMemo(
    () => cartItems.filter((item) => item.userEmail === authUser?.email),
    [cartItems, authUser]
  );

  const [orderType, setOrderType] = useState("Delivery");
  const [paymentMethod, setPaymentMethod] = useState("Card (Online)");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [saveCardDetails, setSaveCardDetails] = useState(true);
  const [cardErrors, setCardErrors] = useState({ cardNumber: "", cardExpiry: "", cardCvv: "" });
  const [errorMessage, setErrorMessage] = useState("");

  const profileDelivery = {
    name: String(authUser?.fullName || "").trim(),
    phone: String(authUser?.phone || "").trim(),
    streetAddress1: String(authUser?.streetAddress1 || "").trim(),
    streetAddress2: String(authUser?.streetAddress2 || "").trim(),
    cityTown: String(authUser?.cityTown || "").trim(),
    address: String(authUser?.address || "").trim(),
  };
  const formattedDeliveryAddress =
    [profileDelivery.streetAddress1, profileDelivery.streetAddress2, profileDelivery.cityTown]
      .filter(Boolean)
      .join(", ") || profileDelivery.address;
  const hasDeliveryProfile =
    profileDelivery.name.length > 1 &&
    /^[0-9+\-\s]{9,15}$/.test(profileDelivery.phone) &&
    (profileDelivery.streetAddress1.length > 2 || profileDelivery.address.length > 5) &&
    (profileDelivery.cityTown.length > 1 || profileDelivery.address.length > 5);

  const pricing = useMemo(
    () =>
      calculateCheckoutPricing({
        cartItems: userCartItems,
        userEmail: authUser?.email,
        purchases,
        promotions,
        loyaltyRules,
        orderType,
        deliveryAddress: formattedDeliveryAddress,
        deliveryCityTown: profileDelivery.cityTown,
      }),
    [userCartItems, authUser, purchases, promotions, loyaltyRules, orderType, formattedDeliveryAddress, profileDelivery.cityTown]
  );

  if (!authUser) {
    return <Navigate to="/sign-in" replace state={{ from: "/checkout" }} />;
  }

  if (userCartItems.length === 0) {
    return <Navigate to="/menu" replace />;
  }

  const cardDigits = cardNumber.replace(/\D/g, "");
  const cardBrand = detectCardBrand(cardDigits);
  const expiryOk = /^\d{2}\/\d{2}$/.test(cardExpiry);
  const cvvOk = /^\d{3,4}$/.test(cardCvv);
  const cardFormComplete = cardDigits.length === 16 && expiryOk && cvvOk;

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

  const handlePlaceOrder = () => {
    if (orderType === "Delivery" && !hasDeliveryProfile) {
      setErrorMessage("Delivery profile is incomplete. Please update your account details.");
      return;
    }

    if (orderType === "Delivery" && pricing && pricing.deliveryAllowed === false) {
      setErrorMessage("Delivery is not available for the selected area. Please choose Takeaway.");
      return;
    }

    if (paymentMethod === "Card (Online)") {
      if (!validateCardDetails()) {
        setErrorMessage("Please enter valid card details.");
        return;
      }
    }

    setErrorMessage("");
    const result = placeOrderFromCart({
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

    navigate("/menu");
  };

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <Box sx={{ px: sectionPaddingX, borderBottom: "1px solid rgba(212,178,95,0.2)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 26, color: "primary.main" }}>RESTA FAST FOOD</Typography>
          <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
            <Button component={Link} to="/" startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "text.secondary", fontWeight: 600 }}>
              Home
            </Button>
            <Button component={Link} to="/menu" startIcon={<RestaurantMenuRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "text.secondary", fontWeight: 600 }}>
              Menu
            </Button>
            <Button component={Link} to="/vip-rooms" startIcon={<MeetingRoomRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "text.secondary", fontWeight: 600 }}>
              VIP Rooms
            </Button>
          </Stack>
          <AuthHeaderActions />
        </Stack>
      </Box>

      <Box sx={{ px: sectionPaddingX, py: { xs: 5, md: 7 } }}>
        <Stack spacing={2.5} sx={{ maxWidth: 1080, mx: "auto" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ShoppingCartCheckoutRoundedIcon sx={{ color: "primary.main" }} />
            <Typography variant="h1" sx={{ fontSize: { xs: "34px", md: "46px" }, lineHeight: 1.05 }}>
              Checkout
            </Typography>
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 2 }}>
            <Box sx={{ display: "grid", gap: 2 }}>
              <Card sx={{ bgcolor: "#17100d", border: "1px solid rgba(212,178,95,0.16)", borderRadius: 4 }}>
                <CardContent sx={{ p: 2.4 }}>
                  <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, mb: 1.2 }}>
                    Order Type
                  </Typography>
                  <Stack direction="row" spacing={1.4}>
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
                </CardContent>
              </Card>

              {orderType === "Delivery" && (
                <Card sx={{ bgcolor: "#17100d", border: "1px solid rgba(212,178,95,0.16)", borderRadius: 4 }}>
                  <CardContent sx={{ p: 2.4 }}>
                    <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, mb: 1.2 }}>
                      Delivery Details
                    </Typography>
                    <Stack spacing={0.8}>
                      <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Name</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{profileDelivery.name || "-"}</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Phone</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{profileDelivery.phone || "-"}</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Address</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{formattedDeliveryAddress || "-"}</Typography>
                    </Stack>
                    {!hasDeliveryProfile && (
                      <Typography sx={{ color: "#ff6b7a", fontSize: 13, mt: 1.4 }}>
                        Add your name, phone, and address in your account profile to place delivery orders.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card sx={{ bgcolor: "#17100d", border: "1px solid rgba(212,178,95,0.16)", borderRadius: 4 }}>
                <CardContent sx={{ p: 2.4 }}>
                  <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, mb: 1.2 }}>
                    Payment Method
                  </Typography>
                  <Stack direction="row" spacing={1.4} sx={{ mb: 2 }}>
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
                    <Card sx={{ bgcolor: "#0f1116", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 3 }}>
                      <CardContent sx={{ p: 2.2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                          <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700 }}>
                            Card Payment
                          </Typography>
                          <Box sx={{ px: 1, py: 0.3, borderRadius: 1.5, bgcolor: "rgba(212,178,95,0.16)", color: "primary.main", fontWeight: 700, fontSize: 12 }}>
                            {cardBrand}
                          </Box>
                        </Stack>

                        <Divider sx={{ borderColor: "rgba(212,178,95,0.14)", mb: 1.4 }} />

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                          <CreditCardRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                          <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700 }}>
                            Card Details
                          </Typography>
                        </Stack>

                        <TextField
                          fullWidth
                          label="Card Number"
                          placeholder="1234 5678 9012 3456"
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
                            label="Expiry"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(event) => {
                              const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                              const formatted = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
                              setCardExpiry(formatted);
                              setCardErrors((current) => ({ ...current, cardExpiry: "" }));
                            }}
                            error={Boolean(cardErrors.cardExpiry)}
                            helperText={cardErrors.cardExpiry || " "}
                            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0d1118", borderRadius: 2.5 } }}
                          />
                          <TextField
                            fullWidth
                            label="CVV"
                            placeholder="123"
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
                </CardContent>
              </Card>
            </Box>

            <Card sx={{ bgcolor: "#17100d", border: "1px solid rgba(212,178,95,0.16)", borderRadius: 4, height: "fit-content" }}>
              <CardContent sx={{ p: 2.4 }}>
                <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, mb: 1.2 }}>
                  Order Summary
                </Typography>
                <Stack spacing={1.2} sx={{ mb: 2 }}>
                  {userCartItems.map((item) => (
                    <Stack key={item.id} direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 800 }} noWrap>
                          {item.quantity}x {item.itemName}
                        </Typography>
                        <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                          {item.size} • {toSLR(item.unitPrice)} each
                        </Typography>
                      </Box>
                      <Typography sx={{ fontWeight: 800, color: "primary.main" }}>
                        {toSLR(item.unitPrice * item.quantity)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Divider sx={{ borderColor: "rgba(212,178,95,0.14)", mb: 1.6 }} />
                <Stack spacing={1.1} sx={{ mb: 1.8 }}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: "text.secondary" }}>Subtotal</Typography>
                    <Typography sx={{ color: "text.primary", fontWeight: 800 }}>{toSLR(pricing.subtotal)}</Typography>
                  </Stack>
                  {pricing.promotionDiscount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ color: "text.secondary" }}>
                        Promotion{pricing.promotion?.title ? ` (${pricing.promotion.title})` : ""}
                      </Typography>
                      <Typography sx={{ color: "#7ce6a2", fontWeight: 800 }}>
                        -{toSLR(pricing.promotionDiscount)}
                      </Typography>
                    </Stack>
                  )}
                  {pricing.loyaltyDiscount > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ color: "text.secondary" }}>
                        Loyalty Discount ({pricing.loyaltyPercent}%)
                      </Typography>
                      <Typography sx={{ color: "#7ce6a2", fontWeight: 800 }}>
                        -{toSLR(pricing.loyaltyDiscount)}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: "text.secondary" }}>Delivery Fee</Typography>
                    <Typography sx={{ color: "primary.main", fontWeight: 800 }}>
                      {orderType !== "Delivery"
                        ? "Free"
                        : pricing.deliveryAllowed === false
                          ? "Not available"
                          : pricing.deliveryFee <= 0
                            ? "Free"
                            : toSLR(pricing.deliveryFee)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h3" sx={{ fontSize: "18px" }}>Total</Typography>
                    <Typography variant="h2" sx={{ color: "primary.main", fontSize: "24px", lineHeight: 1.1 }}>
                      {toSLR(pricing.grandTotal ?? pricing.total)}
                    </Typography>
                  </Stack>
                  {pricing.loyaltyDiscount > 0 && (
                    <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                      Loyalty points: {pricing.points}
                    </Typography>
                  )}
                  {errorMessage && (
                    <Typography sx={{ color: "#ff6b7a", fontSize: 13 }}>{errorMessage}</Typography>
                  )}
                </Stack>

                <Button
                  fullWidth
                  onClick={handlePlaceOrder}
                  disabled={
                    userCartItems.length === 0 ||
                    (orderType === "Delivery" && !hasDeliveryProfile) ||
                    (orderType === "Delivery" && pricing.deliveryAllowed === false) ||
                    (paymentMethod === "Card (Online)" && !cardFormComplete)
                  }
                  sx={{ py: 1.5, borderRadius: 3.2, bgcolor: "primary.main", color: "#111214", fontWeight: 900, fontSize: "18px", "&:hover": { bgcolor: "#d4b25f" } }}
                >
                  Place Order
                </Button>
                {orderType === "Delivery" && pricing.deliveryAllowed === false && (
                  <Typography sx={{ color: "#ff6b7a", fontSize: 13, mt: 1.2 }}>
                    Delivery is not available for your city/town. Please switch to Takeaway or update your address.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}

export default CheckoutPage;
