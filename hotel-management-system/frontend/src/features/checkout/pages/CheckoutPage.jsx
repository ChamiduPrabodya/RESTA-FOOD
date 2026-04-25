import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";
import AuthHeaderActions from "../../../common/components/ui/AuthHeaderActions";
import { useAuth } from "../../auth/context/AuthContext";
import { calculateCheckoutPricing } from "../../../common/utils/pricing";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };
const toSLR = (value) => `SLR ${Math.round(value).toLocaleString()}`;

function CheckoutPage() {
  const navigate = useNavigate();
  const { authUser, cartItems, placeOrderFromCart, promotions, loyaltyRules, loyaltySummary, lastDeliveryDetails, tableContext, clearTableContext } = useAuth();
  const isGuest = Boolean(tableContext?.sessionId);
  const cartOwnerKey = isGuest ? `guest:${String(tableContext?.sessionId || "").trim()}` : authUser?.email || "";

  const userCartItems = useMemo(
    () => cartItems.filter((item) => item.userEmail === cartOwnerKey),
    [cartItems, cartOwnerKey]
  );

  const [orderType, setOrderType] = useState(() => (tableContext?.sessionId ? "DineIn" : "Delivery"));
  const [paymentMethod, setPaymentMethod] = useState(() => (isGuest ? "Cash" : "Card (Online)"));
  const [errorMessage, setErrorMessage] = useState("");

  const profileDelivery = {
    name: String(authUser?.fullName || "").trim(),
    phone: String(authUser?.phone || "").trim(),
    streetAddress1: String(authUser?.streetAddress1 || "").trim(),
    streetAddress2: String(authUser?.streetAddress2 || "").trim(),
    cityTown: String(authUser?.cityTown || "").trim(),
    address: String(authUser?.address || "").trim(),
  };

  const seededDelivery = useMemo(() => {
    const base = lastDeliveryDetails || {};
    return {
      phone: String(base.phone || profileDelivery.phone || "").trim(),
      streetAddress1: String(base.streetAddress1 || profileDelivery.streetAddress1 || "").trim(),
      streetAddress2: String(base.streetAddress2 || profileDelivery.streetAddress2 || "").trim(),
      cityTown: String(base.cityTown || profileDelivery.cityTown || "").trim(),
    };
  }, [lastDeliveryDetails, profileDelivery.phone, profileDelivery.streetAddress1, profileDelivery.streetAddress2, profileDelivery.cityTown]);

  const [deliveryPhone, setDeliveryPhone] = useState(seededDelivery.phone);
  const [deliveryStreet1, setDeliveryStreet1] = useState(seededDelivery.streetAddress1);
  const [deliveryStreet2, setDeliveryStreet2] = useState(seededDelivery.streetAddress2);
  const [deliveryCityTown, setDeliveryCityTown] = useState(seededDelivery.cityTown);
  const [deliveryErrors, setDeliveryErrors] = useState({ phone: "" });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDeliveryPhone(seededDelivery.phone);
      setDeliveryStreet1(seededDelivery.streetAddress1);
      setDeliveryStreet2(seededDelivery.streetAddress2);
      setDeliveryCityTown(seededDelivery.cityTown);
      setDeliveryErrors({ phone: "" });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [seededDelivery.phone, seededDelivery.streetAddress1, seededDelivery.streetAddress2, seededDelivery.cityTown]);
  const formattedDeliveryAddress =
    [deliveryStreet1, deliveryStreet2, deliveryCityTown]
      .filter(Boolean)
      .join(", ") || profileDelivery.address;
  const hasDeliveryProfile =
    profileDelivery.name.length > 1 &&
    /^[0-9+\-\s]{9,15}$/.test(String(deliveryPhone || "").trim()) &&
    (String(deliveryStreet1 || "").trim().length > 2 || profileDelivery.address.length > 5) &&
    (String(deliveryCityTown || "").trim().length > 1 || profileDelivery.address.length > 5);

  const pricing = useMemo(
    () =>
      calculateCheckoutPricing({
        cartItems: userCartItems,
        userEmail: authUser?.email,
        promotions,
        loyaltyRules,
        points: loyaltySummary?.points,
        loyaltyPercent: loyaltySummary?.discountPercent,
        orderType,
        deliveryAddress: formattedDeliveryAddress,
        deliveryCityTown,
      }),
    [userCartItems, authUser, promotions, loyaltyRules, loyaltySummary?.points, loyaltySummary?.discountPercent, orderType, formattedDeliveryAddress, deliveryCityTown]
  );

  useEffect(() => {
    if (!tableContext?.sessionId && orderType === "DineIn") {
      const timeoutId = window.setTimeout(() => setOrderType("Delivery"), 0);
      return () => window.clearTimeout(timeoutId);
    }
    return undefined;
  }, [tableContext?.sessionId, orderType]);

  if (!authUser && !isGuest) {
    return <Navigate to="/sign-in" replace state={{ from: "/checkout" }} />;
  }

  if (userCartItems.length === 0) {
    return <Navigate to="/menu" replace />;
  }

  const handlePlaceOrder = async () => {
    if (orderType === "Delivery") {
      const normalizedPhone = String(deliveryPhone || "").trim();
      const phoneOk = /^[0-9+\-\s]{9,15}$/.test(normalizedPhone);
      setDeliveryErrors({ phone: phoneOk ? "" : "Enter a valid mobile number." });
      if (!phoneOk) {
        setErrorMessage("Please enter a valid mobile number for delivery.");
        return;
      }
    }

    if (orderType === "Delivery" && !hasDeliveryProfile) {
      setErrorMessage("Delivery details are incomplete. Please fill your mobile number and address above.");
      return;
    }

    if (orderType === "Delivery" && pricing && pricing.deliveryAllowed === false) {
      setErrorMessage("Delivery is not available for the selected area. Please choose Takeaway.");
      return;
    }

    setErrorMessage("");
    const result = await placeOrderFromCart({
      orderType: isGuest ? "DineIn" : orderType,
      paymentMethod: isGuest ? "Cash" : paymentMethod,
      deliveryDetails:
        !isGuest && orderType === "Delivery"
          ? {
              phone: String(deliveryPhone || "").trim(),
              streetAddress1: String(deliveryStreet1 || "").trim(),
              streetAddress2: String(deliveryStreet2 || "").trim(),
              cityTown: String(deliveryCityTown || "").trim(),
              location: String(formattedDeliveryAddress || "").trim(),
            }
          : null,
    });
    if (!result?.success) {
      setErrorMessage(result?.message || "Unable to place order.");
      return;
    }

    if (result?.redirect === "payhere") {
      // Browser will navigate to PayHere gateway (form POST). Do not SPA-navigate.
      return;
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

            {tableContext?.sessionId && (
              <Card sx={{ bgcolor: "#0f1116", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
                <CardContent sx={{ p: 2.2 }}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={1}>
                    <Box>
                      <Typography sx={{ color: "primary.main", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase", fontSize: 13 }}>
                        Table Session
                      </Typography>
                      <Typography sx={{ fontWeight: 900, fontSize: 18 }}>
                        {String(tableContext.tableLabel || tableContext.tableId || "").trim() || "Table"}
                      </Typography>
                      {Number(tableContext.guestCount) > 0 && (
                        <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
                          {Number(tableContext.guestCount)} guest{Number(tableContext.guestCount) === 1 ? "" : "s"}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      onClick={() => {
                        clearTableContext();
                        setOrderType("Delivery");
                      }}
                      sx={{ borderRadius: 999, px: 2, border: "1px solid rgba(255,107,122,0.35)", color: "#ff6b7a" }}
                    >
                      Clear Table
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 0.9fr" }, gap: 2 }}>
            <Box sx={{ display: "grid", gap: 2 }}>
              <Card sx={{ bgcolor: "#17100d", border: "1px solid rgba(212,178,95,0.16)", borderRadius: 4 }}>
                <CardContent sx={{ p: 2.4 }}>
                  <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 700, mb: 1.2 }}>
                    Order Type
                  </Typography>
                  <Stack direction="row" spacing={1.4}>
                    {(isGuest ? ["DineIn"] : (tableContext?.sessionId ? ["DineIn", "Delivery", "Takeaway"] : ["Delivery", "Takeaway"])).map((type) => (
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
                        {type === "DineIn" ? "Dine-In" : type}
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
                    <Stack spacing={1.2}>
                      <Box>
                        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Name</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{profileDelivery.name || "-"}</Typography>
                      </Box>

                      <TextField
                        label="Mobile Number"
                        value={deliveryPhone}
                        onChange={(event) => {
                          setDeliveryPhone(event.target.value);
                          if (deliveryErrors.phone) {
                            setDeliveryErrors((current) => ({ ...current, phone: "" }));
                          }
                        }}
                        onBlur={() => {
                          const normalized = String(deliveryPhone || "").trim();
                          const ok = /^[0-9+\\-\\s]{9,15}$/.test(normalized);
                          setDeliveryErrors({ phone: ok ? "" : "Enter a valid mobile number." });
                        }}
                        error={Boolean(deliveryErrors.phone)}
                        helperText={deliveryErrors.phone || " "}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                      />

                      <Stack direction={{ xs: "column", md: "row" }} spacing={1.2}>
                        <TextField
                          fullWidth
                          label="Street Address 1"
                          value={deliveryStreet1}
                          onChange={(event) => setDeliveryStreet1(event.target.value)}
                          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                        />
                        <TextField
                          fullWidth
                          label="Street Address 2 (Optional)"
                          value={deliveryStreet2}
                          onChange={(event) => setDeliveryStreet2(event.target.value)}
                          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                        />
                      </Stack>

                      <TextField
                        fullWidth
                        label="City / Town"
                        value={deliveryCityTown}
                        onChange={(event) => setDeliveryCityTown(event.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                      />

                      <Box>
                        <Typography sx={{ color: "text.secondary", fontSize: 13 }}>Delivery Address Preview</Typography>
                        <Typography sx={{ fontWeight: 700 }}>{formattedDeliveryAddress || "-"}</Typography>
                      </Box>
                    </Stack>
                    {!hasDeliveryProfile && (
                      <Typography sx={{ color: "#ff6b7a", fontSize: 13, mt: 1.4 }}>
                        Add your name in your account profile and complete the delivery mobile number and address above.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              {!isGuest && (
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
                          <Typography sx={{ color: "primary.main", textTransform: "uppercase", letterSpacing: 1.1, fontWeight: 700 }}>
                            PayHere Card Payment
                          </Typography>
                          <Divider sx={{ borderColor: "rgba(212,178,95,0.14)", my: 1.4 }} />
                          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
                            You will be redirected to PayHere to enter your bank card details securely and complete the payment.
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              )}
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
                  {isGuest && (
                    <Typography sx={{ color: "text.secondary", fontSize: 12 }}>
                      This table order will go straight to the admin kitchen dashboard under {String(tableContext?.tableLabel || tableContext?.tableId || "the table").trim()}.
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
                    (orderType === "Delivery" && pricing.deliveryAllowed === false)
                  }
                  sx={{ py: 1.5, borderRadius: 3.2, bgcolor: "primary.main", color: "#111214", fontWeight: 900, fontSize: "18px", "&:hover": { bgcolor: "#d4b25f" } }}
                >
                  {isGuest ? "Send Order to Kitchen" : "Place Order"}
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
