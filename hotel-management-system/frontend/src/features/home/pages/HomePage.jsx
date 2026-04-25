import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Link, useNavigate } from "react-router-dom";
import BackToTopButton from "../../../common/components/ui/BackToTopButton";
import SiteFooter from "../../../common/components/ui/SiteFooter";
import AuthHeaderActions from "../../../common/components/ui/AuthHeaderActions";
import ReviewSection from "../components/ReviewSection";
import { useAuth } from "../../auth/context/AuthContext";
import { getMostBoughtMenuItems } from "../../../common/utils/popularity";
import { isPromotionActiveNow } from "../../../common/utils/pricing";

// NOTE: Image files should be placed in: frontend/public/images/home/
const heroImage = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1920";
const popularImage01 = "https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&q=80&w=800";
const popularImage02 = "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&q=80&w=800";
const popularImage03 = `${import.meta.env.BASE_URL}images/home/deviled/WhatsApp Image 2026-03-20 at 16.39.22.jpeg`;
const vipImage01 = `${import.meta.env.BASE_URL}images/home/VIP1.jpeg`;

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };
const MotionBox = motion.div;
const sectionReveal = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.2, 0.7, 0.2, 1] },
  },
};

const popularItems = [
  {
    name: "Cheese Kottu",
    category: "Kottu",
    description: "Freshly made paratha chopped with vegetables, egg, and creamy cheese sauce.",
    price: "SLR 1500",
    image: popularImage01,
    sizes: ["Small", "Medium", "Large"],
  },
  {
    name: "Chicken Biriyani",
    category: "Biriyani",
    description: "Fragrant basmati rice cooked with aromatic spices and tender chicken.",
    price: "SLR 1100",
    image: popularImage02,
    sizes: ["Small", "Medium", "Large"],
  },
  {
    name: "Deviled Chicken",
    category: "Deviled",
    description: "Spicy and tangy chicken stir-fried with onions, peppers, and chili sauce.",
    price: "SLR 1,000",
    image: popularImage03,
    sizes: ["300g", "500g"],
  },
];

