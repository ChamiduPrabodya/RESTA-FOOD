import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import AirRoundedIcon from "@mui/icons-material/AirRounded";
import Groups2RoundedIcon from "@mui/icons-material/Groups2Rounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import BackToTopButton from "../../../common/components/ui/BackToTopButton";
import SiteFooter from "../../../common/components/ui/SiteFooter";
import { useAuth } from "../../auth/context/AuthContext";
import AuthHeaderActions from "../../../common/components/ui/AuthHeaderActions";

const sectionPaddingX = { xs: 2.5, sm: 5, md: 8, lg: 12 };
const sectionReveal = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.46, ease: [0.2, 0.7, 0.2, 1] },
  },
};

const PUBLIC_ASSET_BASE = String(import.meta.env?.BASE_URL || "/");

const suites = [
  {
    id: "platinum",
    name: "The Platinum Suite",
    guests: "Up to 15 Guests",
    seats: 15,
    price: "SLR 15,000 / Session",
    image: `${PUBLIC_ASSET_BASE}images/home/VIP1.jpeg`,
    features: ["Full AC", '75" Smart TV', "Private Sound System", "Dedicated Butler", "RGB Ambient Lighting"],
  },
  {
    id: "gold",
    name: "The Gold Chamber",
    guests: "Up to 6 Guests",
    seats: 6,
    price: "SLR 8,000 / Session",
    image: `${PUBLIC_ASSET_BASE}images/home/VIP2.jpeg`,
    features: ["Full AC", '55" Smart TV', "Private Sound System", "Private Entrance", "Soft Gold Theme"],
  },
];
const TIME_SLOTS = [
  { value: "11:00-14:00", label: "11:00 AM - 02:00 PM" },
  { value: "14:00-17:00", label: "02:00 PM - 05:00 PM" },
  { value: "17:00-20:00", label: "05:00 PM - 08:00 PM" },
  { value: "20:00-23:00", label: "08:00 PM - 11:00 PM" },
];
const LEGACY_SLOT_MAP = {
  "10:00-12:00": "11:00-14:00",
  "11:00-13:00": "11:00-14:00",
  "12:00-15:00": "14:00-17:00",
  "13:00-16:00": "14:00-17:00",
  "15:00-18:00": "17:00-20:00",
  "16:00-19:00": "17:00-20:00",
  "18:00-21:00": "20:00-23:00",
  "19:00-22:00": "20:00-23:00",
  "10:00": "11:00-14:00",
  "11:00": "11:00-14:00",
  "12:00": "14:00-17:00",
  "13:00": "14:00-17:00",
  "15:00": "17:00-20:00",
  "16:00": "17:00-20:00",
  "18:00": "20:00-23:00",
  "19:00": "20:00-23:00",
};
const getTodayDateText = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const mapLegacyTimeToSlot = (timeValue) => {
  if (!timeValue) return "";
  const normalized = String(timeValue).trim();
  if (Object.prototype.hasOwnProperty.call(LEGACY_SLOT_MAP, normalized)) {
    return LEGACY_SLOT_MAP[normalized];
  }
  if (normalized.includes("-")) return normalized;
  const found = TIME_SLOTS.find((slot) => slot.value.startsWith(normalized));
  return found ? found.value : normalized;
};

