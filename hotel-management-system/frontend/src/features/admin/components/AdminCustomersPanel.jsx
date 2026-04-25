import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PercentRoundedIcon from "@mui/icons-material/PercentRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useAuth } from "../../auth/context/AuthContext";
import { getPurchasePoints, isCompletedPurchase } from "../../../common/utils/pricing";

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

function AdminCustomersPanel({ users, purchases, pointsByEmail }) {
  const { loyaltyRules, saveLoyaltyRulesToServer } = useAuth();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [notice, setNotice] = useState({ open: false, message: "", severity: "warning" });
  const [blockingDialog, setBlockingDialog] = useState({ open: false, message: "" });
  const ruleListEndRef = useRef(null);
  const [draftRules, setDraftRules] = useState(() =>
    (Array.isArray(loyaltyRules) ? loyaltyRules : []).map((rule) => ({ ...rule }))
  );

  const rows = useMemo(() => {
    const byEmail = new Map();
    const pointsMap = pointsByEmail && typeof pointsByEmail === "object" ? pointsByEmail : null;

    purchases.forEach((purchase) => {
      const email = String(purchase.userEmail || "").trim().toLowerCase();
      if (!email) return;
      const current = byEmail.get(email) || { email, orders: 0, points: 0 };
      current.orders += 1;
      if (!pointsMap && isCompletedPurchase(purchase)) {
        current.points += getPurchasePoints(purchase);
      }
      byEmail.set(email, current);
    });

    users.forEach((user) => {
      const email = String(user.email || "").trim().toLowerCase();
      if (!email || !byEmail.has(email)) {
        byEmail.set(email, { email, orders: 0, points: 0 });
      }
    });

    if (pointsMap) {
      byEmail.forEach((row, email) => {
        row.points = Math.max(0, Math.round(Number(pointsMap[email]) || 0));
      });
    }

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
  }, [purchases, loyaltyRules, users, pointsByEmail]);

  const updateRule = (id, field, value) => {
    const normalizedField = field === "discount" ? "discount" : "threshold";
    const normalizedId = String(id || "");

    const nextValue = String(value ?? "");
    if (nextValue === "") {
      setDraftRules((current) =>
        (Array.isArray(current) ? current : []).map((rule) =>
          String(rule.id) === normalizedId ? { ...rule, [normalizedField]: "" } : rule
        )
      );
      return;
    }

    const numeric = Number(nextValue);
    if (!Number.isFinite(numeric)) {
      return;
    }

    if (normalizedField === "threshold" && numeric < 0) {
      const message = "Threshold must be 0 or more.";
      setNotice({ open: true, message, severity: "error" });
      setBlockingDialog({ open: true, message });
      return;
    }

    if (normalizedField === "discount") {
      if (numeric < 0) {
        const message = "Discount must be between 0 and 100.";
        setNotice({ open: true, message, severity: "error" });
        setBlockingDialog({ open: true, message });
        return;
      }
      if (numeric > 100) {
        const message = "Discount cannot be over 100%.";
        setNotice({ open: true, message, severity: "error" });
        setBlockingDialog({ open: true, message });
        return;
      }
    }

    setDraftRules((current) =>
      (Array.isArray(current) ? current : []).map((rule) =>
        String(rule.id) === normalizedId ? { ...rule, [normalizedField]: nextValue } : rule
      )
    );
  };

  const addRule = () => {
    const nextId = `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setDraftRules((current) => [...(Array.isArray(current) ? current : []), { id: nextId, threshold: "", discount: "" }]);
    window.setTimeout(() => {
      ruleListEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);
  };

  const removeRuleById = (id) => {
    const normalizedId = String(id || "");
    setDraftRules((current) => (Array.isArray(current) ? current : []).filter((rule) => String(rule.id) !== normalizedId));
  };
  const getThresholdError = (value, id = "") => {
    const normalized = String(value ?? "").trim();
    if (!normalized) return "Threshold is required.";

    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return "Threshold must be 0 or more.";
    }

    const normalizedThreshold = String(Math.round(numeric));
    const hasDuplicate = (Array.isArray(draftRules) ? draftRules : []).some((rule) => {
      if (String(rule?.id || "") === String(id || "")) return false;
      const ruleThreshold = Number(rule?.threshold);
      return Number.isFinite(ruleThreshold) && String(Math.round(ruleThreshold)) === normalizedThreshold;
    });
    if (hasDuplicate) {
      return `Duplicate threshold: ${normalizedThreshold} points already exists.`;
    }

    return "";
  };

  const getDiscountError = (value) => {
    const normalized = String(value ?? "").trim();
    if (!normalized) return "Discount is required.";

    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric < 0) {
      return "Discount must be between 0 and 100.";
    }
    if (numeric > 100) {
      return "Discount cannot be over 100%.";
    }
    return "";
  };

  const handleSaveTiers = async () => {
    if (!Array.isArray(draftRules) || draftRules.length === 0) {
      const message = "Add at least one loyalty tier before saving.";
      setNotice({
        open: true,
        message,
        severity: "error",
      });
      setBlockingDialog({ open: true, message });
      return;
    }

    const invalidThresholdRule = (Array.isArray(draftRules) ? draftRules : []).find(
      (rule) => Boolean(getThresholdError(rule.threshold, rule.id))
    );
    if (invalidThresholdRule) {
      const message = getThresholdError(invalidThresholdRule.threshold, invalidThresholdRule.id);
      setNotice({
        open: true,
        message,
        severity: "error",
      });
      setBlockingDialog({ open: true, message });
      return;
    }

    const invalidRule = (Array.isArray(draftRules) ? draftRules : []).find(
      (rule) => Boolean(getDiscountError(rule.discount))
    );

    if (invalidRule) {
      const message = getDiscountError(invalidRule.discount);
      setNotice({
        open: true,
        message,
        severity: "error",
      });
      setBlockingDialog({ open: true, message });
      return;
    }

    const result = await saveLoyaltyRulesToServer?.(draftRules);
    if (!result?.success) {
      const message = result?.message || "Unable to save loyalty rules.";
      setNotice({
        open: true,
        message,
        severity: "error",
      });
      setBlockingDialog({ open: true, message });
      return;
    }

    setNotice({ open: true, message: "Loyalty tiers saved.", severity: "success" });
    setIsConfiguring(false);
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        useFlexGap
        gap={1}
        sx={
          isConfiguring
            ? {
                position: "sticky",
                top: 0,
                zIndex: 4,
                px: { xs: 1.2, md: 1.6 },
                py: 1.1,
                borderRadius: 3,
                border: "1px solid rgba(212,178,95,0.12)",
                bgcolor: "rgba(15,17,22,0.92)",
                backdropFilter: "blur(14px)",
              }
            : undefined
        }
      >
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: "24px", md: "30px" } }}>
            Customer Loyalty Management
          </Typography>
          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>
            Manage tiers and view engagement
          </Typography>
        </Box>
        {!isConfiguring ? (
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setDraftRules((Array.isArray(loyaltyRules) ? loyaltyRules : []).map((rule) => ({ ...rule })));
              setIsConfiguring(true);
            }}
          >
            Configure Tiers
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => {
                setDraftRules((Array.isArray(loyaltyRules) ? loyaltyRules : []).map((rule) => ({ ...rule })));
                setIsConfiguring(false);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckRoundedIcon />}
              onClick={handleSaveTiers}
            >
              Save Tiers
            </Button>
          </Stack>
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
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.6 }} flexWrap="wrap" useFlexGap gap={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PercentRoundedIcon sx={{ color: "primary.main" }} />
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>
                Discount Rules
              </Typography>
            </Stack>
            <Typography sx={{ color: "text.secondary", fontSize: "0.92rem" }}>
              New loyalty levels will be added at the bottom of this section.
            </Typography>
          </Stack>

          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
            {draftRules.map((rule) => (
              <Box key={rule.id} sx={{ border: "1px solid rgba(212,178,95,0.15)", borderRadius: 3, p: 1.6 }}>
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontSize: "0.8rem", mb: 0.6 }}>
                  Points Threshold
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={rule.threshold}
                  onChange={(event) => updateRule(rule.id, "threshold", event.target.value)}
                  type="number"
                  inputProps={{ min: 0, step: "1" }}
                  error={Boolean(getThresholdError(rule.threshold, rule.id))}
                  helperText={getThresholdError(rule.threshold, rule.id) || " "}
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
                    type="number"
                    inputProps={{ min: 0, max: 100, step: "any" }}
                    error={Boolean(getDiscountError(rule.discount))}
                    helperText={getDiscountError(rule.discount) || " "}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#110d0c", borderRadius: 2 } }}
                  />
                  <IconButton color="error" onClick={() => removeRuleById(rule.id)}>
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Box>

          <Box ref={ruleListEndRef} />

          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            gap={1}
            sx={{
              mt: 1.8,
              pt: 1.8,
              borderTop: "1px solid rgba(212,178,95,0.12)",
            }}
          >
            <Typography sx={{ color: "text.secondary", fontSize: "0.92rem" }}>
              Add another tier below the current list, then use the save button pinned at the top.
            </Typography>
            <Button startIcon={<AddRoundedIcon />} onClick={addRule} sx={{ color: "primary.main" }}>
              Add Loyalty Level
            </Button>
          </Stack>
        </Card>
      )}

      <Snackbar
        open={notice.open}
        autoHideDuration={2500}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => setNotice((current) => ({ ...current, open: false }))}
          sx={{ width: "100%" }}
        >
          {notice.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={blockingDialog.open}
        onClose={() => setBlockingDialog({ open: false, message: "" })}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            bgcolor: "#17100c",
            border: "1px solid rgba(212,178,95,0.18)",
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: "primary.main", fontWeight: 800 }}>Loyalty Validation</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.primary" }}>{blockingDialog.message}</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.4 }}>
          <Button variant="contained" color="primary" onClick={() => setBlockingDialog({ open: false, message: "" })}>
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminCustomersPanel;
