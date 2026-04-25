import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Switch,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ImagePicker from "../../../common/components/ui/ImagePicker.jsx";

const DEFAULT_MENU_CATEGORIES = [
  "Kottu",
  "Rice",
  "Biriyani",
  "Deviled",
  "Black Curry",
  "Pasta",
  "Set Menu",
  "family pack",
];

const normalizeCategoryKey = (value) => String(value || "").toLowerCase().replace(/[\s_-]+/g, "");

const PORTION_PRESETS = Object.freeze({
  smallMediumLarge: ["Small", "Medium", "Large"],
  weights: ["300g", "500g", "1kg"],
  regular: ["Regular"],
});

const getPortionPresetNames = (category) => {
  const key = normalizeCategoryKey(category);
  if (key === "deviled" || key === "blackcurry" || key === "blackcurrybeef") return PORTION_PRESETS.weights;
  if (key === "kottu" || key === "rice" || key === "biriyani") return PORTION_PRESETS.smallMediumLarge;
  return PORTION_PRESETS.regular;
};

const buildPortionRowsFromNames = (names) =>
  (Array.isArray(names) ? names : []).map((name) => ({
    id: crypto.randomUUID(),
    name,
    price: "",
  }));

const shouldReplacePortionsWithPreset = (rows) => {
  const list = Array.isArray(rows) ? rows : [];
  if (list.length !== 1) return false;
  const onlyRow = list[0] || {};
  const name = String(onlyRow.name || "").trim().toLowerCase();
  const price = String(onlyRow.price || "").trim();
  const isDefaultName = !name || name === "regular";
  return isDefaultName && !price;
};

const toPortionRows = (portions) => {
  const rows = Object.entries(portions || {}).map(([name, price]) => ({
    id: crypto.randomUUID(),
    name,
    price: String(price ?? "").replace(/[^\d.]/g, ""),
  }));
  return rows.length > 0 ? rows : [{ id: crypto.randomUUID(), name: "Regular", price: "" }];
};

const normalizeLkrPriceLabel = (rawValue) => {
  const normalized = String(rawValue ?? "").trim();
  if (!normalized) return "";
  const numeric = Number(normalized.replace(/[^\d.]/g, "")) || 0;
  return `Rs ${Math.round(numeric).toLocaleString()}`;
};

const normalizePortions = (rows) => {
  const portions = rows
    .filter((portion) => String(portion.name || "").trim() && String(portion.price || "").trim())
    .reduce((acc, portion) => {
      acc[String(portion.name).trim()] = normalizeLkrPriceLabel(portion.price);
      return acc;
    }, {});
  if (Object.keys(portions).length > 0) return portions;

  const fallbackName = String(rows[0]?.name || "Regular").trim() || "Regular";
  const fallbackPrice = normalizeLkrPriceLabel(rows[0]?.price) || "Rs 0";
  return { [fallbackName]: fallbackPrice };
};