const getBookingSlots = (booking) => {
  if (!booking) return [];
  const rawSlots = Array.isArray(booking.timeSlots)
    ? booking.timeSlots
    : String(booking.time || "").includes("|")
      ? String(booking.time || "")
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean)
      : [booking.time];

  return rawSlots
    .map((value) => mapLegacyTimeToSlot(value))
    .filter(Boolean);
};
// validation vip room booking:
function VipRoomsPage() {
  const [suiteId, setSuiteId] = useState("platinum");
  const [bookingDate, setBookingDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [guests, setGuests] = useState(4);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { authUser, vipBookings, addVipBooking } = useAuth();
  const todayDateText = useMemo(() => getTodayDateText(), []);
  const minBookingDate = todayDateText;
  const selectedSuite = useMemo(() => suites.find((suite) => suite.id === suiteId) || suites[0], [suiteId]);
  const maxGuests = Math.max(1, Number(selectedSuite?.seats) || 1);
  const selectedSlots = useMemo(() => {
    const normalized = String(timeSlot || "").trim();
    return normalized ? [normalized] : [];
  }, [timeSlot]);
  const bookedSlotsForToday = useMemo(() => {
    if (!todayDateText) return new Set();
    return new Set(
      vipBookings
        .filter(
          (booking) =>
            booking.suiteId === suiteId &&
            booking.date === todayDateText &&
            String(booking.status || "").toLowerCase() !== "cancelled"
        )
        .flatMap((booking) => getBookingSlots(booking))
    );
  }, [vipBookings, suiteId, todayDateText]);
  const bookedSlotsForSelectedDate = useMemo(() => {
    if (!bookingDate) return new Set();
    return new Set(
      vipBookings
        .filter(
          (booking) =>
            booking.suiteId === suiteId &&
            booking.date === bookingDate &&
            String(booking.status || "").toLowerCase() !== "cancelled"
        )
        .flatMap((booking) => getBookingSlots(booking))
    );
  }, [vipBookings, suiteId, bookingDate]);
  const isSelectedDateFullyBooked = bookingDate && bookedSlotsForSelectedDate.size >= TIME_SLOTS.length;
  const isSelectedSlotBooked = useMemo(() => {
    if (selectedSlots.length === 0) return false;
    return bookedSlotsForSelectedDate.has(selectedSlots[0]);
  }, [selectedSlots, bookedSlotsForSelectedDate]);
  const isSelectedSlotExpired = useMemo(() => {
    if (!bookingDate || selectedSlots.length === 0) return false;
    if (bookingDate !== todayDateText) return false;
    const slotValue = selectedSlots[0];
    const startTime = String(slotValue || "").split("-")[0]?.trim();
    if (!/^\d{2}:\d{2}$/.test(startTime)) return false;
    const now = new Date();
    const slotStart = new Date(`${bookingDate}T${startTime}:00`);
    if (Number.isNaN(slotStart.getTime())) return false;
    return now.getTime() >= slotStart.getTime();
  }, [bookingDate, selectedSlots, todayDateText]);

  const formatSelectedSlots = () => {
    if (selectedSlots.length === 0) return "";
    return TIME_SLOTS.find((slot) => slot.value === selectedSlots[0])?.label || selectedSlots[0];
  };

  const handleCheckAvailability = async () => {
    if (submitting) return;

    if (!authUser) {
      navigate("/sign-in", { state: { from: "/vip-rooms" } });
      return;
    }

    if (authUser.role !== "user") {
      setNotice({
        open: true,
        message: "Admin accounts cannot book rooms. Use a user account.",
        severity: "warning",
      });
      return;
    }

    if (bookingDate && bookingDate < todayDateText) {
      setNotice({
        open: true,
        message: "Booking date cannot be in the past.",
        severity: "error",
      });
      return;
    }

    if (bookingDate && isSelectedDateFullyBooked) {
      setNotice({
        open: true,
        message: "Selected date is fully booked. Please choose another date.",
        severity: "error",
      });
      return;
    }

    if (bookingDate && selectedSlots.length > 0 && isSelectedSlotBooked) {
      setNotice({
        open: true,
        message: "Selected time slot is already booked. Please choose another slot.",
        severity: "error",
      });
      return;
    }

    if (bookingDate && selectedSlots.length > 0 && isSelectedSlotExpired) {
      setNotice({
        open: true,
        message: "Selected time slot has already started. Please choose a later slot.",
        severity: "error",
      });
      return;
    }

    if (!bookingDate || selectedSlots.length === 0 || !guests) {
      setNotice({
        open: true,
        message: !bookingDate
          ? "Please select a booking date."
          : selectedSlots.length === 0
            ? "Please select an available time slot."
            : "Please add guest count.",
        severity: "error",
      });
      return;
    }

    if (!TIME_SLOTS.some((slot) => slot.value === selectedSlots[0])) {
      setNotice({
        open: true,
        message: "Please select a valid time slot.",
        severity: "error",
      });
      return;
    }

    if (!Number.isFinite(Number(guests)) || Number(guests) < 1 || Number(guests) > maxGuests) {
      setNotice({
        open: true,
        message: `Guest count must be between 1 and ${maxGuests}.`,

        severity: "error",
      });
      return;
    }

    try {
      setSubmitting(true);
      const result = await addVipBooking?.({
        suiteId,
        date: bookingDate,
        timeSlots: selectedSlots,
        time: selectedSlots[0],
        guests,
      });

      setNotice({
        open: true,
        message: result?.success ? "VIP booking request submitted." : result?.message || "Unable to submit booking.",
        severity: result?.success ? "success" : "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

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
          <AuthHeaderActions />
        </Stack>
      </Box>

      <Box
        component={motion.div}
        variants={sectionReveal}
        initial="hidden"
        animate="visible"
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
          <Typography variant="h1" sx={{ fontSize: { xs: "55px", md: "75px" }, lineHeight: 1.02 }}>
            Exclusive <Box component="span" sx={{ color: "primary.main" }}>VIP Rooms</Box>
          </Typography>
          <Typography variant="body1" sx={{  fontSize: "1.4rem", color: "text.secondary", maxWidth: 900, mx: "auto" }}>
            Elevate your gatherings with our premium private dining suites. Experience luxury,
            privacy, and unparalleled service tailored to your needs.
          </Typography>
        </Stack>
      </Box>

      <Box
        component={motion.div}
        variants={sectionReveal}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.12 }}
        sx={{ px: sectionPaddingX, py: { xs: 4, md: 6 } }}
      >
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
            <Typography sx={{ color: "text.secondary", mb: 2.2 }}>
              Booked slots today ({todayDateText}):{" "}
              {bookedSlotsForToday.size > 0
                ? TIME_SLOTS
                  .filter((slot) => bookedSlotsForToday.has(slot.value))
                  .map((slot) => slot.label)
                  .join(", ")
                : "No bookings yet"}
            </Typography>

            <FormControl fullWidth sx={{ mb: 2.5 }}>
              <InputLabel sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.9 }}>
                Room Type
              </InputLabel>
              <Select
                value={suiteId}
                label="Room Type"
                onChange={(event) => {
                  setSuiteId(event.target.value);
                  const nextSuite = suites.find((suite) => suite.id === event.target.value);
                  const nextMax = Math.max(1, Number(nextSuite?.seats) || 1);
                  setGuests((current) => Math.min(nextMax, Math.max(1, Number(current) || 1)));
                  setBookingDate("");
                  setTimeSlot("");
                }}
                sx={{ borderRadius: 3, bgcolor: "#07090d" }}
              >
                {suites.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({item.seats} Seats)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.8} sx={{ mb: 2.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography
                  sx={{
                    color: "text.secondary",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: 0.9,
                    fontSize: "0.86rem",
                    mb: 0.6,
                  }}
                >
                  Date
                </Typography>
                <TextField
                  fullWidth
                  type="date"
                  value={bookingDate}
                  onChange={(event) => {
                    setBookingDate(event.target.value);
                    setTimeSlot("");
                  }}
                  inputProps={{ min: minBookingDate }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <CalendarMonthRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#07090d",
                      borderRadius: 3,
                    },
                    "& .MuiInputBase-input": {
                      py: 1.05,
                      fontWeight: 700,
                    },
                    "& input::-webkit-calendar-picker-indicator": {
                      position: "absolute",
                      right: 0,
                      width: 56,
                      height: "100%",
                      opacity: 0,
                      cursor: "pointer",
                    },
                  }}
                />
              </Box>
              <FormControl fullWidth sx={{ flex: 1, minWidth: { sm: 280 } }}>
                <InputLabel sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.9 }}>
                  Time Slot
                </InputLabel>
                <Select
                  value={timeSlot}
                  label="Time Slot"
                  onChange={(event) => setTimeSlot(event.target.value)}
                  sx={{ borderRadius: 3, bgcolor: "#07090d" }}
                  disabled={!bookingDate || isSelectedDateFullyBooked}
                >
                  {TIME_SLOTS.map((slot) => {
                    const booked = bookedSlotsForSelectedDate.has(slot.value);
                    const isToday = bookingDate === todayDateText;
                    const startTime = String(slot.value || "").split("-")[0]?.trim();
                    const slotStart = isToday && /^\d{2}:\d{2}$/.test(startTime) ? new Date(`${bookingDate}T${startTime}:00`) : null;
                    const expired = Boolean(isToday && slotStart && !Number.isNaN(slotStart.getTime()) && Date.now() >= slotStart.getTime());
                    const disabled = booked || expired;
                    const suffix = booked ? "(Booked)" : expired ? "(Expired)" : "";
                    return (
                      <MenuItem key={slot.value} value={slot.value} disabled={disabled}>
                        {slot.label} {suffix}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Stack>
            {selectedSlots.length > 0 && (
              <Typography sx={{ color: isSelectedSlotBooked || isSelectedSlotExpired ? "#ff7a84" : "text.secondary", mb: 1.2 }}>
                Selected: {formatSelectedSlots()}
              </Typography>
            )}
            {bookingDate === todayDateText && bookedSlotsForSelectedDate.size > 0 && (
              <Typography sx={{ color: "text.secondary", mb: 1.8 }}>
                Booked slots today:{" "}
                {TIME_SLOTS
                  .filter((slot) => bookedSlotsForSelectedDate.has(slot.value))
                  .map((slot) => slot.label)
                  .join(", ")}
              </Typography>
            )}

            <TextField
              fullWidth
              label="Number of Guests"
              value={guests}
              type="number"
              inputProps={{ min: 1, max: maxGuests, step: 1 }}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                const clamped = Math.min(maxGuests, Math.max(1, Number.isFinite(nextValue) ? nextValue : 1));
                setGuests(clamped);
              }}
              helperText={`Max ${maxGuests} guests for ${selectedSuite?.name || "this suite"}`}
              sx={{ mb: 2.8, "& .MuiOutlinedInput-root": { bgcolor: "#07090d", borderRadius: 3 } }}
            />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ py: 1.6, mb: 2.2 }}
              onClick={handleCheckAvailability}
              disabled={submitting || isSelectedDateFullyBooked}
            >
              {submitting ? "Submitting..." : "Check Availability"}
            </Button>
            {isSelectedDateFullyBooked && (
              <Typography sx={{ color: "text.secondary", textAlign: "center", mb: 1.1 }}>
                Selected date is fully booked. Please choose another date.
              </Typography>
            )}
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
                  component={motion.div}
                  whileHover={reduceMotion ? {} : { scale: 1.02 }}
                  transition={{ duration: 0.35 }}
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
                  whileHover={reduceMotion ? {} : { y: -6, scale: 1.01 }}
                  sx={{ bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.2)", borderRadius: { xs: "0 0 24px 24px", md: "0 24px 24px 0" }, p: 3.2 }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Typography variant="h2" sx={{ fontSize: { xs: "40px", md: "45px" }, lineHeight: 1.02 }}>{suite.name}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <WorkspacePremiumRoundedIcon sx={{ fontSize: 18, color: "primary.main" }} />
                      <Typography sx={{ color: "primary.main", fontWeight: 700 }}>Premium</Typography>
                    </Stack>
                  </Stack>
                  <Typography variant="h3" sx={{ color: "primary.main", fontSize: "30px", mb: 2 }}>{suite.guests}</Typography>

                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.4, mb: 2.5 }}>
                    {suite.features.map((feature, featureIndex) => (
                      <Stack
                        key={feature}
                        direction="row"
                        spacing={1}
                        alignItems="flex-start"
                        component={motion.div}
                        initial={{ opacity: 0, x: -8 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.25, delay: featureIndex * 0.04 }}
                      >
                        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 18, color: "#00d26a", mt: 0.2 }} />
                        <Typography variant="body1" sx={{ color: "text.secondary" }}>{feature}</Typography>
                      </Stack>
                    ))}
                  </Box>

                  <Box sx={{ borderTop: "1px solid rgba(212,178,95,0.18)", pt: 2.2 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700 }}>
                      Base Booking Fee
                    </Typography>
                    <Typography variant="h3" sx={{ fontSize: "25px" }}>{suite.price}</Typography>
                  </Box>
                </Card>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box
          component={motion.div}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.07 } },
          }}
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1.8, mt: 2.4 }}
        >
          {[
            { icon: <MusicNoteRoundedIcon />, label: "Personalized Audio" },
            { icon: <AirRoundedIcon />, label: "Air Conditioned" },
            { icon: <Groups2RoundedIcon />, label: "Private Butler" },
            { icon: <SecurityRoundedIcon />, label: "Complete Privacy" },
          ].map((item) => (
            <Card
              key={item.label}
              component={motion.div}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
              }}
              whileHover={reduceMotion ? {} : { y: -5, scale: 1.02 }}
              sx={{ bgcolor: "#140d0a", border: "1px solid rgba(212,178,95,0.12)", borderRadius: 4, p: 2.6, textAlign: "center" }}
            >
              <Box sx={{ color: "primary.main", mb: 1 }}>{item.icon}</Box>
              <Typography sx={{ fontWeight: 600 }}>{item.label}</Typography>
            </Card>
          ))}
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

export default VipRoomsPage;
