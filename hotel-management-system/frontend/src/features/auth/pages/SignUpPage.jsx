import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Alert,
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
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import GoogleIcon from "@mui/icons-material/Google";
import { useAuth } from "../context/AuthContext";

const MotionCard = motion(Card);

function SignUpPage() {
  const navigate = useNavigate();
  const { signup, loginWithGoogle } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [phoneError, setPhoneError] = useState("");
  const [streetAddress1, setStreetAddress1] = useState("");
  const [streetAddress2, setStreetAddress2] = useState("");
  const [cityTown, setCityTown] = useState("");


  const [streetAddress1, setStreetAddress1] = useState("");
  const [streetAddress2, setStreetAddress2] = useState("");
  const [cityTown, setCityTown] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const validateSriLankaMobile = (value) => {
    const digitsOnly = String(value || "").replace(/\D/g, "");
    if (!digitsOnly) return "Mobile number is required.";
    if (digitsOnly.length > 11) return "Mobile number is too long. Use 10 digits (0771234567) or +94771234567.";

    let normalizedDigits = digitsOnly;
    if (normalizedDigits.startsWith("0") && normalizedDigits.length === 10) {
      normalizedDigits = `94${normalizedDigits.slice(1)}`;
    } else if (normalizedDigits.startsWith("7") && normalizedDigits.length === 9) {
      normalizedDigits = `94${normalizedDigits}`;
    }

    if (digitsOnly.length < 9) return "Mobile number is too short. Use 10 digits (0771234567) or +94771234567.";

    if (!/^94[7]\d{8}$/.test(normalizedDigits)) {
      return "Use a valid Sri Lankan mobile number (e.g. 0771234567 or +94771234567).";
    }

    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    setError("");
    const nextPhoneError = validateSriLankaMobile(phone);
    setPhoneError(nextPhoneError);
    if (nextPhoneError) {
      setError(nextPhoneError);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const result = signup({
      fullName,
      email,
      password,
      phone,
      streetAddress1,
      streetAddress2,
      cityTown,
    });
    if (!result.success) {
      setError(result.message);
      return;
    }

    navigate("/sign-in", {
      replace: true,
      state: { signupSuccess: "Account created. Please login." },
    });
  };

  const handleGoogleSignup = () => {
    const result = loginWithGoogle();
    if (!result.success) {
      setError("Google signup failed.");
      return;
    }
    navigate("/", { replace: true });
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
            Create Account
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
              <PersonAddAltRoundedIcon sx={{ color: "primary.main", fontSize: 30 }} />
            </Box>
            <Typography variant="body1" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 520 }}>
              Sign up to create your account.
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", textAlign: "center", maxWidth: 520 }}>
              Use at least 8 characters with uppercase, lowercase, and a number.
            </Typography>
          </Stack>

          <Box component="form" onSubmit={handleSubmit} autoComplete="off">
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8, mb: 1, textTransform: "uppercase" }}>
              Full Name
            </Typography>
            <TextField
              fullWidth
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              type="text"
              name="signup-full-name"
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
              Email Address
            </Typography>
            <TextField
              fullWidth
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              type="email"
              name="signup-email"
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
              Phone Number
            </Typography>
            <TextField
              fullWidth
              value={phone}
              onChange={(event) => {
                const nextValue = event.target.value;
                const nextDigitsLength = String(nextValue || "").replace(/\D/g, "").length;
                if (nextDigitsLength > 11) {
                  setPhoneError(validateSriLankaMobile(nextValue));
                  return;
                }
                setPhone(nextValue);
                if (phoneError) setPhoneError(validateSriLankaMobile(nextValue));
              }}
              onBlur={() => setPhoneError(validateSriLankaMobile(phone))}
              placeholder="e.g. 0771234567 or +94771234567"
              type="tel"
              name="signup-phone"
              error={Boolean(phoneError)}
              helperText={phoneError || " "}
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
              Street Address
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.4} sx={{ mb: 2.2 }}>
              <TextField
                fullWidth
                value={streetAddress1}
                onChange={(event) => setStreetAddress1(event.target.value)}
                placeholder="House number and street name"
                type="text"
                name="signup-street-1"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "#06090f",
                  },
                  "& .MuiInputBase-input": { py: 1.2, fontSize: "15px" },
                }}
              />
              <TextField
                fullWidth
                value={streetAddress2}
                onChange={(event) => setStreetAddress2(event.target.value)}
                placeholder="Apartment, suite, unit, etc. (optional)"
                type="text"
                name="signup-street-2"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 3,
                    bgcolor: "#06090f",
                  },
                  "& .MuiInputBase-input": { py: 1.2, fontSize: "15px" },
                }}
              />
            </Stack>

            <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8, mb: 1, textTransform: "uppercase" }}>
              Town / City
            </Typography>
            <TextField
              fullWidth
              value={cityTown}
              onChange={(event) => setCityTown(event.target.value)}
              placeholder="Enter your town or city"
              type="text"
              name="signup-city"
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
              placeholder="Create a password"
              type={showPassword ? "text" : "password"}
              name="signup-password"
              sx={{
                mb: 2.6,
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

            <Typography sx={{ color: "primary.main", fontWeight: 700, letterSpacing: 0.8, mb: 1, textTransform: "uppercase" }}>
              Confirm Password
            </Typography>
            <TextField
              fullWidth
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              type={showConfirmPassword ? "text" : "password"}
              name="signup-confirm-password"
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
                      <IconButton onClick={() => setShowConfirmPassword((value) => !value)} edge="end" sx={{ color: "text.secondary" }}>
                        {showConfirmPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button type="submit" fullWidth variant="contained" color="primary" sx={{ py: 1.25, fontSize: "22px", color: "#101114" }}>
              Sign Up
            </Button>
            <Stack direction="row" alignItems="center" spacing={1.3} sx={{ my: 2 }}>
              <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(212,178,95,0.22)" }} />
              <Typography sx={{ color: "text.secondary", fontSize: 13, letterSpacing: 0.6 }}>OR</Typography>
              <Box sx={{ flex: 1, height: 1, bgcolor: "rgba(212,178,95,0.22)" }} />
            </Stack>
            <Button
              fullWidth
              onClick={handleGoogleSignup}
              variant="outlined"
              startIcon={<GoogleIcon />}
              sx={{
                py: 1.15,
                borderRadius: 3,
                borderColor: "rgba(212,178,95,0.35)",
                color: "text.primary",
                bgcolor: "rgba(15,20,30,0.55)",
              }}
            >
              Continue with Google
            </Button>
          </Box>

          <Typography sx={{ mt: 2.5, textAlign: "center", color: "text.secondary" }}>
            Already have an account?{" "}
            <Box
              component={Link}
              to="/sign-in"
              sx={{
                ml: 0.8,
                color: "primary.main",
                fontWeight: 700,
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Log In
            </Box>
          </Typography>
        </Box>
      </MotionCard>
    </Box>
  );
}

export default SignUpPage;
