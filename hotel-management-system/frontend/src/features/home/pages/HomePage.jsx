import { useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { Link } from "react-router-dom";
import BackToTopButton from "../../../common/components/ui/BackToTopButton";
import SiteFooter from "../../../common/components/ui/SiteFooter";

// NOTE: Image files should be placed in: frontend/public/images/home/
const heroImage = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1920";
const popularImage01 = "/images/home/popular-01.svg";
const popularImage02 = "/images/home/popular-02.svg";
const popularImage03 = "/images/home/popular-03.svg";
const vipImage01 = "/images/home/VIP1.jpeg";
const vipImage02 = "/images/home/vip-02.svg";
const vipImage03 = "/images/home/vip-03.svg";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };
const MotionBox = motion.div;

const popularItems = [
  {
    name: "Cheese Kottu",
    category: "Kottu",
    description: "Freshly made paratha chopped with vegetables, egg, and creamy cheese sauce.",
    price: "SLR 850",
    image: popularImage01,
    sizes: ["Small", "Medium", "Large"],
  },
  {
    name: "Chicken Biriyani",
    category: "Biriyani",
    description: "Fragrant basmati rice cooked with aromatic spices and tender chicken.",
    price: "SLR 950",
    image: popularImage02,
    sizes: ["Small", "Medium", "Large"],
  },
  {
    name: "Deviled Chicken",
    category: "Deviled",
    description: "Spicy and tangy chicken stir-fried with onions, peppers, and chili sauce.",
    price: "SLR 1,200",
    image: popularImage03,
    sizes: ["300g", "500g"],
  },
];

function MenuCard({ item, index }) {
  const [selectedSize, setSelectedSize] = useState(item.sizes[0]);

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
        <Box sx={{ height: 170, overflow: "hidden", position: "relative" }}>
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

          <Stack direction="row" spacing={0.8} sx={{ mb: 1.4 }}>
            {item.sizes.map((size) => (
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

          <Stack direction="row" justifyContent="space-between" alignItems="flex-end">
            <Box>
              <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8 }}>
                PRICE
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: "26px", md: "28px" } }}>
                {item.price}
              </Typography>
            </Box>
            <Button
              aria-label={`Add ${item.name}`}
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
          backgroundImage: `linear-gradient(90deg, rgba(6,8,12,0.95) 15%, rgba(7,9,13,0.65) 55%, rgba(7,9,13,0.25) 100%), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 26, color: "primary.main" }}>RESTA FAST FOOD</Typography>
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
          <Button variant="contained" color="primary" startIcon={<LoginRoundedIcon />}>Sign In</Button>
        </Stack>

        <Stack spacing={3} sx={{ maxWidth: 760, pt: { xs: 8, md: 12 }, pb: 8 }}>
          <Chip
            icon={<LocalOfferRoundedIcon />}
            label="Limited Time Offer"
            sx={{ alignSelf: "flex-start", bgcolor: "rgba(212,178,95,0.12)", color: "primary.main" }}
          />
          <MotionBox initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h1" sx={{ lineHeight: 1.08, fontSize: { xs: "44px", md: "64px" } }}>
              Weekend Special:
              <br />
              20% Off All Kottu!
            </Typography>
          </MotionBox>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            Only this Saturday and Sunday. Grab yours now!
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  component={Link}
                  to="/menu"
                  variant="contained"
                  color="primary"
                  endIcon={<ArrowOutwardRoundedIcon />}
                  sx={{
                    px: 4,
                    py: 1.4,
                    // Hover effect
                    "&:hover": {
                      backgroundColor: "#d4b25f", // change to your desired color
                      color: "#fff",
                    },
                    // Active/click effect
                    "&:active": {
                      backgroundColor: "#bfa84a", // slightly darker on click
                    },
                  }}
                >
                  Explore Menu
                </Button>

                <Button
                  component={Link}
                  to="/vip-rooms"
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
                  Book VIP Room
                </Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.45 }}
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
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 2,
          }}
        >
          {popularItems.map((item, index) => (
            <Box key={item.name}>
              <MenuCard item={item} index={index} />
            </Box>
          ))}
        </Box>
      </Box>

    <Box
  component={motion.div}
  initial={{ opacity: 0, y: 28 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.1 }}
  transition={{ duration: 0.45 }}
  sx={{ px: sectionPaddingX, py: { xs: 4, md: 8 } }}
>
  <Grid
    container
    spacing={{ xs: 3, md: 6 }}
    sx={{
      border: "1px solid rgba(212,178,95,0.2)",
      borderRadius: 6,
      p: { xs: 3, md: 7 },
      alignItems: "center", // vertically center content
    }}
  >
    {/* Left column: text and button */}
    <Grid item xs={12} md={6}>
      <Chip
        icon={<WorkspacePremiumRoundedIcon />}
        label="Royal Dining"
        sx={{ mb: 2.5, bgcolor: "rgba(212,178,95,0.12)", color: "primary.main" }}
      />
      <Typography variant="h2" sx={{ fontSize: { xs: "38px", md: "56px" }, mb: 2.5 }}>
        Exclusive <Box component="span" sx={{ color: "primary.main" }}>VIP Suites</Box>
      </Typography>
      <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, pr: { md: 3 }, lineHeight: 1.6 }}>
        Elevate your dining experience with our private VIP rooms.
      </Typography>
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
    </Grid>

    {/* Right column: single VIP image */}
    <Grid item xs={12} md={6}>
     
      <Box
        sx={{
          width: "100%",            
          height: { xs: 250, md: 400 }, 
          borderRadius: 3,
          backgroundImage: `url(${vipImage01})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        }}
      />
    
    </Grid>
  </Grid>
</Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45 }}
        sx={{ px: sectionPaddingX, py: { xs: 8, md: 10 } }}
      >
        <Grid container spacing={{ xs: 3, md: 6 }} alignItems="stretch">
          <Grid item xs={12} md={5}>
            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 2 }}>
              <FormatQuoteRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700 }}>
                Testimonials
              </Typography>
            </Stack>
            <Typography variant="h2" sx={{ fontSize: { xs: "38px", md: "56px" }, mb: 4, maxWidth: 620 }}>
              What Our Customers <Box component="span" sx={{ color: "primary.main" }}>Say About Us</Box>
            </Typography>
            <Card sx={{ bgcolor: "#140d0a", border: "1px solid rgba(212,178,95,0.15)", minHeight: 180 }}>
              <CardContent sx={{ p: 5, minHeight: 180, display: "grid", placeItems: "center" }}>
                <Typography sx={{ color: "text.secondary", textAlign: "center", fontStyle: "italic" }}>
                  Be the first to share your experience with us!
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.18)", borderRadius: 5, height: "100%",width: "150%" }}>
              <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
                <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mb: 3 }}>
                  <ChatBubbleOutlineRoundedIcon sx={{ color: "text.primary" }} />
                  <Typography variant="h3">Share Your Thoughts</Typography>
                </Stack>

                <Typography sx={{ color: "primary.main", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Your Rating
                </Typography>
                <Rating value={5} readOnly size="large" sx={{ color: "primary.main", mb: 3 }} />

                <Typography sx={{ color: "primary.main", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
                  Your Message
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder="Tell us about your experience..."
                  sx={{
                    mb: 3,
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#07090d",
                      borderRadius: 3,
                    },
                  }}
                />

                <Button variant="contained" color="primary" startIcon={<SendRoundedIcon />} fullWidth sx={{ py: 1.5 }}>
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      <SiteFooter />
      <BackToTopButton />
    </Box>
  );
}

export default HomePage;
