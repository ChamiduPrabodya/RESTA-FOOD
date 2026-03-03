import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

const MotionCard = motion(Card);

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, sm: 3 },
        py: { xs: 3, md: 5 },
        display: "grid",
        placeItems: "center",
        bgcolor: "#04070c",
        backgroundImage:
          "radial-gradient(circle at 7% 35%, rgba(38,81,145,0.25), transparent 26%), radial-gradient(circle at 93% 20%, rgba(212,178,95,0.15), transparent 24%)",
      }}
    >
      <MotionCard
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        sx={{
          width: "100%",
          maxWidth: 700,
          borderRadius: 5,
          overflow: "hidden",
          border: "1px solid rgba(212,178,95,0.22)",
          bgcolor: "#05080d",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: { xs: 2.5, md: 3.5 },
            py: 2,
            bgcolor: "#161012",
            borderBottom: "1px solid rgba(212,178,95,0.16)",
          }}
        >
          <Typography variant="h2" sx={{ fontSize: { xs: "32px", md: "36px" } }}>
            Welcome Back
          </Typography>
          <IconButton onClick={() => navigate(-1)} sx={{ color: "text.secondary" }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Box sx={{ px: { xs: 2.5, md: 6 }, py: { xs: 3.2, md: 4.5 } }}>
          <Stack alignItems="center" spacing={2.2} sx={{ mb: 3.4 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: 3,
                border: "1px solid rgba(212,178,95,0.24)",
                bgcolor: "rgba(212,178,95,0.08)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <PersonOutlineRoundedIcon sx={{ color: "primary.main", fontSize: 30 }} />
            </Box>
            <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 520 }}>
              Login to your account 
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit} autoComplete="off">
            <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8, mb: 1, textTransform: "uppercase" }}>
              Email Address
            </Typography>
            <TextField
              fullWidth
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              type="email"
              autoComplete="off"
              name="signin-email"
              sx={{
                mb: 2.6,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#06090f",
                },
                "& .MuiInputBase-input": { py: 1.2, fontSize: "15px" },
              }}
            />

            <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8, mb: 1, textTransform: "uppercase" }}>
              Password
            </Typography>
            <TextField
              fullWidth
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              name="signin-password"
              sx={{
                mb: 3.2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  bgcolor: "#06090f",
                },
                "& .MuiInputBase-input": { py: 1.2, fontSize: "15px" },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword((value) => !value)} edge="end" sx={{ color: "text.secondary" }}>
                        {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button type="submit" fullWidth variant="contained" color="primary" sx={{ py: 1.25, fontSize: "22px", color: "#101114" }}>
              Log In
            </Button>
          </Box>

          <Typography sx={{ mt: 2.5, textAlign: "center", color: "text.secondary" }}>
            Don&apos;t have an account?{" "}
            <Box component="span" sx={{ ml: 0.8, color: "primary.main", fontWeight: 700 }}>
              Sign Up
            </Box>
          </Typography>

        </Box>
      </MotionCard>
    </Box>
  );
}

export default SignInPage;
