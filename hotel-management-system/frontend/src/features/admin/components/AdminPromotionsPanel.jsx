import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Snackbar,
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
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import ImagePicker from "../../../common/components/ui/ImagePicker.jsx";

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

function PromotionList({ title, icon, items, onToggle, onEdit, onDelete }) {
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
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Button
                      size="small"
                      variant={promo.active ? "contained" : "outlined"}
                      color={promo.active ? "success" : "primary"}
                      onClick={() => onToggle(promo.id)}
                    >
                      {promo.active ? "Active" : "Inactive"}
                    </Button>
                    <Button size="small" variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => onEdit(promo)}>
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteRoundedIcon />}
                      onClick={() => onDelete(promo)}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Stack>
                <Typography sx={{ color: "text.secondary" }}>{promo.description}</Typography>
                <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                  <Typography sx={{ color: "primary.main", fontWeight: 700 }}>{promo.discountText}</Typography>
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

const createFormFromPromotion = (promotion) => ({
  title: String(promotion?.title || ""),
  description: String(promotion?.description || ""),
  type: promotion?.type === "vip" ? "vip" : "food",
  discountType: promotion?.discountType === "fixed" ? "fixed" : "percentage",
  discountValue: String(promotion?.discountValue ?? "0"),
  maxDiscount: String(promotion?.maxDiscount ?? "0"),
  minOrderValue: String(promotion?.minOrderValue ?? "0"),
  startDate: String(promotion?.startDate || toIsoDate(today)),
  endDate: String(promotion?.endDate || plusDays(today, 7)),
  imageUrl: String(promotion?.imageUrl || ""),
  displayInHomeHeader: Boolean(promotion?.displayInHomeHeader),
  activateNow: Boolean(promotion?.active),
});

function AdminPromotionsPanel({
  promotions,
  addPromotion,
  togglePromotionStatus,
  updatePromotion,
  deletePromotion,
}) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPromotionId, setEditingPromotionId] = useState(null);
  const [form, setForm] = useState(createInitialForm());
  const [notice, setNotice] = useState({ open: false, message: "", severity: "warning" });
  const isEditing = Boolean(editingPromotionId);

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

  const showNotice = (message, severity = "warning") => {
    setNotice({ open: true, message, severity });
  };

  const showNegativeValueWarning = () => {
    const message = "Negative values are not allowed for promotions.";
    showNotice(message);
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.setTimeout(() => {
        window.alert(message);
      }, 0);
    }
  };

  const showBlockingMessage = (message, severity = "warning") => {
    const text = String(message || "").trim() || "Please check the promotion details.";
    showNotice(text, severity);
    if (typeof window !== "undefined" && typeof window.alert === "function") {
      window.setTimeout(() => {
        window.alert(text);
      }, 0);
    }
  };

  const preventNegativeInput = (event) => {
    const key = String(event?.key || "");
    if (key === "-" || key === "Subtract") {
      event.preventDefault();
      showNegativeValueWarning();
    }
  };

  const preventNegativePaste = (event) => {
    const pastedText = String(event?.clipboardData?.getData("text") || "").trim();
    if (pastedText.startsWith("-")) {
      event.preventDefault();
      showNegativeValueWarning();
    }
  };

  const updateNonNegativeNumberField = (field, value) => {
    const nextValue = String(value ?? "");
    if (nextValue === "") {
      updateField(field, "");
      return;
    }

    if (nextValue.trim().startsWith("-")) {
      updateField(field, "0");
      showNegativeValueWarning();
      return;
    }

    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) return;

    if (parsed < 0) {
      updateField(field, "0");
      showNegativeValueWarning();
      return;
    }

    updateField(field, nextValue);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingPromotionId(null);
    setForm(createInitialForm());
  };

  const startAdd = () => {
    setEditingPromotionId(null);
    setForm(createInitialForm());
    setFormOpen(true);
  };

  const startEdit = (promotion) => {
    setEditingPromotionId(promotion.id);
    setForm(createFormFromPromotion(promotion));
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    const discountValue = Number(form.discountValue);
    const maxDiscount = Number(form.maxDiscount || 0);
    const minOrderValue = Number(form.minOrderValue || 0);

    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      showBlockingMessage("Discount value must be greater than zero.");
      return;
    }
    if (maxDiscount < 0) {
      showBlockingMessage("Max discount cannot be negative.");
      return;
    }
    if (minOrderValue < 0) {
      showBlockingMessage("Min order value cannot be negative.");
      return;
    }

    const result = await (isEditing ? updatePromotion(editingPromotionId, form) : addPromotion(form));
    if (!result.success) {
      showBlockingMessage(result.message || "Unable to save promotion.", "error");
      return;
    }
    closeForm();
  };

  const handleDelete = async (promotion) => {
    const confirmed = window.confirm(`Delete promotion "${promotion.title}"? This can't be undone.`);
    if (!confirmed) return;
    const result = await deletePromotion(promotion.id);
    if (!result.success) return;
    if (editingPromotionId === promotion.id) {
      closeForm();
    }
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
          startIcon={formOpen ? <CloseRoundedIcon /> : <AddRoundedIcon />}
          onClick={() => (formOpen ? closeForm() : startAdd())}
        >
          {formOpen ? "Cancel" : "Add Promotion"}
        </Button>
      </Stack>

      {formOpen && (
        <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 2.4 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <CardGiftcardRoundedIcon sx={{ color: "primary.main" }} />
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1.2 }}>
                {isEditing ? "Edit Promotion" : "New Promotion"}
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
                      onChange={(event) => updateNonNegativeNumberField("discountValue", event.target.value)}
                      onKeyDown={preventNegativeInput}
                      onPaste={preventNegativePaste}
                      inputProps={{ min: 0, step: "any" }}
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
                      onChange={(event) => updateNonNegativeNumberField("maxDiscount", event.target.value)}
                      onKeyDown={preventNegativeInput}
                      onPaste={preventNegativePaste}
                      inputProps={{ min: 0, step: "any" }}
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
                      onChange={(event) => updateNonNegativeNumberField("minOrderValue", event.target.value)}
                      onKeyDown={preventNegativeInput}
                      onPaste={preventNegativePaste}
                      inputProps={{ min: 0, step: "any" }}
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
                  Promotion Image (for header display)
                </Typography>
                <ImagePicker
                  label="Promotion Image"
                  value={form.imageUrl}
                  onChange={(nextValue) => updateField("imageUrl", nextValue)}
                  placeholder="Paste an image URL or drag & drop a file"
                  sx={{ mt: 0.4 }}
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
                  label={isEditing ? "Promotion active" : "Activate promotion immediately"}
                />
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button variant="contained" color="success" startIcon={<CheckRoundedIcon />} onClick={handleSubmit}>
                  {isEditing ? "Save Changes" : "Add Promotion"}
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<CloseRoundedIcon />}
                  onClick={closeForm}
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

      <PromotionList
        title="Food Promotions"
        icon={<LocalOfferOutlinedIcon />}
        items={foodPromotions}
        onToggle={togglePromotionStatus}
        onEdit={startEdit}
        onDelete={handleDelete}
      />
      <PromotionList
        title="VIP Room Promotions"
        icon={<CardGiftcardRoundedIcon />}
        items={vipPromotions}
        onToggle={togglePromotionStatus}
        onEdit={startEdit}
        onDelete={handleDelete}
      />

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
    </Box>
  );
}

export default AdminPromotionsPanel;
