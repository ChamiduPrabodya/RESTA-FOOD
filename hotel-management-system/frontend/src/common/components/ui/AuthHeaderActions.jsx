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

function AuthHeaderActions() {
  const navigate = useNavigate();
  const {
    authUser,
    logout,
    purchases,
    vipBookings,
    cartItems,
    increaseCartQty,
    decreaseCartQty,
    removeFromCart,
    placeOrderFromCart,
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
  const points = isAdmin ? 0 : 1250 + userPurchases.length * 50;
  const displayName = isAdmin
    ? "Resta Admin"
    : authUser?.fullName || "John Doe";
  const phone = isAdmin ? "+94 77 123 4567" : authUser?.phone || "+94 71 987 6543";

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
              borderColor: "rgba(212,178,95,0.35)",
              color: "primary.main",
              px: 2.1,
              py: 0.8,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {points} pts
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
        points={points}
        onLogout={handleLogout}
        ordersCount={userPurchases.length}
        bookingsCount={userBookings.length}
      />
      <CartDialog
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={userCartItems}
        onIncrease={increaseCartQty}
        onDecrease={decreaseCartQty}
        onRemove={removeFromCart}
        onPlaceOrder={placeOrderFromCart}
      />
    </>
  );
}

export default AuthHeaderActions;
