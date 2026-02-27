import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import LocalMallOutlinedIcon from "@mui/icons-material/LocalMallOutlined";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import AirRoundedIcon from "@mui/icons-material/AirRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import BackToTopButton from "../../../common/components/ui/BackToTopButton";
import SiteFooter from "../../../common/components/ui/SiteFooter";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };

const suites = [
  {
    id: "platinum",
    name: "The Platinum Suite",
    guests: "Up to 15 Guests",
    seats: 15,
    price: "SLR 15,000 / Session",
    image: "/images/home/vip-01.svg",
    features: ["Full AC", '75" Smart TV', "Private Sound System", "Dedicated Butler", "RGB Ambient Lighting"],
  },
  {
    id: "gold",
    name: "The Gold Chamber",
    guests: "Up to 6 Guests",
    seats: 6,
    price: "SLR 8,000 / Session",
    image: "/images/home/vip-02.svg",
    features: ["Full AC", '55" Smart TV', "Private Sound System", "Private Entrance", "Soft Gold Theme"],
  },
];

function VipRoomsPage() {
  const [suiteId, setSuiteId] = useState("platinum");

  return (
    <Box sx={{ bgcolor: "background.default", color: "text.primary", minHeight: "100vh" }}>
      <Box sx={{ px: sectionPaddingX, borderBottom: "1px solid rgba(212,178,95,0.2)" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 26, color: "primary.main" }}>RESTA FAST FOOD</Typography>
          <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
            <Button component={Link} to="/" startIcon={<HomeRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "text.secondary", fontWeight: 600 }}>Home</Button>
            <Button component={Link} to="/menu" startIcon={<RestaurantMenuRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "text.secondary", fontWeight: 600 }}>Menu</Button>
            <Button startIcon={<MeetingRoomRoundedIcon sx={{ fontSize: 18 }} />} sx={{ color: "primary.main", fontWeight: 700 }}>VIP Rooms</Button>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LocalMallOutlinedIcon sx={{ color: "text.secondary" }} />
            <Button variant="contained" color="primary" startIcon={<LoginRoundedIcon />}>Sign In</Button>
          </Stack>
        </Stack>
      </Box>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        sx={{
          px: sectionPaddingX,
          py: { xs: 8, md: 10 },
          textAlign: "center",
          borderBottom: "1px solid rgba(212,178,95,0.2)",
          backgroundImage: "linear-gradient(180deg, rgba(5,7,10,0.88), rgba(5,7,10,0.96)), url('/images/home/vip-03.svg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Stack spacing={2.5} sx={{ maxWidth: 980, mx: "auto" }}>
          <Button
            startIcon={<WorkspacePremiumRoundedIcon />}
            sx={{
              alignSelf: "center",
              color: "primary.main",
              border: "1px solid rgba(212,178,95,0.4)",
              borderRadius: 999,
              px: 2.5,
              py: 0.5,
            }}
          >
            Royal Dining Experience
          </Button>
          <Typography variant="h1" sx={{ fontSize: { xs: "52px", md: "88px" }, lineHeight: 1.02 }}>
            Exclusive <Box component="span" sx={{ color: "primary.main" }}>VIP Rooms</Box>
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 900, mx: "auto" }}>
            Elevate your gatherings with our premium private dining suites. Experience luxury,
            privacy, and unparalleled service tailored to your needs.
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ px: sectionPaddingX, py: { xs: 4, md: 6 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 2.2,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 2fr" },
            alignItems: "start",
          }}
        >
          <Card
            component={motion.div}
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
            sx={{
              bgcolor: "#2a170d",
              border: "1px solid rgba(212,178,95,0.2)",
              borderRadius: 6,
              p: 3.2,
              position: { lg: "sticky" },
              top: { lg: 18 },
            }}
          >
            <Typography variant="h3" sx={{ mb: 3 }}>Reserve a Suite</Typography>

            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <InputLabel sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.9 }}>
                Room Type
              </InputLabel>
              <Select
                value={suiteId}
                label="Room Type"
                onChange={(event) => setSuiteId(event.target.value)}
                sx={{ borderRadius: 3, bgcolor: "#07090d" }}
              >
                {suites.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({item.seats} Seats)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={1.8} sx={{ mb: 2.5 }}>
              <TextField fullWidth label="Date" type="date" slotProps={{ inputLabel: { shrink: true } }} sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#07090d", borderRadius: 3 } }} />
              <TextField fullWidth label="Time" type="time" slotProps={{ inputLabel: { shrink: true } }} sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#07090d", borderRadius: 3 } }} />
            </Stack>

            <TextField fullWidth label="Number of Guests" defaultValue={4} sx={{ mb: 2.8, "& .MuiOutlinedInput-root": { bgcolor: "#07090d", borderRadius: 3 } }} />

            <Button variant="contained" color="primary" fullWidth sx={{ py: 1.6, mb: 2.2 }}>
              Check Availability
            </Button>
            <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", textTransform: "uppercase", fontWeight: 700 }}>
              No Payment Required Now
            </Typography>
          </Card>

          <Stack spacing={2.2}>
            {suites.map((suite) => (
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{ duration: 0.42, delay: suite.id === "gold" ? 0.1 : 0 }}
                key={suite.id}
                sx={{
                  display: "grid",
                  gap: 0,
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                }}
              >
                <Box
                  sx={{
                    borderTopLeftRadius: 6,
                    borderBottomLeftRadius: { md: 6 },
                    borderTopRightRadius: { xs: 6, md: 0 },
                    minHeight: 330,
                    backgroundImage: `url(${suite.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: "1px solid rgba(212,178,95,0.2)",
                    borderRight: { md: "none" },
                  }}
                />

                <Card
                  component={motion.div}
                  whileHover={{ y: -5 }}
                  sx={{ bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.2)", borderRadius: { xs: "0 0 24px 24px", md: "0 24px 24px 0" }, p: 3.2 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Typography variant="h2" sx={{ fontSize: { xs: "40px", md: "52px" }, lineHeight: 1.02 }}>{suite.name}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <WorkspacePremiumRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                      <Typography sx={{ color: "primary.main", fontWeight: 700 }}>Premium</Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="h3" sx={{ color: "primary.main", fontSize: "36px", mb: 2 }}>{suite.guests}</Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.4, mb: 2.5 }}>
                    {suite.features.map((feature) => (
                      <Stack key={feature} direction="row" spacing={1} alignItems="flex-start">
                        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: "#00d26a", mt: 0.2 }} />
                        <Typography variant="body1" sx={{ color: "text.secondary" }}>{feature}</Typography>
                      </Stack>
                    ))}
                  </Box>

                  <Box sx={{ borderTop: "1px solid rgba(212,178,95,0.18)", pt: 2.2 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700 }}>
                      Base Booking Fee
                    </Typography>
                    <Typography variant="h3" sx={{ fontSize: "44px" }}>{suite.price}</Typography>
                  </Box>
                </Card>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.8, mt: 2.4 }}>
          {[
            { icon: <MusicNoteRoundedIcon />, label: "Personalized Audio" },
            { icon: <AirRoundedIcon />, label: "Air Conditioned" },
            { icon: <Groups2RoundedIcon />, label: "Private Butler" },
            { icon: <SecurityRoundedIcon />, label: "Complete Privacy" },
          ].map((item) => (
            <Card
              key={item.label}
              component={motion.div}
              whileHover={{ y: -4, scale: 1.01 }}
              sx={{ bgcolor: "#140d0a", border: "1px solid rgba(212,178,95,0.12)", borderRadius: 4, p: 2.6, textAlign: "center" }}
            >
              <Box sx={{ color: "primary.main", mb: 1 }}>{item.icon}</Box>
              <Typography sx={{ fontWeight: 600 }}>{item.label}</Typography>
            </Card>
          ))}
        </Box>
      </Box>
      <SiteFooter />
      <BackToTopButton />
    </Box>
  );
}

export default VipRoomsPage;
