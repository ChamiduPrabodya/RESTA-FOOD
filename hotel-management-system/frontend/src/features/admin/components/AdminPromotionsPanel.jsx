import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CardGiftcardRoundedIcon from "@mui/icons-material/CardGiftcardRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

const today = new Date();
const toIsoDate = (date) => date.toISOString().slice(0, 10);
const plusDays = (baseDate, days) => {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
};

const createInitialForm = () => ({
  title: "",
  description: "",
  type: "food",
  discountType: "percentage",
  discountValue: "0",
  maxDiscount: "0",
  minOrderValue: "0",
  promoCode: "",
  startDate: toIsoDate(today),
  endDate: plusDays(today, 7),
  imageUrl: "",
  displayInHomeHeader: true,
  activateNow: true,
});

function StatCard({ label, value, icon, valueColor = "text.primary" }) {
  return (
    <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
      <CardContent sx={{ p: 2.4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Box sx={{ color: "primary.main" }}>{icon}</Box>
          <Typography sx={{ fontSize: "1.7rem", fontWeight: 800, color: valueColor, lineHeight: 1 }}>{value}</Typography>
        </Stack>
        <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.9 }}>{label}</Typography>
      </CardContent>
    </Card>
  );
}

function PromotionList({ title, icon, items, onToggle }) {
  return (
    <Box sx={{ display: "grid", gap: 1.2 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Box sx={{ color: "primary.main" }}>{icon}</Box>
        <Typography variant="h3" sx={{ fontSize: "1.45rem" }}>
          {title} ({items.length})
        </Typography>
      </Stack>
      <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
        <CardContent sx={{ p: 2.2 }}>
          {items.length === 0 && (
            <Typography sx={{ color: "text.secondary", textAlign: "center", py: 4 }}>
              No promotions yet
            </Typography>
          )}
          <Stack spacing={1.2}>
            {items.map((promo) => (
              <Box
                key={promo.id}
                sx={{
                  p: 1.5,
                  border: "1px solid rgba(212,178,95,0.12)",
                  borderRadius: 3,
                  display: "grid",
                  gap: 0.8,
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Typography sx={{ fontWeight: 700 }}>{promo.title}</Typography>
                  <Button
                    size="small"
                    variant={promo.active ? "contained" : "outlined"}
                    color={promo.active ? "success" : "primary"}
                    onClick={() => onToggle(promo.id)}
                  >
                    {promo.active ? "Active" : "Inactive"}
                  </Button>
                </Stack>
                <Typography sx={{ color: "text.secondary" }}>{promo.description}</Typography>
                <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                  <Typography sx={{ color: "primary.main", fontWeight: 700 }}>{promo.discountText}</Typography>
                  {promo.promoCode && (
                    <Box sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: "rgba(212,178,95,0.2)", color: "primary.main", fontWeight: 700 }}>
                      {promo.promoCode}
                    </Box>
                  )}
                  <Typography sx={{ color: "text.secondary" }}>
                    {promo.startDate} - {promo.endDate}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

function AdminPromotionsPanel({ promotions, addPromotion, togglePromotionStatus }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(createInitialForm());

  const stats = useMemo(() => {
    const activeCount = promotions.filter((item) => item.active).length;
    const foodCount = promotions.filter((item) => item.type === "food").length;
    const vipCount = promotions.filter((item) => item.type === "vip").length;
    return {
      total: promotions.length,
      active: activeCount,
      food: foodCount,
      vip: vipCount,
    };
  }, [promotions]);

  const foodPromotions = promotions.filter((item) => item.type === "food");
  const vipPromotions = promotions.filter((item) => item.type === "vip");

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleAdd = () => {
    const result = addPromotion(form);
    if (!result.success) return;
    setForm(createInitialForm());
    setAdding(false);
  };

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: "24px", md: "30px" } }}>
            Promotions Management
          </Typography>
          <Typography sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: 1 }}>
            Create and manage food and VIP room promotions
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={adding ? <CloseRoundedIcon /> : <AddRoundedIcon />}
          onClick={() => setAdding((current) => !current)}
        >
          {adding ? "Cancel" : "Add Promotion"}
        </Button>
      </Stack>

      {adding && (
        <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 2.4 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <CardGiftcardRoundedIcon sx={{ color: "primary.main" }} />
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1.2 }}>
                New Promotion
              </Typography>
            </Stack>

            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Box>
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                  Promotion Title *
                </Typography>
                <TextField
                  fullWidth
                  value={form.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  placeholder="e.g. Weekend Special 50% Off"
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                />
              </Box>

              <Box>
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                  Description *
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  placeholder="Describe the promotion details..."
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5 }}>
                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    Promotion Type *
                  </Typography>
                  <Select
                    fullWidth
                    value={form.type}
                    onChange={(event) => updateField("type", event.target.value)}
                    sx={{ bgcolor: "#0f1116", borderRadius: 2.5 }}
                  >
                    <MenuItem value="food">Food Items</MenuItem>
                    <MenuItem value="vip">VIP Rooms</MenuItem>
                  </Select>
                </Box>
                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    Discount Type *
                  </Typography>
                  <Select
                    fullWidth
                    value={form.discountType}
                    onChange={(event) => updateField("discountType", event.target.value)}
                    sx={{ bgcolor: "#0f1116", borderRadius: 2.5 }}
                  >
                    <MenuItem value="percentage">Percentage (%)</MenuItem>
                    <MenuItem value="fixed">Fixed Amount (SLR)</MenuItem>
                  </Select>
                </Box>

                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    Discount Value *
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={form.discountValue}
                    onChange={(event) => updateField("discountValue", event.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    Max Discount (SLR)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={form.maxDiscount}
                    onChange={(event) => updateField("maxDiscount", event.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    Min Order Value (SLR)
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={form.minOrderValue}
                    onChange={(event) => updateField("minOrderValue", event.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    Promo Code
                  </Typography>
                  <TextField
                    fullWidth
                    value={form.promoCode}
                    onChange={(event) => updateField("promoCode", event.target.value.toUpperCase())}
                    placeholder="E.G. WEEKEND50"
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                  />
                </Box>

                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    Start Date *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={form.startDate}
                    onChange={(event) => updateField("startDate", event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                    End Date *
                  </Typography>
                  <TextField
                    fullWidth
                    type="date"
                    value={form.endDate}
                    onChange={(event) => updateField("endDate", event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700, mb: 0.6 }}>
                  Promotion Image URL (for header display)
                </Typography>
                <TextField
                  fullWidth
                  value={form.imageUrl}
                  onChange={(event) => updateField("imageUrl", event.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116", borderRadius: 2.5 } }}
                />
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.displayInHomeHeader}
                      onChange={(event) => updateField("displayInHomeHeader", event.target.checked)}
                    />
                  }
                  label="Display in home page header carousel"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.activateNow}
                      onChange={(event) => updateField("activateNow", event.target.checked)}
                    />
                  }
                  label="Activate promotion immediately"
                />
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={handleAdd}>
                  Add Promotion
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CloseRoundedIcon />}
                  onClick={() => {
                    setAdding(false);
                    setForm(createInitialForm());
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" }, gap: 1.2 }}>
        <StatCard label="Total Promotions" value={stats.total} icon={<LocalOfferOutlinedIcon />} />
        <StatCard label="Active Promotions" value={stats.active} icon={<CardGiftcardRoundedIcon />} valueColor="#00d26a" />
        <StatCard label="Food Promotions" value={stats.food} icon={<LocalOfferOutlinedIcon />} valueColor="#2f8dff" />
        <StatCard label="VIP Promotions" value={stats.vip} icon={<CardGiftcardRoundedIcon />} valueColor="#a757ff" />
      </Box>

      <PromotionList title="Food Promotions" icon={<LocalOfferOutlinedIcon />} items={foodPromotions} onToggle={togglePromotionStatus} />
      <PromotionList title="VIP Room Promotions" icon={<CardGiftcardRoundedIcon />} items={vipPromotions} onToggle={togglePromotionStatus} />
    </Box>
  );
}

export default AdminPromotionsPanel;
