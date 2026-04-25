import { useMemo, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import RestaurantRoundedIcon from "@mui/icons-material/RestaurantRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BackToTopButton from "../../../common/components/ui/BackToTopButton";
import SiteFooter from "../../../common/components/ui/SiteFooter";
import { useAuth } from "../../auth/context/AuthContext";
import AuthHeaderActions from "../../../common/components/ui/AuthHeaderActions";
import { buildPurchaseCounts, getMenuItemPurchasedCount } from "../../../common/utils/popularity";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };
const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: [0.2, 0.7, 0.2, 1] },
  },
};

function MenuCard({ item, index, onBuy, disableOrdering = false }) {
  const portionKeys = Object.keys(item.portions);
  const [selectedPortion, setSelectedPortion] = useState(portionKeys[0]);
  const selectedPrice = item.portions[selectedPortion];

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: (index % 3) * 0.08 }}
      whileHover={{ y: -6 }}
      sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.24)", overflow: "hidden" }}
    >
      <Box
        sx={{
          aspectRatio: "16 / 9",
          backgroundImage: `url(${item.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          bgcolor: "rgba(0,0,0,0.25)",
          position: "relative",
        }}
      >
        <Chip
          label={item.category}
          sx={{ position: "absolute", top: 12, right: 12, bgcolor: "rgba(16,13,11,0.88)", color: "primary.main", border: "1px solid rgba(212,178,95,0.3)" }}
        />
      </Box>
      <CardContent sx={{ p: 2 }}>
        <Typography variant="h3" sx={{ fontSize: "24px", mb: 0.8 }}>{item.name}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 1.6 }}>{item.description}</Typography>
        {portionKeys.length > 1 && (
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap sx={{ mb: 1.6 }}>
            {portionKeys.map((portion) => (
              <Button
                key={portion}
                onClick={() => setSelectedPortion(portion)}
                variant={selectedPortion === portion ? "contained" : "outlined"}
                color="primary"
                size="small"
                sx={{
                  minWidth: 78,
                  borderRadius: 999,
                  px: 1.4,
                  py: 0.4,
                  fontSize: 12,
                  borderColor: "rgba(212,178,95,0.35)",
                  color: selectedPortion === portion ? "#0d0f14" : "text.secondary",
                  bgcolor: selectedPortion === portion ? "primary.main" : "rgba(24,19,16,0.75)",
                }}
              >
                {portion}
              </Button>
            ))}
          </Stack>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
          <Box>
            <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8 }}>PRICE</Typography>
            <Typography variant="h3" sx={{ fontSize: "28px" }}>{selectedPrice}</Typography>
          </Box>
          <Button
            onClick={() => onBuy(item, selectedPortion, selectedPrice)}
            disabled={item.outOfStock || disableOrdering}
            sx={{ minWidth: 46, width: 46, height: 46, borderRadius: "14px", color: "#fff", bgcolor: "#9a6a3f", "&:hover": { bgcolor: "#b07b4a" } }}
          >
            <AddRoundedIcon />
          </Button>
        </Stack>
        {item.outOfStock && (
          <Typography sx={{ color: "#ff7a84", fontWeight: 700, mt: 1 }}>
            Out of Stock
          </Typography>
        )}
        {!item.outOfStock && disableOrdering && (
          <Typography sx={{ color: "#ffb14a", fontWeight: 700, mt: 1 }}>
            Table is booked. Ordering is locked until staff mark it free.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function MenuPage() {
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [isRetryingMenu, setIsRetryingMenu] = useState(false);
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const [guestPrompt, setGuestPrompt] = useState({ open: false, tableId: "", tableToken: "", guestCount: "1", error: "" });
  const [tableLockNotice, setTableLockNotice] = useState({ locked: false, tableId: "", message: "" });
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const {
    authUser,
    menuItems,
    purchases,
    addToCart,
    tableContext,
    startTableSession,
    clearTableContext,
    refreshMenuItemsFromServer,
  } = useAuth();
  const scannedParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      tableId: String(params.get("tableId") || "").trim(),
      tableToken: String(params.get("tableToken") || "").trim(),
    };
  }, [location.search]);
  const tableOrderingLocked =
    Boolean(scannedParams.tableId) &&
    tableLockNotice.locked &&
    String(tableLockNotice.tableId || "").trim() === scannedParams.tableId &&
    (!tableContext?.sessionId || String(tableContext?.tableId || "").trim() !== scannedParams.tableId);
  const categories = useMemo(
    () => ["All", ...new Set(menuItems.map((item) => item.category))],
    [menuItems]
  );

  const purchaseCounts = useMemo(() => buildPurchaseCounts(purchases), [purchases]);

  const filteredItems = useMemo(() => {
    const filtered = menuItems.filter((item) => {
      const categoryMatch = selectedCategory === "All" || item.category === selectedCategory;
      const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
      return categoryMatch && searchMatch;
    });

    return [...filtered].sort((a, b) => {
      const aSold = getMenuItemPurchasedCount(a, purchaseCounts);
      const bSold = getMenuItemPurchasedCount(b, purchaseCounts);
      if (bSold !== aSold) return bSold - aSold;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [menuItems, purchaseCounts, search, selectedCategory]);

  const handleBuy = (item, size, price) => {
    const isTableGuestMode = Boolean(tableContext?.sessionId);
    if (tableOrderingLocked) {
      setNotice({
        open: true,
        message: tableLockNotice.message || "This table is already booked. Ask staff to mark it free, then scan again.",
        severity: "warning",
      });
      return;
    }
    if (!authUser && !tableContext?.sessionId) {
      navigate("/sign-in", { state: { from: "/menu" } });
      return;
    }

    if (authUser && authUser.role !== "user" && !isTableGuestMode) {
      setNotice({
        open: true,
        message: "Admin accounts cannot buy items. Use a user account.",
        severity: "warning",
      });
      return;
    }

    const result = addToCart({
      menuItemId: item.id,
      itemName: item.name,
      price,
      image: item.image,
      size,
    });
    setNotice({
      open: true,
      message: result.success ? `${item.name} (${size}) added to cart.` : result.message,
      severity: result.success ? "success" : "error",
    });
  };

  const handleRetryMenu = async () => {
    setIsRetryingMenu(true);
    const result = await refreshMenuItemsFromServer({ retries: 2 });
    setIsRetryingMenu(false);
    if (!result?.success) {
      setNotice({
        open: true,
        message: result?.message || "Unable to load menu items.",
        severity: "error",
      });
    }
  };

  useEffect(() => {
    const tableId = scannedParams.tableId;
    const tableToken = scannedParams.tableToken;
    setTableLockNotice({ locked: false, tableId: "", message: "" });
    if (!tableId) return;
    if (tableContext?.sessionId && String(tableContext.tableId || "").trim() === tableId) return;
    const timeoutId = window.setTimeout(() => {
      setGuestPrompt({ open: true, tableId, tableToken, guestCount: "1", error: "" });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [scannedParams.tableId, scannedParams.tableToken, tableContext?.sessionId, tableContext?.tableId]);

  const submitGuestPrompt = async () => {
    const guestCount = Math.round(Number(guestPrompt.guestCount));
    if (!Number.isFinite(guestCount) || guestCount < 1) {
      setGuestPrompt((current) => ({ ...current, error: "Please enter at least 1 guest." }));
      return;
    }
    if (guestCount > 6) {
      setGuestPrompt((current) => ({ ...current, error: "Maximum 6 guests are allowed per table order." }));
      return;
    }

    const result = await startTableSession({
      tableId: guestPrompt.tableId,
      tableToken: guestPrompt.tableToken,
      guestCount,
    });
    if (!result?.success) {
      const failureMessage = result?.message || "Unable to start table session.";
      if (String(failureMessage).toLowerCase().includes("already in use")) {
        setTableLockNotice({
          locked: true,
          tableId: guestPrompt.tableId,
          message: failureMessage,
        });
        setGuestPrompt((current) => ({ ...current, open: false, error: "" }));
        setNotice({
          open: true,
          message: failureMessage,
          severity: "warning",
        });
        return;
      }
      setGuestPrompt((current) => ({ ...current, error: result?.message || "Unable to start table session." }));
      return;
    }

    const label = String(result?.tableLabel || "").trim();
    setTableLockNotice({ locked: false, tableId: "", message: "" });
    setGuestPrompt({ open: false, tableId: "", tableToken: "", guestCount: "1", error: "" });
    setNotice({
      open: true,
      message: label ? `Ordering for ${label}.` : "Table session started.",
      severity: "success",
    });
  };

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <Box sx={{ px: sectionPaddingX, borderBottom: "1px solid rgba(212,178,95,0.2)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 26, color: "primary.main" }}>RESTA FAST FOOD</Typography>
          <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
            <Button component={Link} to="/" startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "text.secondary", fontWeight: 600 }}>Home</Button>
            <Button startIcon={<RestaurantMenuRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "primary.main", fontWeight: 700 }}>Menu</Button>
            <Button component={Link} to="/vip-rooms" startIcon={<MeetingRoomRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "text.secondary", fontWeight: 600 }}>
              VIP Rooms
            </Button>
          </Stack>
          <AuthHeaderActions />
        </Stack>

        {tableContext?.sessionId && (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            gap={1.2}
            sx={{ pb: 2.2 }}
          >
            <Typography sx={{ color: "text.secondary", fontWeight: 700 }}>
              Table session:{" "}
              <Box component="span" sx={{ color: "primary.main" }}>
                {String(tableContext.tableLabel || tableContext.tableId || "").trim() || "Table"}
              </Box>
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                onClick={() => navigate("/checkout")}
                sx={{ borderRadius: 999, px: 2, border: "1px solid rgba(212,178,95,0.28)", color: "text.primary" }}
              >
                Go to Checkout
              </Button>
              <Button
                size="small"
                onClick={() => {
                  clearTableContext();
                  navigate("/menu");
                }}
                sx={{ borderRadius: 999, px: 2, border: "1px solid rgba(255,107,122,0.35)", color: "#ff6b7a" }}
              >
                Clear Table
              </Button>
            </Stack>
          </Stack>
        )}

        {tableOrderingLocked && (
          <Alert
            severity="warning"
            variant="outlined"
            sx={{
              mb: 2.2,
              borderColor: "rgba(255,177,74,0.35)",
              bgcolor: "rgba(255,177,74,0.08)",
              color: "#ffe2b1",
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setTableLockNotice({ locked: false, tableId: "", message: "" });
                  setGuestPrompt({
                    open: true,
                    tableId: scannedParams.tableId,
                    tableToken: scannedParams.tableToken,
                    guestCount: "1",
                    error: "",
                  });
                }}
              >
                Try Again
              </Button>
            }
          >
            {tableLockNotice.message || "This table is already booked. Only the admin can mark it free before another customer scans this QR."}
          </Alert>
        )}
      </Box>

      <Box
        component={motion.div}
        variants={sectionReveal}
        initial="hidden"
        animate="visible"
        sx={{ px: sectionPaddingX, py: { xs: 8, md: 10 }, borderBottom: "1px solid rgba(212,178,95,0.2)" }}
      >
        <Stack spacing={2.5} sx={{ maxWidth: 860, mx: "auto", textAlign: "center" }}>
          <Stack direction="row" spacing={0.8} alignItems="center" justifyContent="center">
            <RestaurantRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
            <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1.1 }}>Delicious Flavors</Typography>
          </Stack>
          <Typography variant="h1" sx={{ fontSize: { xs: "48px", md: "72px" }, lineHeight: 1.06 }}>Explore Our Menu</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 760, mx: "auto" }}>
            From our signature cheese kottu to authentic Sri Lankan set menus, every dish is crafted with
            passion and the finest ingredients.
          </Typography>
        </Stack>
      </Box>

      <Box
        component={motion.div}
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        sx={{ px: sectionPaddingX, py: 3, borderBottom: "1px solid rgba(212,178,95,0.2)" }}
      >
        <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xs: "stretch", lg: "center" }}>
          <Stack direction="row" spacing={1.2} flexWrap="wrap" useFlexGap>
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "contained" : "outlined"}
                color="primary"
                component={motion.button}
                whileTap={reduceMotion ? {} : { scale: 0.96 }}
                sx={{
                  borderRadius: 999,
                  px: 2.6,
                  py: 0.8,
                  borderColor: "rgba(212,178,95,0.35)",
                  color: selectedCategory === category ? "#000" : "#d7dbe3",
                  bgcolor: selectedCategory === category ? "primary.main" : "rgba(32,19,12,0.8)",
                }}
              >
                {category}
              </Button>
            ))}
          </Stack>
          <TextField
            placeholder="Search dishes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            sx={{
              width: { xs: "100%", lg: 380 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 999,
                bgcolor: "#1a110d",
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
      </Box>

      <Box
        component={motion.div}
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        sx={{ px: sectionPaddingX, py: { xs: 4, md: 6 } }}
      >
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <Box
                key={item.name}
                component={motion.div}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.28 }}
              >
                <MenuCard item={item} index={index} onBuy={handleBuy} disableOrdering={tableOrderingLocked} />
              </Box>
            ))}
          </AnimatePresence>
        </Box>
        {filteredItems.length === 0 && (
          <Stack
            spacing={2}
            alignItems="center"
            sx={{
              mt: 4,
              p: 3,
              border: "1px solid rgba(212,178,95,0.24)",
              borderRadius: 2,
              bgcolor: "rgba(23,16,12,0.72)",
            }}
          >
            <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
              {menuItems.length === 0 ? "Menu items are loading from the server." : "No dishes match your filters."}
            </Typography>
            {menuItems.length === 0 && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleRetryMenu}
                disabled={isRetryingMenu}
                sx={{ minWidth: 140 }}
              >
                {isRetryingMenu ? "Loading..." : "Retry"}
              </Button>
            )}
          </Stack>
        )}
      </Box>
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
      <Dialog
        open={guestPrompt.open}
        onClose={() => {}}
        PaperProps={{ sx: { bgcolor: "#0f1116", border: "1px solid rgba(212,178,95,0.22)", color: "text.primary" } }}
      >
        <DialogTitle>How many guests?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", mb: 1.4 }}>
            Enter the number of guests at this table. Maximum 6 guests are allowed.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            type="number"
            value={guestPrompt.guestCount}
            onChange={(event) => setGuestPrompt((current) => ({ ...current, guestCount: event.target.value, error: "" }))}
            inputProps={{ min: 1, max: 6 }}
            error={Boolean(guestPrompt.error)}
            helperText={guestPrompt.error || " "}
            sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#07090d", borderRadius: 2.5 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.2 }}>
          <Button variant="contained" color="primary" onClick={submitGuestPrompt}>
            Start Order
          </Button>
        </DialogActions>
      </Dialog>
      <SiteFooter />
      <BackToTopButton />
    </Box>
  );
}

export default MenuPage;
