import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Stack } from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { useAuth } from "../../../features/auth/context/AuthContext";
import AccountDialog from "./AccountDialog";
import CartDialog from "./CartDialog";
import { parsePriceNumber } from "../../utils/pricing";

const getLoyaltyTier = (points) => {
  if (points >= 10000) {
    return { label: "Platinum", color: "#d8e4ff", bg: "rgba(120,150,255,0.22)", border: "rgba(160,186,255,0.45)" };
  }
  if (points >= 5000) {
    return { label: "Gold", color: "#f3cf69", bg: "rgba(212,178,95,0.22)", border: "rgba(212,178,95,0.42)" };
  }
  if (points >= 2000) {
    return { label: "Silver", color: "#d7dde8", bg: "rgba(180,190,210,0.18)", border: "rgba(180,190,210,0.38)" };
  }
  return { label: "Brown", color: "#d2a679", bg: "rgba(150,95,48,0.18)", border: "rgba(150,95,48,0.35)" };
};

function AuthHeaderActions() {
  const navigate = useNavigate();
  const {
    authUser,
    logout,
    updateUserProfile,
    purchases,
    vipBookings,
    cancelVipBookingByUser,
    cartItems,
    increaseCartQty,
    decreaseCartQty,
    removeFromCart,
    clearCart,
  } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const userPurchases = useMemo(
    () => purchases.filter((item) => item.userEmail === authUser?.email),
    [purchases, authUser]
  );
  const userBookings = useMemo(
    () => vipBookings.filter((item) => item.userEmail === authUser?.email),
    [vipBookings, authUser]
  );
  const userCartItems = useMemo(
    () => cartItems.filter((item) => item.userEmail === authUser?.email),
    [cartItems, authUser]
  );

  const isAdmin = authUser?.role === "admin";
  const points = useMemo(
    () => (isAdmin ? 0 : userPurchases.reduce((sum, purchase) => sum + parsePriceNumber(purchase.price), 0)),
    [isAdmin, userPurchases]
  );
  const tier = useMemo(() => getLoyaltyTier(points), [points]);
  const displayName = isAdmin
    ? "Resta Admin"
    : authUser?.fullName || "John Doe";
  const phone = isAdmin ? "+94 77 123 4567" : authUser?.phone || "+94 71 987 6543";
  const address = isAdmin ? "Admin Panel" : authUser?.address || "";

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    navigate("/");
  };

  if (!authUser) {
    return (
      <Button component={Link} to="/sign-in" variant="contained" color="primary" startIcon={<LoginRoundedIcon />}>
        Sign In
      </Button>
    );
  }

  return (
    <>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Button onClick={() => setCartOpen(true)} sx={{ minWidth: 38, width: 38, height: 38, p: 0, color: "text.secondary", border: "1px solid rgba(212,178,95,0.2)", borderRadius: 99, position: "relative" }}>
          <Inventory2OutlinedIcon fontSize="small" />
          {userCartItems.length > 0 && (
            <Box
              sx={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 18,
                height: 18,
                px: 0.6,
                borderRadius: 99,
                bgcolor: "#ff2f4f",
                color: "#fff",
                fontSize: 11,
                fontWeight: 700,
                display: "grid",
                placeItems: "center",
              }}
            >
              {userCartItems.length}
            </Box>
          )}
        </Button>

        {isAdmin ? (
          <Button
            component={Link}
            to="/admin-dashboard"
            variant="outlined"
            startIcon={<GridViewRoundedIcon />}
            sx={{
              borderRadius: 99,
              borderColor: "rgba(212,178,95,0.35)",
              color: "primary.main",
              px: 2.1,
              py: 0.8,
            }}
          >
            Admin
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<EmojiEventsOutlinedIcon />}
            sx={{
              borderRadius: 99,
              borderColor: tier.border,
              color: tier.color,
              bgcolor: tier.bg,
              px: 2.1,
              py: 0.8,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {tier.label}
          </Button>
        )}

        <Button
          onClick={() => setAccountOpen(true)}
          sx={{
            minWidth: 46,
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: "1px solid rgba(212,178,95,0.45)",
            color: "primary.main",
            bgcolor: "#24180f",
          }}
        >
          <PersonOutlineRoundedIcon />
        </Button>
      </Stack>

        <AccountDialog
          open={accountOpen}
          onClose={() => setAccountOpen(false)}
          isAdmin={isAdmin}
          displayName={displayName}
          email={authUser.email}
          phone={phone}
          address={address}
          points={points}
          onLogout={handleLogout}
          ordersCount={userPurchases.length}
          bookingsCount={userBookings.length}
          userOrders={userPurchases}
        userBookings={userBookings}
        onCancelBooking={cancelVipBookingByUser}
        onSaveProfile={updateUserProfile}
      />
      <CartDialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={userCartItems}
        onIncrease={increaseCartQty}
        onDecrease={decreaseCartQty}
        onRemove={removeFromCart}
        onClear={clearCart}
      />
    </>
  );
}

export default AuthHeaderActions;
