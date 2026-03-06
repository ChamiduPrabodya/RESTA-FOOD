import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };

const menuItems = [
  {
    name: "Cheese Kottu",
    category: "Kottu",
    description: "Freshly made paratha chopped with vegetables and creamy cheese sauce.",
    portions: {
      Small: "SLR 850",
      Medium: "SLR 1,150",
      Large: "SLR 1,450",
    },
    image: "/images/home/popular-01.svg",
  },
  {
    name: "Chicken Biriyani",
    category: "Biriyani",
    description: "Fragrant basmati rice cooked with aromatic spices and tender chicken.",
    portions: {
      Small: "SLR 950",
      Medium: "SLR 1,250",
      Large: "SLR 1,550",
    },
    image: "/images/home/popular-02.svg",
  },
  {
    name: "Seafood Rice",
    category: "Rice",
    description: "Sri Lankan style seafood rice with prawns and cuttlefish.",
    portions: {
      Small: "SLR 1,100",
      Medium: "SLR 1,450",
      Large: "SLR 1,850",
    },
    image: "/images/home/popular-02.svg",
  },
  {
    name: "Deviled Chicken",
    category: "Deviled",
    description: "Spicy and tangy chicken stir-fried with onions and peppers.",
    portions: {
      "300g": "SLR 1,200",
      "500g": "SLR 1,800",
      "1kg": "SLR 3,300",
    },
    image: "/images/home/popular-03.svg",
  },
  {
    name: "Black Curry Beef",
    category: "Black Curry",
    description: "Slow-cooked black curry beef with roasted spices and deep flavor.",
    portions: {
      "300g": "SLR 1,350",
      "500g": "SLR 2,000",
      "1kg": "SLR 3,700",
    },
    image: "/images/home/popular-03.svg",
  },
  {
    name: "Chicken Isstu",
    category: "Isstu",
    description: "Classic rich gravy style isstu made with tender chicken and spices.",
    portions: {
      "300g": "SLR 1,150",
      "500g": "SLR 1,700",
      "1kg": "SLR 3,100",
    },
    image: "/images/home/popular-01.svg",
  },
  {
    name: "Creamy Pasta",
    category: "Pasta",
    description: "Penne pasta in rich cream sauce with chicken strips.",
    portions: {
      Regular: "SLR 1,050",
    },
    image: "/images/home/popular-01.svg",
  },
  {
    name: "Family Set Menu",
    category: "Set Menu",
    description: "Special combo for four with mains, sides, and beverages.",
    portions: {
      Regular: "SLR 3,800",
    },
    image: "/images/home/popular-03.svg",
  },
];

const categories = ["All", "Kottu", "Rice", "Biriyani", "Deviled", "Black Curry", "Isstu", "Pasta", "Set Menu"];
const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: [0.2, 0.7, 0.2, 1] },
  },
};

function MenuCard({ item, index, onBuy }) {
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
      <Box sx={{ height: 180, backgroundImage: `url(${item.image})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
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
            sx={{ minWidth: 46, width: 46, height: 46, borderRadius: "14px", color: "#fff", bgcolor: "#9a6a3f", "&:hover": { bgcolor: "#b07b4a" } }}
          >
            <AddRoundedIcon />
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

function MenuPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { authUser, addToCart } = useAuth();

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const categoryMatch = selectedCategory === "All" || item.category === selectedCategory;
      const searchMatch = item.name.toLowerCase().includes(search.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [search, selectedCategory]);

  const handleBuy = (item, size, price) => {
    if (!authUser) {
      navigate("/sign-in", { state: { from: "/menu" } });
      return;
    }

    if (authUser.role !== "user") {
      setNotice({
        open: true,
        message: "Admin accounts cannot buy items. Use a user account.",
        severity: "warning",
      });
      return;
    }

    const result = addToCart({
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
                <MenuCard item={item} index={index} onBuy={handleBuy} />
              </Box>
            ))}
          </AnimatePresence>
        </Box>
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
      <SiteFooter />
      <BackToTopButton />
    </Box>
  );
}

export default MenuPage;
