import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useAuth } from "../../auth/context/AuthContext";
import { parsePriceNumber } from "../../../common/utils/pricing";

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

function AdminCustomersPanel({ users, purchases }) {
  const { loyaltyRules, updateLoyaltyRule, addLoyaltyRule, removeLoyaltyRule } = useAuth();
  const [isConfiguring, setIsConfiguring] = useState(false);

  const rows = useMemo(() => {
    const byEmail = new Map();

    purchases.forEach((purchase) => {
      const email = String(purchase.userEmail || "").trim().toLowerCase();
      if (!email) return;
      const current = byEmail.get(email) || { email, orders: 0, points: 0 };
      current.orders += 1;
      current.points += Object.prototype.hasOwnProperty.call(purchase, "loyaltyPointsEarned")
        ? Number(purchase.loyaltyPointsEarned) || 0
        : parsePriceNumber(purchase.price);
      byEmail.set(email, current);
    });

    users.forEach((user) => {
      const email = String(user.email || "").trim().toLowerCase();
      if (!email || !byEmail.has(email)) {
        byEmail.set(email, { email, orders: 0, points: 0 });
      }
    });

    const usersByEmail = new Map(users.map((user) => [String(user.email || "").trim().toLowerCase(), user]));
    const sortedRules = [...(Array.isArray(loyaltyRules) ? loyaltyRules : [])]
      .map((rule) => ({
        threshold: Number(rule.threshold) || 0,
        discount: Number(rule.discount) || 0,
      }))
      .sort((a, b) => a.threshold - b.threshold);

    return [...byEmail.values()]
      .map((row) => {
        const user = usersByEmail.get(row.email);
        const fullName = user?.fullName || row.email.split("@")[0] || "Customer";
        const matchedRule = sortedRules.reduce(
          (best, rule) => (row.points >= rule.threshold ? rule : best),
          null
        );
        return {
          ...row,
          fullName,
          discount: matchedRule?.discount || 0,
        };
      })
      .sort((a, b) => b.points - a.points)
      .slice(0, 8);
  }, [purchases, loyaltyRules, users]);

  const updateRule = (id, field, value) => updateLoyaltyRule(id, field, value);
  const addRule = () => addLoyaltyRule();
  const removeRuleById = (id) => removeLoyaltyRule(id);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: "24px", md: "30px" } }}>
            Customer Loyalty Management
          </Typography>
          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>
            Manage tiers and view engagement
          </Typography>
        </Box>
        {!isConfiguring ? (
          <Button variant="contained" color="primary" onClick={() => setIsConfiguring(true)}>
            Configure Tiers
          </Button>
        ) : (
          <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={() => setIsConfiguring(false)}>
            Save Tiers
          </Button>
        )}
      </Stack>

      <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4, overflow: "hidden" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "2fr 2.6fr 1.3fr 1.7fr", px: 2.5, py: 2, bgcolor: "#0f1116" }}>
          <Typography sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", fontSize: "0.9rem" }}>Customer</Typography>
          <Typography sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", fontSize: "0.9rem" }}>Email</Typography>
          <Typography sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", fontSize: "0.9rem" }}>Orders</Typography>
          <Typography sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", fontSize: "0.9rem" }}>Loyalty Points</Typography>
        </Box>
        {rows.map((row) => (
          (() => {
            const tier = getLoyaltyTier(row.points);
            return (
          <Box
            key={row.email}
            sx={{
              display: "grid",
              gridTemplateColumns: "2fr 2.6fr 1.3fr 1.7fr",
              px: 2.5,
              py: 2.2,
              borderTop: "1px solid rgba(212,178,95,0.1)",
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={0.8} alignItems="center">
              <Typography sx={{ fontWeight: 700 }}>{row.fullName}</Typography>
              <Box
                sx={{
                  px: 0.85,
                  py: 0.22,
                  borderRadius: 99,
                  bgcolor: tier.bg,
                  border: `1px solid ${tier.border}`,
                  color: tier.color,
                  fontWeight: 700,
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {tier.label}
              </Box>
            </Stack>
            <Typography sx={{ color: "text.secondary" }}>{row.email}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{row.orders}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography sx={{ color: "primary.main", fontWeight: 800, fontSize: "1.35rem", lineHeight: 1 }}>{row.points}</Typography>
              <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.85rem" }}>PTS</Typography>
              {row.discount > 0 && (
                <Box sx={{ ml: 1.2, px: 1, py: 0.3, borderRadius: 1, bgcolor: "rgba(212,178,95,0.2)", color: "primary.main", fontWeight: 700 }}>
                  {row.discount}% OFF
                </Box>
              )}
            </Stack>
          </Box>
            );
          })()
        ))}
      </Card>

      {isConfiguring && (
        <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4, p: 2.2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.6 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PercentRoundedIcon sx={{ color: "primary.main" }} />
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                Discount Rules
              </Typography>
            </Stack>
            <Button startIcon={<AddRoundedIcon />} onClick={addRule} sx={{ color: "primary.main" }}>
              Add Rule
            </Button>
          </Stack>

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
            {loyaltyRules.map((rule) => (
              <Box key={rule.id} sx={{ border: "1px solid rgba(212,178,95,0.15)", borderRadius: 3, p: 1.6 }}>
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.8rem", mb: 0.6 }}>
                  Points Threshold
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={rule.threshold}
                  onChange={(event) => updateRule(rule.id, "threshold", event.target.value)}
                  sx={{ mb: 1.2, "& .MuiOutlinedInput-root": { bgcolor: "#110d0c", borderRadius: 2 } }}
                />
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.8rem", mb: 0.6 }}>
                  Discount %
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    size="small"
                    value={rule.discount}
                    onChange={(event) => updateRule(rule.id, "discount", event.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#110d0c", borderRadius: 2 } }}
                  />
                  <IconButton color="error" onClick={() => removeRuleById(rule.id)}>
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Box>
        </Card>
      )}
    </Box>
  );
}

export default AdminCustomersPanel;