function MenuCard({ item, index, onBuy }) {
  const sizeOptions = Array.isArray(item?.sizes) && item.sizes.length > 0 ? item.sizes : Object.keys(item?.portions || {});
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || "Regular");
  const displayPrice =
    item && item.portions && Object.prototype.hasOwnProperty.call(item.portions, selectedSize)
      ? item.portions[selectedSize]
      : item?.price;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.1 }}
    >
      <Card
        sx={{
          bgcolor: "#17100c",
          border: "1px solid rgba(212,178,95,0.24)",
          overflow: "hidden",
          height: "100%",
          transition: "transform 220ms ease, box-shadow 220ms ease",
          "&:hover": {
            transform: "translateY(-6px)",
            boxShadow: "0 20px 35px rgba(0,0,0,0.45)",
          },
        }}
      >
        <Box
          sx={{
            aspectRatio: "16 / 9",
            overflow: "hidden",
            position: "relative",
            bgcolor: "rgba(0,0,0,0.25)",
          }}
        >
          <Box
            component={motion.div}
            whileHover={{ scale: 1.06 }}
            transition={{ duration: 0.35 }}
            sx={{
              height: "100%",
              width: "100%",
              backgroundImage: `url(${item.image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          />
          <Chip
            label={item.category}
            sx={{
              position: "absolute",
              top: 12,
              right: 12,
              bgcolor: "rgba(16,13,11,0.85)",
              color: "primary.main",
              border: "1px solid rgba(212,178,95,0.3)",
            }}
          />
        </Box>

        <CardContent sx={{ p: 2 }}>
          <Typography variant="h3" sx={{ mb: 0.6, fontSize: { xs: "22px", md: "24px" } }}>
            {item.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mb: 1.4,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description}
          </Typography>

          {sizeOptions.length > 0 && (
            <Stack direction="row" spacing={0.8} sx={{ mb: 1.4 }}>
              {sizeOptions.map((size) => (
                <Button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  variant={selectedSize === size ? "contained" : "outlined"}
                  color="primary"
                  sx={{
                    minWidth: 72,
                    py: 0.35,
                    borderRadius: 999,
                    borderColor: "rgba(212,178,95,0.35)",
                    color: selectedSize === size ? "#000" : "#d7dbe3",
                    bgcolor: selectedSize === size ? "primary.main" : "transparent",
                    "&:hover": {
                      bgcolor: selectedSize === size ? "primary.main" : "rgba(212,178,95,0.12)",
                      borderColor: "primary.main",
                    },
                  }}
                >
                  {size}
                </Button>
              ))}
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
            <Box>
              <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8 }}>
                PRICE
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: "26px", md: "28px" } }}>
                {displayPrice}
              </Typography>
            </Box>
            <Button
              aria-label={`Add ${item.name}`}
              onClick={() => onBuy?.(item, selectedSize, displayPrice)}
              disabled={!onBuy || Boolean(item?.outOfStock)}
              sx={{
                minWidth: 48,
                width: 48,
                height: 48,
                borderRadius: "14px",
                fontSize: 30,
                lineHeight: 1,
                color: "#fff",
                bgcolor: "#9a6a3f",
                "&:hover": { bgcolor: "#b07b4a" },
              }}
            >
              <AddRoundedIcon />
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </MotionBox>
  );
}

function HomePage() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { authUser, addToCart, promotions, menuItems, purchases, tableContext } = useAuth();
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  const heroPromotions = useMemo(() => {
    const list = Array.isArray(promotions) ? promotions : [];

    const getPromoTimestamp = (promotion) => {
      const value = promotion?.updatedAt || promotion?.createdAt || "";
      const timestamp = new Date(value).getTime();
      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    const sortPromotions = (items) =>
      items
        .slice()
        .sort((a, b) => {
          const activeDiff = Number(Boolean(isPromotionActiveNow(b))) - Number(Boolean(isPromotionActiveNow(a)));
          if (activeDiff !== 0) return activeDiff;
          return getPromoTimestamp(b) - getPromoTimestamp(a);
        })
        .slice(0, 8);

    const headerPromotions = list.filter((promotion) => Boolean(promotion?.displayInHomeHeader));
    if (headerPromotions.length > 0) {
      return sortPromotions(headerPromotions);
    }

    return sortPromotions(list.filter((promotion) => isPromotionActiveNow(promotion)));
  }, [promotions]);

  useEffect(() => {
    if (heroPromotions.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % heroPromotions.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [heroPromotions.length]);

  const resolvedHeroIndex = heroPromotions.length > 0 ? activeHeroIndex % heroPromotions.length : 0;
  const activePromotion = heroPromotions[resolvedHeroIndex] || null;
  const heroBackgroundImage = String(activePromotion?.imageUrl || "").trim() || heroImage;
  const primaryCta =
    activePromotion?.type === "vip"
      ? { to: "/vip-rooms", label: "Book VIP Room" }
      : { to: "/menu", label: "Explore Menu" };
  const secondaryCta =
    activePromotion?.type === "vip"
      ? { to: "/menu", label: "Explore Menu" }
      : { to: "/vip-rooms", label: "Book VIP Room" };
  const customerFavorites = useMemo(() => {
    const favorites = getMostBoughtMenuItems({ menuItems, purchases, limit: 3 });
    return favorites.length > 0 ? favorites : popularItems;
  }, [menuItems, purchases]);

  const handleBuy = (item, size, price) => {
    const isTableGuestMode = Boolean(tableContext?.sessionId);
    if (!authUser && !isTableGuestMode) {
      navigate("/sign-in", { state: { from: "/" } });
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
      menuItemId: item?.id,
      itemName: item?.name,
      price,
      image: item?.image,
      size,
    });

    setNotice({
      open: true,
      message: result.success ? `${item?.name} (${size}) added to cart.` : result.message,
      severity: result.success ? "success" : "error",
    });
  };

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary" }}>
      <Box
        component={motion.div}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
        sx={{
          minHeight: "92vh",
          px: sectionPaddingX,
          position: "relative",
          backgroundImage: `linear-gradient(90deg, rgba(6,8,12,0.95) 15%, rgba(7,9,13,0.65) 55%, rgba(7,9,13,0.25) 100%), url(${heroBackgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          rowGap={1.25}
          columnGap={2}
          sx={{ py: 2.5 }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: 18, sm: 22, md: 26 },
              color: "primary.main",
              lineHeight: 1.05,
              flex: "1 1 auto",
            }}
          >
            RESTA FAST FOOD
          </Typography>
          <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <HomeRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography sx={{ color: "primary.main", fontWeight: 600 }}>Home</Typography>
            </Stack>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <RestaurantMenuRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography component={Link} to="/menu" sx={{ color: "text.secondary", fontWeight: 600, textDecoration: "none" }}>
                Menu
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.6} alignItems="center">
              <MeetingRoomRoundedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography component={Link} to="/vip-rooms" sx={{ color: "text.secondary", fontWeight: 600, textDecoration: "none" }}>
                VIP Rooms
              </Typography>
            </Stack>
          </Stack>
          <Box sx={{ flexShrink: 0, ml: "auto" }}>
            <AuthHeaderActions />
          </Box>
        </Stack>

        <Stack
          component={motion.div}
          spacing={2.2}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.2 }}
          sx={{ maxWidth: 760, pt: { xs: 8, md: 12 }, pb: 8 }}
        >
          <Box sx={{ minHeight: { xs: 260, md: 330 } }}>
            <AnimatePresence mode="wait">
              {activePromotion ? (
                  <MotionBox
                  key={activePromotion.id || activePromotion.title || `promo-${resolvedHeroIndex}`}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -18 }}
                  transition={{ duration: reduceMotion ? 0 : 0.38 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    <Chip
                      label="LIMITED TIME OFFER"
                      sx={{
                        bgcolor: "rgba(212,178,95,0.14)",
                        border: "1px solid rgba(212,178,95,0.28)",
                        color: "primary.main",
                        fontWeight: 800,
                        letterSpacing: 0.8,
                        px: 0.4,
                      }}
                    />
                    {activePromotion.discountText && (
                      <Chip
                        icon={<LocalOfferRoundedIcon sx={{ color: "primary.main" }} />}
                        label={activePromotion.discountText}
                        sx={{
                          bgcolor: "rgba(15,20,30,0.55)",
                          border: "1px solid rgba(212,178,95,0.22)",
                          color: "text.primary",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Stack>

                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 900,
                      lineHeight: 1.04,
                      fontSize: { xs: "44px", md: "74px" },
                      letterSpacing: -0.8,
                    }}
                  >
                    {activePromotion.title}
                  </Typography>
                  <Typography sx={{ mt: 1.1, color: "text.secondary", fontSize: { xs: "16px", md: "20px" }, maxWidth: 640 }}>
                    {activePromotion.description}
                  </Typography>
                </MotionBox>
              ) : (
                <MotionBox
                  key="default-hero"
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
                  animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -18 }}
                  transition={{ duration: reduceMotion ? 0 : 0.38 }}
                >
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 800,
                      lineHeight: 1.1,
                      fontSize: { xs: "42px", md: "68px" },
                    }}
                  >
                    Welcome To <br /> Resta Fast Food
                  </Typography>
                  <Typography sx={{ mt: 1.1, color: "text.secondary", fontSize: { xs: "16px", md: "20px" } }}>
                    Serving Happiness in Every Bite
                  </Typography>
                </MotionBox>
              )}
            </AnimatePresence>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  component={Link}
                  to={primaryCta.to}
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowOutwardRoundedIcon />}
                  sx={{
                    px: 4,
                    py: 1.4,
                    "&:hover": {
                      backgroundColor: "#d4b25f",
                      color: "#fff",
                    },
                    "&:active": {
                      backgroundColor: "#bfa84a",
                    },
                  }}
                >
                  {primaryCta.label}
                </Button>

                <Button
                  component={Link}
                  to={secondaryCta.to}
                  variant="outlined"
                  sx={{
                    px: 4,
                    py: 1.4,
                    borderColor: "rgba(212,178,95,0.5)",
                    color: "text.primary",
                    "&:hover": {
                      borderColor: "#d4b25f",
                      color: "#d4b25f",
                      backgroundColor: "rgba(212,178,95,0.1)", // optional light hover background
                    },
                    "&:active": {
                      borderColor: "#bfa84a",
                      color: "#bfa84a",
                      backgroundColor: "rgba(191,168,74,0.2)",
                    },
                  }}
                >
                  {secondaryCta.label}
                </Button>
          </Stack>
        </Stack>

        {heroPromotions.length > 1 && (
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              position: "absolute",
              left: { xs: "50%", md: "58%" },
              bottom: { xs: 20, md: 44 },
              transform: "translateX(-50%)",
              px: 2.2,
              py: 1.4,
              borderRadius: 999,
              bgcolor: "rgba(10,12,16,0.55)",
              border: "1px solid rgba(212,178,95,0.12)",
              backdropFilter: "blur(8px)",
            }}
          >
            {heroPromotions.map((promotion, index) => {
              const isActive = index === resolvedHeroIndex;
              return (
                <Box
                  key={promotion.id || `${promotion.title}-${index}`}
                  component="button"
                  type="button"
                  aria-label={`Show promotion ${index + 1}`}
                  onClick={() => setActiveHeroIndex(index)}
                  sx={{
                    width: isActive ? 40 : 14,
                    height: 14,
                    borderRadius: 999,
                    border: "none",
                    cursor: "pointer",
                    bgcolor: isActive ? "primary.main" : "rgba(255,255,255,0.22)",
                    boxShadow: isActive ? "0 0 18px rgba(212,178,95,0.28)" : "none",
                    transition: "all 180ms ease",
                    p: 0,
                  }}
                />
              );
            })}
          </Stack>
        )}
      </Box>

      <Box
        component={motion.div}
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        sx={{ px: sectionPaddingX, py: { xs: 6, md: 7 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.8}>
              <StarRoundedIcon sx={{ color: "primary.main", fontSize: 16 }} />
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700 }}>Popular Items</Typography>
            </Stack>
            <Typography variant="h2" sx={{ fontSize: { xs: "34px", md: "52px" } }}>Customer Favorites</Typography>
          </Box>
          <Button component={Link} to="/menu" color="primary" endIcon={<ArrowOutwardRoundedIcon />} sx={{ display: { xs: "none", md: "inline-flex" } }}>
            View All Menu
          </Button>
        </Stack>
        <Box
          component={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {customerFavorites.map((item, index) => (
            <Box
              key={item.name}
              component={motion.div}
              variants={{
                hidden: { opacity: 0, y: 14 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
              }}
            >
              <MenuCard item={item} index={index} onBuy={handleBuy} />
            </Box>
          ))}
        </Box>
      </Box>

      <Snackbar
        open={notice.open}
        autoHideDuration={2600}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={notice.severity} variant="filled" sx={{ width: "100%" }}>
          {notice.message}
        </Alert>
      </Snackbar>

    <Box
  component={motion.div}
  variants={sectionReveal}
  initial="hidden"
  whileInView="visible"
  viewport={{ once: true, amount: 0.1 }}
  sx={{ px: sectionPaddingX, py: { xs: 4, md: 8 } }}
>
  <Box
    sx={{
      border: "1px solid rgba(212,178,95,0.2)",
      borderRadius: 6,
      p: { xs: 3, md: 7 },
      display: "grid",
      gridTemplateColumns: { xs: "1fr", md: "1fr 1.15fr" },
      gap: { xs: 5, md: 6 },
      alignItems: "center",
    }}
  >
    {/* Left column: text and button */}
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2.2,
        height: { md: 460 },
      }}
    >
      <Box>
        <Chip
          icon={<WorkspacePremiumRoundedIcon />}
          label="Royal Dining"
          sx={{ mb: 2.5, bgcolor: "rgba(212,178,95,0.12)", color: "primary.main" }}
        />
        <Typography variant="h2" sx={{ fontSize: { xs: "38px", md: "56px" }, mb: 2.5 }}>
          Exclusive <Box component="span" sx={{ color: "primary.main" }}>VIP Suites</Box>
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 3, pr: { md: 3 }, lineHeight: 1.6 }}>
          Elevate your dining experience with our private VIP rooms.
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          width: "100%",
          borderRadius: 3,
          border: "1px solid rgba(212,178,95,0.2)",
          bgcolor: "rgba(212,178,95,0.06)",
          p: 2.4,
          display: "grid",
          alignContent: "center",
          gap: 1.1,
        }}
      >
        <Typography sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.7 }}>
          VIP Experience Includes
        </Typography>
        <Typography sx={{ color: "text.secondary" }}>Dedicated private space for family and group dining.</Typography>
        <Typography sx={{ color: "text.secondary" }}>Priority service with custom table setup.</Typography>
        <Typography sx={{ color: "text.secondary" }}>Premium comfort seating and quiet ambiance.</Typography>
      </Box>

      <Stack spacing={2.2} sx={{ alignItems: "flex-start" }}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip label="Private Entrance" size="small" sx={{ bgcolor: "rgba(212,178,95,0.12)", color: "primary.main" }} />
          <Chip label="Butler Service" size="small" sx={{ bgcolor: "rgba(212,178,95,0.12)", color: "primary.main" }} />
          <Chip label="Premium Seating" size="small" sx={{ bgcolor: "rgba(212,178,95,0.12)", color: "primary.main" }} />
        </Stack>
        <Button
          component={Link}
          to="/vip-rooms"
          variant="contained"
          color="primary"
          endIcon={<ArrowOutwardRoundedIcon />}
          sx={{ px: 4, py: 1.3 }}
        >
          Explore VIP Rooms
        </Button>
      </Stack>
    </Box>

    {/* Right column: single VIP image */}
    <Box
      sx={{ width: "100%" }}
      component={motion.div}
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        component={motion.img}
        src={vipImage01}
        alt="Exclusive VIP Suite"
        whileHover={reduceMotion ? {} : { scale: 1.03 }}
        transition={{ duration: 0.45 }}
        sx={{
          width: "100%",
          height: { xs: 260, md: 460 },
          borderRadius: 3,
          objectFit: "cover",
          display: "block",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      />
    </Box>
  </Box>
</Box>

      <ReviewSection sectionPaddingX={sectionPaddingX} sectionReveal={sectionReveal} />
      
      <SiteFooter />
      <BackToTopButton />
    </Box>
  );
}

export default HomePage;
