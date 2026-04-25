import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Box, Button, Stack, useMediaQuery, useTheme } from "@mui/material";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import GridViewRoundedIcon from "@mui/icons-material/GridViewRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useAuth } from "../../../features/auth/context/AuthContext";
import AccountDialog from "./AccountDialog";
import CartDialog from "./CartDialog";

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

const formatTableBadgeLabel = (tableLabel, tableId) => {
  const raw = String(tableLabel || tableId || "").trim();
  if (!raw) return "Table";
  if (/^table\b/i.test(raw)) return raw;
  return `Table ${raw}`;
};

function AuthHeaderActions() {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const {
    authUser,
    loyaltySummary,
    refreshLoyaltySummary,
    logout,
    updateUserProfile,
    purchases,
    vipBookings,
    cancelVipBookingByUser,
    cartItems,
    tableContext,
    clearTableContext,
    increaseCartQty,
    decreaseCartQty,
    removeFromCart,
    clearCart,
  } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const isTableGuestMode = Boolean(tableContext?.sessionId) && (!authUser || authUser.role !== "user");
  const guestCartKey = isTableGuestMode ? `guest:${String(tableContext?.sessionId || "").trim()}` : "";

  const userPurchases = useMemo(
    () => (authUser ? purchases.filter((item) => item.userEmail === authUser?.email) : []),
    [purchases, authUser]
  );
  const userBookings = useMemo(
    () => vipBookings.filter((item) => item.userEmail === authUser?.email),
    [vipBookings, authUser]
  );
  const userCartItems = useMemo(
    () => cartItems.filter((item) => item.userEmail === (isTableGuestMode ? guestCartKey : authUser?.email)),
    [cartItems, authUser, guestCartKey, isTableGuestMode]
  );

  const isAdmin = authUser?.role === "admin" && !isTableGuestMode;
  const points = isAdmin ? 0 : Number(loyaltySummary?.points) || 0;
  const tier = useMemo(() => getLoyaltyTier(points), [points]);
  const normalizedProvider = String(authUser?.authProvider || "").trim().toLowerCase();
  const isGoogleUser = normalizedProvider === "google";
  const tableBadgeLabel = formatTableBadgeLabel(tableContext?.tableLabel, tableContext?.tableId);
  const displayName = isTableGuestMode
    ? "Table Guest"
    : isAdmin
    ? "Resta Admin"
    : (isGoogleUser ? authUser?.googleName : authUser?.fullName) ||
      authUser?.fullName ||
      authUser?.googleName ||
      (authUser?.email ? String(authUser.email).split("@")[0] : "") ||
      "User";
  const phone = isAdmin ? "+94 77 123 4567" : authUser?.phone || "";
  const address = isAdmin
    ? "Admin Panel"
    : authUser?.address ||
      [authUser?.streetAddress1, authUser?.streetAddress2, authUser?.cityTown].filter(Boolean).join(", ");

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    navigate("/");
  };

  if (!authUser && !isTableGuestMode) {
    return (
      <Button
        component={Link}
        to="/sign-in"
        variant="contained"
        color="primary"
        startIcon={isCompact ? null : <LoginRoundedIcon />}
        sx={{
          flexShrink: 0,
          minWidth: { xs: "auto", sm: 118 },
          px: { xs: 1.6, sm: 2.4 },
          py: 1,
          borderRadius: 999,
          whiteSpace: "nowrap",
          boxShadow: "none",
        }}
      >
        {isCompact ? "Login" : "Sign In"}
      </Button>
    );
  }

  return (
    <>
      <Stack direction="row" spacing={{ xs: 1, sm: 1.5 }} alignItems="center" justifyContent="flex-end" flexWrap="wrap">
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

        {isTableGuestMode ? (
          <Stack direction="row" spacing={0.8} alignItems="center">
            <Button
              variant="outlined"
              sx={{
                borderRadius: 99,
                borderColor: "rgba(212,178,95,0.35)",
                color: "primary.main",
                px: 2.1,
                py: 0.8,
                whiteSpace: "nowrap",
              }}
            >
              {tableBadgeLabel}
            </Button>
            <Button
              onClick={clearTableContext}
              variant="text"
              color="inherit"
              startIcon={isCompact ? null : <CloseRoundedIcon />}
              sx={{
                minWidth: { xs: 36, sm: "auto" },
                width: { xs: 36, sm: "auto" },
                height: 36,
                borderRadius: 99,
                px: { xs: 0, sm: 1.4 },
                color: "text.secondary",
                border: "1px solid rgba(212,178,95,0.18)",
                whiteSpace: "nowrap",
              }}
              aria-label="Leave table session"
              title="Leave table session"
            >
              {isCompact ? <CloseRoundedIcon fontSize="small" /> : "Exit"}
            </Button>
          </Stack>
        ) : isAdmin ? (
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

        {!isTableGuestMode && (
          <Button
            onClick={() => {
              if (authUser?.role !== "admin") {
                refreshLoyaltySummary?.();
              }
              setAccountOpen(true);
            }}
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
        )}
      </Stack>

      {!isTableGuestMode && (
        <AccountDialog
           open={accountOpen}
           onClose={() => setAccountOpen(false)}
           isAdmin={isAdmin}
           displayName={displayName}
           email={authUser.email}
           authProvider={authUser?.authProvider}
           googleSub={authUser?.googleSub}
           avatarUrl={authUser?.avatarUrl}
           googleName={authUser?.googleName}
           phone={phone}
           address={address}
           streetAddress1={isAdmin ? "" : authUser?.streetAddress1 || ""}
           streetAddress2={isAdmin ? "" : authUser?.streetAddress2 || ""}
           cityTown={isAdmin ? "" : authUser?.cityTown || ""}
          points={points}
          onLogout={handleLogout}
          ordersCount={userPurchases.length}
          bookingsCount={userBookings.length}
          userOrders={userPurchases}
        userBookings={userBookings}
        onCancelBooking={cancelVipBookingByUser}
        onSaveProfile={updateUserProfile}
        />
      )}
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
