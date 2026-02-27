import { Link } from "react-router-dom";
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookOutlinedIcon from "@mui/icons-material/FacebookOutlined";
import XIcon from "@mui/icons-material/X";
import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };

function SiteFooter() {
  return (
    <Box sx={{ mt: 5, borderTop: "1px solid rgba(212,178,95,0.2)", px: sectionPaddingX, py: { xs: 5, md: 7 } }}>
      <Box
        sx={{
          display: "grid",
          gap: 3,
          gridTemplateColumns: { xs: "1fr", md: "1.2fr 1fr 1fr 1.2fr" },
          pb: 4,
          borderBottom: "1px solid rgba(212,178,95,0.2)",
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 34, color: "primary.main", lineHeight: 1 }}>RESTA</Typography>
          <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 1.2, mb: 2 }}>FAST FOOD</Typography>
          <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 350, mb: 2.2 }}>
            Bringing premium Sri Lankan fast food to your doorstep. Experience the perfect blend of spice,
            aroma, and luxury.
          </Typography>
          <Stack direction="row" spacing={1.2}>
            {[<InstagramIcon key="ig" />, <FacebookOutlinedIcon key="fb" />, <XIcon key="x" />].map((icon, index) => (
              <IconButton key={index} sx={{ bgcolor: "#2a170d", color: "primary.main", "&:hover": { bgcolor: "#3a2213" } }}>
                {icon}
              </IconButton>
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1.8 }}>QUICK LINKS</Typography>
          <Stack spacing={1.2}>
            <Button component={Link} to="/" sx={{ justifyContent: "flex-start", color: "text.secondary", px: 0 }}>Home</Button>
            <Button component={Link} to="/menu" sx={{ justifyContent: "flex-start", color: "text.secondary", px: 0 }}>Our Menu</Button>
            <Button component={Link} to="/vip-rooms" sx={{ justifyContent: "flex-start", color: "text.secondary", px: 0 }}>VIP Booking</Button>
            <Button sx={{ justifyContent: "flex-start", color: "text.secondary", px: 0 }}>Contact Us</Button>
          </Stack>
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1.8 }}>CONTACT INFO</Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <LocationOnOutlinedIcon sx={{ color: "primary.main", mt: 0.2 }} />
              <Typography sx={{ color: "text.secondary" }}>456 Galle Road, Colombo 03, Sri Lanka</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneOutlinedIcon sx={{ color: "primary.main" }} />
              <Typography sx={{ color: "text.secondary" }}>+94 11 234 5678</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <AccessTimeOutlinedIcon sx={{ color: "primary.main" }} />
              <Typography sx={{ color: "text.secondary" }}>Mon - Sun: 10:00 AM - 11:00 PM</Typography>
            </Stack>
          </Stack>
        </Box>

        <Box>
          <Typography sx={{ fontWeight: 700, mb: 1.8 }}>NEWSLETTER</Typography>
          <Typography sx={{ color: "text.secondary", mb: 2 }}>Subscribe to get latest offers and discounts.</Typography>
          <TextField
            fullWidth
            placeholder="Email"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#2a170d" } }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton sx={{ bgcolor: "primary.main", color: "#111", "&:hover": { bgcolor: "#ddb860" } }}>
                      <ArrowOutwardRoundedIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.2} sx={{ pt: 2.2 }}>
        <Typography sx={{ color: "text.secondary" }}>© 2026 Resta Fast Food. All Rights Reserved.</Typography>
        <Stack direction="row" spacing={2}>
          <Typography sx={{ color: "text.secondary" }}>Privacy Policy</Typography>
          <Typography sx={{ color: "text.secondary" }}>Terms of Service</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

export default SiteFooter;