function AdminMenuManagementPanel({
  menuItems,
  menuCategories = [],
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
}) {
  const availableCategories = useMemo(() => {
    const categoriesFromItems = menuItems.map((item) => String(item.category || "").trim()).filter(Boolean);
    return [...new Set([...DEFAULT_MENU_CATEGORIES, ...menuCategories, ...categoriesFromItems])];
  }, [menuItems, menuCategories]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState("");
  const [editingCategoryValue, setEditingCategoryValue] = useState("");
  const [editingItemId, setEditingItemId] = useState("");
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [addAttempted, setAddAttempted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: availableCategories[0] || "Kottu",
    description: "",
    image: "",
    loyaltyPoints: "",
    portions: [{ id: crypto.randomUUID(), name: "Regular", price: "" }],
  });
  const [editForm, setEditForm] = useState({
    name: "",
    category: availableCategories[0] || "Kottu",
    description: "",
    image: "",
    loyaltyPoints: "",
    portions: [{ id: crypto.randomUUID(), name: "Regular", price: "" }],
    outOfStock: false,
  });

  const filteredItems = menuItems.filter((item) =>
    activeCategory === "All" ? true : item.category === activeCategory
  );

  const handleAddCategory = () => {
    const result = addMenuCategory?.(newCategory);
    if (!result?.success) {
      setNotice({
        open: true,
        message: result?.message || "Unable to add category.",
        severity: "error",
      });
      return;
    }
    const normalizedCategory = String(newCategory || "").trim();
    setForm((current) => ({ ...current, category: normalizedCategory || current.category }));
    setEditForm((current) => ({ ...current, category: normalizedCategory || current.category }));
    setNewCategory("");
    setNotice({ open: true, message: "Category added successfully.", severity: "success" });
  };

  const handleStartCategoryEdit = (category) => {
    setEditingCategory(category);
    setEditingCategoryValue(category);
  };

  const handleSaveCategoryEdit = () => {
    const result = updateMenuCategory?.(editingCategory, editingCategoryValue);
    if (!result?.success) {
      setNotice({
        open: true,
        message: result?.message || "Unable to update category.",
        severity: "error",
      });
      return;
    }
    if (activeCategory === editingCategory) {
      setActiveCategory(String(editingCategoryValue || "").trim() || "All");
    }
    setEditingCategory("");
    setEditingCategoryValue("");
    setNotice({ open: true, message: "Category updated successfully.", severity: "success" });
  };

  const handleDeleteCategory = (category) => {
    const result = deleteMenuCategory?.(category);
    if (!result?.success) {
      setNotice({
        open: true,
        message: result?.message || "Unable to delete category.",
        severity: "error",
      });
      return;
    }
    if (activeCategory === category) {
      setActiveCategory("All");
    }
    setNotice({ open: true, message: "Category deleted successfully.", severity: "success" });
  };

  const handleAdd = () => {
    setAddAttempted(true);
    const loyaltyPointsValue = String(form.loyaltyPoints ?? "").trim();
    const loyaltyPointsNumber = Number(loyaltyPointsValue);
    if (!loyaltyPointsValue) {
      setNotice({ open: true, message: "Loyalty points are required.", severity: "error" });
      return;
    }
    if (!Number.isFinite(loyaltyPointsNumber) || loyaltyPointsNumber < 0) {
      setNotice({ open: true, message: "Loyalty points must be a valid number (0 or more).", severity: "error" });
      return;
    }
    const result = addMenuItem({
      name: form.name,
      category: form.category,
      description: form.description,
      image: form.image,
      loyaltyPoints: form.loyaltyPoints,
      portions: normalizePortions(form.portions),
    });
    if (!result.success) {
      setNotice({ open: true, message: result.message || "Unable to add menu item.", severity: "error" });
      return;
    }
    setNotice({ open: true, message: "Menu item added successfully.", severity: "success" });
    setAddAttempted(false);
    setForm({
      name: "",
      category: availableCategories[0] || "Kottu",
      description: "",
      image: "",
      loyaltyPoints: "",
      portions: [{ id: crypto.randomUUID(), name: "Regular", price: "" }],
    });
  };

  const addPortionRow = (name = "", price = "") => {
    setForm((current) => ({
      ...current,
      portions: [...current.portions, { id: crypto.randomUUID(), name, price }],
    }));
  };

  const removePortionRow = (rowId) => {
    setForm((current) => ({
      ...current,
      portions:
        current.portions.length <= 1
          ? current.portions
          : current.portions.filter((portion) => portion.id !== rowId),
    }));
  };

  const updatePortionRow = (rowId, field, value) => {
    const nextValue = field === "price" ? String(value ?? "").replace(/[^\d.]/g, "") : value;
    setForm((current) => ({
      ...current,
      portions: current.portions.map((portion) =>
        portion.id === rowId ? { ...portion, [field]: nextValue } : portion
      ),
    }));
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setEditForm({
      name: item.name || "",
      category: item.category || availableCategories[0] || "Kottu",
      description: item.description || "",
      image: item.image || "",
      loyaltyPoints:
        item && Object.prototype.hasOwnProperty.call(item, "loyaltyPoints") && item.loyaltyPoints !== undefined
          ? String(item.loyaltyPoints)
          : "",
      portions: toPortionRows(item.portions),
      outOfStock: Boolean(item.outOfStock),
    });
  };

  const cancelEdit = () => {
    setEditingItemId("");
  };

  const addEditPortionRow = (name = "", price = "") => {
    setEditForm((current) => ({
      ...current,
      portions: [...current.portions, { id: crypto.randomUUID(), name, price: String(price ?? "").replace(/[^\d.]/g, "") }],
    }));
  };

  const removeEditPortionRow = (rowId) => {
    setEditForm((current) => ({
      ...current,
      portions:
        current.portions.length <= 1
          ? current.portions
          : current.portions.filter((portion) => portion.id !== rowId),
    }));
  };

  const updateEditPortionRow = (rowId, field, value) => {
    const nextValue = field === "price" ? String(value ?? "").replace(/[^\d.]/g, "") : value;
    setEditForm((current) => ({
      ...current,
      portions: current.portions.map((portion) =>
        portion.id === rowId ? { ...portion, [field]: nextValue } : portion
      ),
    }));
  };

  const handleSaveEdit = async (itemId) => {
    const result = await updateMenuItem(itemId, {
      name: editForm.name,
      category: editForm.category,
      description: editForm.description,
      image: editForm.image,
      loyaltyPoints: editForm.loyaltyPoints,
      portions: normalizePortions(editForm.portions),
      outOfStock: Boolean(editForm.outOfStock),
    });
    if (!result?.success) {
      setNotice({ open: true, message: result?.message || "Unable to update item.", severity: "error" });
      return;
    }
    setEditingItemId("");
    setNotice({ open: true, message: "Menu item updated successfully.", severity: "success" });
  };

  const handleRequestDeleteItem = (item) => {
    setDeleteCandidate(item || null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteCandidate(null);
  };

  const handleConfirmDeleteItem = () => {
    if (!deleteCandidate) return;
    const result = deleteMenuItem?.(deleteCandidate.id);
    if (!result?.success) {
      setNotice({ open: true, message: result?.message || "Unable to delete menu item.", severity: "error" });
      return;
    }
    if (editingItemId === deleteCandidate.id) {
      setEditingItemId("");
    }
    setDeleteCandidate(null);
    setNotice({ open: true, message: "Menu item deleted successfully.", severity: "success" });
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", rowGap: 1, alignItems: "stretch", alignContent: "flex-start", height: "fit-content" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
        <Typography variant="h2" sx={{ fontSize: { xs: "24px", md: "30px" } }}>
          Menu Management
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setShowCategoryDialog(true)}
          >
            Manage Categories
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={showAddForm ? <CloseRoundedIcon /> : <AddRoundedIcon />}
            onClick={() => setShowAddForm((current) => !current)}
          >
            {showAddForm ? "Close Form" : "Add Items"}
          </Button>
        </Stack>
      </Stack>

      <Dialog
        open={showCategoryDialog}
        onClose={() => setShowCategoryDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Manage Categories</DialogTitle>
        <DialogContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 0.5 }}>
            <TextField
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name (e.g. Kottu, Rice, Deviled)"
              size="small"
              sx={{ flex: 1 }}
            />
            <Button variant="contained" color="primary" onClick={handleAddCategory}>
              Add Category
            </Button>
          </Stack>
          <Stack spacing={0.8} sx={{ mt: 1.2 }}>
            {availableCategories.map((category) => {
              const isCategoryEditing = editingCategory === category;
              return (
                <Stack key={category} direction="row" spacing={0.8} alignItems="center">
                  {!isCategoryEditing && (
                    <>
                      <Box
                        sx={{
                          flex: 1,
                          px: 1,
                          py: 0.7,
                          borderRadius: 1.2,
                          bgcolor: "rgba(212,178,95,0.08)",
                          border: "1px solid rgba(212,178,95,0.18)",
                          color: "text.secondary",
                          fontSize: 14,
                        }}
                      >
                        {category}
                      </Box>
                      <Button size="small" variant="outlined" onClick={() => handleStartCategoryEdit(category)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => handleDeleteCategory(category)}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {isCategoryEditing && (
                    <>
                      <TextField
                        value={editingCategoryValue}
                        onChange={(e) => setEditingCategoryValue(e.target.value)}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      <Button size="small" variant="contained" onClick={handleSaveCategoryEdit}>
                        Save
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setEditingCategory("");
                          setEditingCategoryValue("");
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteCandidate)}
        onClose={handleCloseDeleteDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Delete menu item?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: "text.secondary", mt: 0.5 }}>
            {deleteCandidate?.name ? `"${deleteCandidate.name}" will be deleted permanently.` : "This item will be deleted permanently."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2.4, pb: 1.6 }}>
          <Button variant="outlined" onClick={handleCloseDeleteDialog}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleConfirmDeleteItem}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
          alignContent: "center",
          gap: 0.8,
          minHeight: 34,
          overflowX: "auto",
          overflowY: "hidden",
          scrollbarWidth: "thin",
        }}
      >
        <Button
          variant={activeCategory === "All" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setActiveCategory("All")}
          sx={{
            flex: "0 0 auto",
            alignSelf: "flex-start",
            height: 34,
            minWidth: 72,
            px: 1.4,
            py: 0,
            borderRadius: 2.2,
            fontSize: "0.85rem",
            lineHeight: 1,
            textTransform: "none",
          }}
        >
          All
        </Button>
        {availableCategories.map((category) => (
          <Button
            key={category}
            variant={activeCategory === category ? "contained" : "outlined"}
            color="primary"
            onClick={() => setActiveCategory(category)}
            sx={{
              flex: "0 0 auto",
              alignSelf: "flex-start",
              height: 34,
              minWidth: 86,
              px: 1.4,
              py: 0,
              borderRadius: 2.2,
              fontSize: "0.85rem",
              lineHeight: 1,
              textTransform: "none",
            }}
          >
            {category}
          </Button>
        ))}
      </Box>

      {showAddForm && (
        <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 2.2 }}>
            <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, mb: 1.2 }}>
              Add Menu Item
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.1 }}>
                <TextField value={form.name} onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))} placeholder="Item name" sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }} />
                <Select
                  value={form.category}
                  onChange={(e) => {
                    const nextCategory = e.target.value;
                    const presetNames = getPortionPresetNames(nextCategory);
                    setForm((current) => ({
                      ...current,
                      category: nextCategory,
                      portions: shouldReplacePortionsWithPreset(current.portions)
                        ? buildPortionRowsFromNames(presetNames)
                        : current.portions,
                    }));
                  }}
                  size="small"
                  sx={{ bgcolor: "#0f1116" }}
                >
                  {availableCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
                <TextField value={form.description} onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))} placeholder="Description" sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }} />
                <TextField
                  value={form.loyaltyPoints}
                  onChange={(e) => setForm((c) => ({ ...c, loyaltyPoints: e.target.value }))}
                  placeholder="Loyalty points (per item)"
                  type="number"
                  required
                  inputProps={{ min: 0 }}
                  error={addAttempted && !String(form.loyaltyPoints ?? "").trim()}
                  helperText={addAttempted && !String(form.loyaltyPoints ?? "").trim() ? "Required" : " "}
                  sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                />
              </Box>
            <Box sx={{ mt: 1.1 }}>
              <ImagePicker
                label="Item Image"
                value={form.image}
                onChange={(nextValue) => setForm((current) => ({ ...current, image: nextValue }))}
              />
            </Box>
            <Box sx={{ mt: 1.1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                <Typography sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem" }}>
                  Portions & Prices
                </Typography>
                <Stack direction="row" spacing={0.6}>
                  {getPortionPresetNames(form.category).map((name) => (
                    <Button key={name} size="small" variant="outlined" onClick={() => addPortionRow(name, "")}>
                      + {name}
                    </Button>
                  ))}
                </Stack>
              </Stack>
              <Stack spacing={0.8}>
                {form.portions.map((portion) => (
                  <Stack key={portion.id} direction="row" spacing={0.7} alignItems="center">
                    <TextField
                      value={portion.name}
                      onChange={(e) => updatePortionRow(portion.id, "name", e.target.value)}
                      placeholder="Portion name"
                      size="small"
                      sx={{ flex: 1, "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                    />
                    <TextField
                      value={portion.price}
                      onChange={(e) => updatePortionRow(portion.id, "price", e.target.value)}
                      placeholder="Price"
                      size="small"
                      inputMode="numeric"
                      InputProps={{
                        startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                      }}
                      sx={{ flex: 1, "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                    />
                    <IconButton color="error" onClick={() => removePortionRow(portion.id)}>
                      <RemoveCircleOutlineRoundedIcon />
                    </IconButton>
                  </Stack>
                ))}
                <Button size="small" variant="outlined" onClick={() => addPortionRow()}>
                  + Add custom portion
                </Button>
              </Stack>
            </Box>
            <Button sx={{ mt: 1.3 }} variant="contained" color="primary" startIcon={<AddRoundedIcon />} onClick={handleAdd}>
              Add Item
            </Button>
          </CardContent>
        </Card>
      )}

      <Stack spacing={1.1}>
        {filteredItems.map((item) => {
          const isEditing = editingItemId === item.id;
          const derivedLoyaltyPoints = (() => {
            const portions = item && item.portions && typeof item.portions === "object" ? item.portions : null;
            if (!portions) return null;
            const values = Object.values(portions)
              .map((value) => Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0)
              .filter((value) => Number.isFinite(value) && value > 0);
            if (values.length === 0) return null;
            return Math.max(0, Math.round(Math.min(...values)));
          })();
          return (
            <Card key={item.id} sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
              <CardContent sx={{ p: 1.8 }}>
                {!isEditing && (
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} gap={1.2}>
                    <Box>
                      <Typography sx={{ fontWeight: 700 }}>{item.name}</Typography>
                      <Typography sx={{ color: "text.secondary" }}>{item.category}</Typography>
                      <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.4 }}>
                        {item.description}
                      </Typography>
                      {item && Object.prototype.hasOwnProperty.call(item, "loyaltyPoints") && item.loyaltyPoints !== undefined ? (
                        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.2 }}>
                          Loyalty points: {item.loyaltyPoints}
                        </Typography>
                      ) : derivedLoyaltyPoints !== null ? (
                        <Typography sx={{ color: "text.secondary", fontSize: 13, mt: 0.2 }}>
                          Loyalty points (auto): {derivedLoyaltyPoints}
                        </Typography>
                      ) : null}
                      <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" sx={{ mt: 0.7 }}>
                        {Object.entries(item.portions || {}).map(([portion, price]) => (
                          <Box
                            key={`${item.id}-${portion}`}
                            sx={{
                              px: 0.8,
                              py: 0.2,
                              borderRadius: 1.2,
                              bgcolor: "rgba(212,178,95,0.14)",
                              border: "1px solid rgba(212,178,95,0.24)",
                              color: "primary.main",
                              fontSize: "0.75rem",
                            }}
                          >
                            {portion}: {price}
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={0.6} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                        {item.outOfStock ? "Out of Stock" : "In Stock"}
                      </Typography>
                      <Switch
                        checked={!item.outOfStock}
                        onChange={(e) => updateMenuItem(item.id, { outOfStock: !e.target.checked })}
                      />
                      <Button
                        variant="outlined"
                        startIcon={<EditRoundedIcon />}
                        onClick={() => startEdit(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        color="error"
                        variant="outlined"
                        startIcon={<DeleteOutlineRoundedIcon />}
                        onClick={() => handleRequestDeleteItem(item)}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                )}

                {isEditing && (
                  <Stack spacing={1}>
                    <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700 }}>
                      Edit Menu Item
                    </Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1 }}>
                      <TextField
                        value={editForm.name}
                        onChange={(e) => setEditForm((current) => ({ ...current, name: e.target.value }))}
                        placeholder="Item name"
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                      />
                       <Select
                         value={editForm.category}
                         onChange={(e) => {
                           const nextCategory = e.target.value;
                           const presetNames = getPortionPresetNames(nextCategory);
                           setEditForm((current) => ({
                             ...current,
                             category: nextCategory,
                             portions: shouldReplacePortionsWithPreset(current.portions)
                               ? buildPortionRowsFromNames(presetNames)
                               : current.portions,
                           }));
                         }}
                         size="small"
                         sx={{ bgcolor: "#0f1116" }}
                       >
                         {availableCategories.map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </Select>
                      <TextField
                        value={editForm.description}
                        onChange={(e) => setEditForm((current) => ({ ...current, description: e.target.value }))}
                        placeholder="Description"
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                      />
                      <TextField
                        value={editForm.loyaltyPoints}
                        onChange={(e) => setEditForm((current) => ({ ...current, loyaltyPoints: e.target.value }))}
                        placeholder="Loyalty points (per item)"
                        type="number"
                        inputProps={{ min: 0 }}
                        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                      />
                    </Box>
                     <ImagePicker
                       label="Item Image"
                       value={editForm.image}
                       onChange={(nextValue) => setEditForm((current) => ({ ...current, image: nextValue }))}
                     />

                     <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8, mt: 0.8 }}>
                       <Typography sx={{ color: "primary.main", fontWeight: 700, textTransform: "uppercase", fontSize: "0.85rem" }}>
                         Portions & Prices
                       </Typography>
                       <Stack direction="row" spacing={0.6}>
                         {getPortionPresetNames(editForm.category).map((name) => (
                           <Button key={name} size="small" variant="outlined" onClick={() => addEditPortionRow(name, "")}>
                             + {name}
                           </Button>
                         ))}
                       </Stack>
                     </Stack>

                     <Stack spacing={0.8}>
                       {editForm.portions.map((portion) => (
                         <Stack key={portion.id} direction="row" spacing={0.7} alignItems="center">
                           <TextField
                            value={portion.name}
                            onChange={(e) => updateEditPortionRow(portion.id, "name", e.target.value)}
                            placeholder="Portion name"
                            size="small"
                            sx={{ flex: 1, "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                          />
                          <TextField
                            value={portion.price}
                            onChange={(e) => updateEditPortionRow(portion.id, "price", e.target.value)}
                            placeholder="Price"
                            size="small"
                            inputMode="numeric"
                            InputProps={{
                              startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                            }}
                            sx={{ flex: 1, "& .MuiOutlinedInput-root": { bgcolor: "#0f1116" } }}
                          />
                          <IconButton color="error" onClick={() => removeEditPortionRow(portion.id)}>
                            <RemoveCircleOutlineRoundedIcon />
                          </IconButton>
                        </Stack>
                      ))}
                      <Button size="small" variant="outlined" onClick={() => addEditPortionRow()}>
                        + Add custom portion
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
                        {editForm.outOfStock ? "Out of Stock" : "In Stock"}
                      </Typography>
                      <Switch
                        checked={!editForm.outOfStock}
                        onChange={(e) =>
                          setEditForm((current) => ({ ...current, outOfStock: !e.target.checked }))
                        }
                      />
                      <Button
                        variant="contained"
                        startIcon={<SaveRoundedIcon />}
                        onClick={() => handleSaveEdit(item.id)}
                      >
                        Save
                      </Button>
                      <Button variant="outlined" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filteredItems.length === 0 && (
          <Typography sx={{ color: "text.secondary", textAlign: "center", py: 2 }}>
            No items in this category.
          </Typography>
        )}
      </Stack>
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
    </Box>
  );
}

export default AdminMenuManagementPanel;
