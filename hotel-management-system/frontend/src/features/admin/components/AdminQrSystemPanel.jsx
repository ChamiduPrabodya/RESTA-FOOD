import { useMemo, useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
  Snackbar,
  Alert,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import { useAuth } from "../../auth/context/AuthContext";
import { API_BASE_URL } from "../../../common/utils/api";

const buildQrImageUrl = (targetUrl) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;
};

function AdminQrSystemPanel() {
  const { authUser, authToken } = useAuth();
  const [tableInput, setTableInput] = useState("");
  const [tables, setTables] = useState([]);
  const [updatingTableId, setUpdatingTableId] = useState("");
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });

  const apiRequest = async (path, { method = "GET", body, token } = {}) => {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${String(token).trim()}`;

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return { ok: response.ok, status: response.status, data };
  };

  const refreshTables = async () => {
    const token = String(authToken || "").trim();
    if (!token) return;

    try {
      const { ok, data } = await apiRequest("/tables", { token });
      if (!ok || !data || data.success !== true || !Array.isArray(data.tables)) {
        setNotice({ open: true, message: data?.message || "Unable to load tables.", severity: "error" });
        return;
      }
      setTables(data.tables);
    } catch {
      setNotice({ open: true, message: "Backend is not reachable. Start the backend server.", severity: "error" });
    }
  };

  useEffect(() => {
    if (!authUser || authUser.role !== "admin") return;
    refreshTables();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.role, authToken]);

  const tableCards = useMemo(
    () =>
      tables.map((table) => ({
        id: table.id,
        label: table.label,
        status: String(table.status || "available").trim().toLowerCase() || "available",
        targetUrl: String(table.qrUrl || "").trim(),
        qrUrl: buildQrImageUrl(String(table.qrUrl || "").trim()),
      })),
    [tables]
  );

  const handleAddTable = async () => {
    if (!authUser || authUser.role !== "admin") {
      setNotice({ open: true, message: "Only admins can manage QR tables.", severity: "warning" });
      return;
    }

    const trimmed = tableInput.trim().toUpperCase();
    if (!trimmed) return;

    const token = String(authToken || "").trim();
    if (!token) {
      setNotice({ open: true, message: "Missing auth token. Please sign in again.", severity: "error" });
      return;
    }

    try {
      const { ok, data } = await apiRequest("/tables", {
        method: "POST",
        token,
        body: { label: trimmed },
      });
      if (!ok || !data || data.success !== true || !data.table) {
        setNotice({ open: true, message: data?.message || "Unable to create table.", severity: "error" });
        return;
      }
      setTables((current) => [...(Array.isArray(current) ? current : []), data.table]);
      setTableInput("");
      setNotice({ open: true, message: `${data.table.label} added.`, severity: "success" });
    } catch {
      setNotice({ open: true, message: "Backend is not reachable. Start the backend server.", severity: "error" });
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (!authUser || authUser.role !== "admin") {
      setNotice({ open: true, message: "Only admins can manage QR tables.", severity: "warning" });
      return;
    }

    const token = String(authToken || "").trim();
    if (!token) {
      setNotice({ open: true, message: "Missing auth token. Please sign in again.", severity: "error" });
      return;
    }

    try {
      const { ok, data } = await apiRequest(`/tables/${encodeURIComponent(tableId)}`, {
        method: "DELETE",
        token,
      });
      if (!ok || !data || data.success !== true || !data.table) {
        setNotice({ open: true, message: data?.message || "Unable to delete table.", severity: "error" });
        return;
      }
      setTables((current) => (Array.isArray(current) ? current : []).filter((t) => t.id !== tableId));
      setNotice({ open: true, message: `${data.table.label} deleted.`, severity: "success" });
    } catch {
      setNotice({ open: true, message: "Backend is not reachable. Start the backend server.", severity: "error" });
    }
  };

  const handleMarkTableFree = async (table) => {
    if (!authUser || authUser.role !== "admin") {
      setNotice({ open: true, message: "Only admins can manage QR tables.", severity: "warning" });
      return;
    }

    const tableId = String(table?.id || "").trim();
    const tableLabel = String(table?.label || tableId || "Table").trim();
    const token = String(authToken || "").trim();
    if (!tableId || !token) {
      setNotice({ open: true, message: "Missing auth token. Please sign in again.", severity: "error" });
      return;
    }

    setUpdatingTableId(tableId);
    try {
      const sessionResponse = await apiRequest(`/sessions/table/${encodeURIComponent(tableId)}`, { token });
      const activeSessionId = String(sessionResponse?.data?.session?.id || "").trim();

      if (activeSessionId) {
        const closeResponse = await apiRequest(`/sessions/${encodeURIComponent(activeSessionId)}/close`, {
          method: "PATCH",
          token,
        });
        if (!closeResponse.ok || !closeResponse.data || closeResponse.data.success !== true) {
          setNotice({ open: true, message: closeResponse.data?.message || "Unable to close the table session.", severity: "error" });
          return;
        }
      } else {
        const statusResponse = await apiRequest(`/tables/${encodeURIComponent(tableId)}/status`, {
          method: "PATCH",
          token,
          body: { status: "available" },
        });
        if (!statusResponse.ok || !statusResponse.data || statusResponse.data.success !== true) {
          setNotice({ open: true, message: statusResponse.data?.message || "Unable to mark table as available.", severity: "error" });
          return;
        }
      }

      await refreshTables();
      setNotice({ open: true, message: `${tableLabel} is now free.`, severity: "success" });
    } catch {
      setNotice({ open: true, message: "Backend is not reachable. Start the backend server.", severity: "error" });
    } finally {
      setUpdatingTableId("");
    }
  };

  const getStatusLabel = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "occupied") return "Booked";
    if (normalized === "reserved") return "Reserved";
    if (normalized === "cleaning") return "Cleaning";
    if (normalized === "unavailable") return "Unavailable";
    return "Available";
  };

  const getStatusColors = (status) => {
    const normalized = String(status || "").trim().toLowerCase();
    if (normalized === "occupied") {
      return { color: "#ffb14a", borderColor: "rgba(255,177,74,0.35)", backgroundColor: "rgba(255,177,74,0.12)" };
    }
    if (normalized === "reserved") {
      return { color: "#7cb8ff", borderColor: "rgba(124,184,255,0.35)", backgroundColor: "rgba(124,184,255,0.12)" };
    }
    if (normalized === "cleaning") {
      return { color: "#94e0b2", borderColor: "rgba(148,224,178,0.35)", backgroundColor: "rgba(148,224,178,0.12)" };
    }
    if (normalized === "unavailable") {
      return { color: "#ff7a84", borderColor: "rgba(255,122,132,0.35)", backgroundColor: "rgba(255,122,132,0.12)" };
    }
    return { color: "#d4b25f", borderColor: "rgba(212,178,95,0.35)", backgroundColor: "rgba(212,178,95,0.12)" };
  };

  const handlePrint = (qrUrl) => {
    window.open(qrUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async (text) => {
    const value = String(text || "").trim();
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setNotice({ open: true, message: "Link copied.", severity: "success" });
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand("copy");
        textarea.remove();
        if (ok) {
          setNotice({ open: true, message: "Link copied.", severity: "success" });
          return;
        }
      } catch {
        // ignore
      }

      setNotice({ open: true, message: "Unable to copy link. Tap and hold to copy manually.", severity: "error" });
    }
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
      >
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: "24px", md: "30px" } }}>
            QR Menu Management
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "1.05rem" }}>
            Generate unique QR codes for each dining table to enable contactless ordering.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.2}>
          <TextField
            value={tableInput}
            onChange={(event) => setTableInput(event.target.value)}
            placeholder="Table No (e.g. TABLE 4)"
            size="small"
            sx={{
              minWidth: { xs: 210, sm: 240 },
              "& .MuiOutlinedInput-root": { borderRadius: 3, bgcolor: "#0f1116" },
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddRoundedIcon />}
            sx={{ borderRadius: 3, px: 2.5 }}
            onClick={handleAddTable}
          >
            Add Table
          </Button>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {tableCards.map((table) => (
          <Card key={table.id} sx={{ bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
            <CardContent sx={{ p: 2.2 }}>
              <Box
                component="img"
                src={table.qrUrl}
                alt={`${table.label} QR`}
                sx={{
                  width: "100%",
                  maxWidth: 300,
                  mx: "auto",
                  display: "block",
                  borderRadius: 2.6,
                  bgcolor: "#fff",
                  p: 1.2,
                }}
              />

              <Typography sx={{ textAlign: "center", mt: 1.8, fontWeight: 800, fontSize: { xs: "1.45rem", md: "1.7rem" } }}>
                {table.label}
              </Typography>
              <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
                <Chip
                  label={getStatusLabel(table.status)}
                  sx={{
                    color: getStatusColors(table.status).color,
                    border: "1px solid",
                    borderColor: getStatusColors(table.status).borderColor,
                    bgcolor: getStatusColors(table.status).backgroundColor,
                    fontWeight: 800,
                    letterSpacing: 0.4,
                  }}
                />
              </Stack>
              <Typography sx={{ textAlign: "center", color: "primary.main", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, mb: 1.6 }}>
                Digital Menu Access
              </Typography>

              {table.targetUrl && table.targetUrl.toLowerCase().includes("localhost") && (
                <Alert severity="warning" variant="outlined" sx={{ mb: 1.4 }}>
                  QR link uses <strong>localhost</strong>. Set backend <code>PUBLIC_FRONTEND_ORIGIN</code> to your PC IP and re-generate.
                </Alert>
              )}

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.4 }}>
                <Typography variant="body2" sx={{ color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                  {table.targetUrl || "-"}
                </Typography>
                <IconButton onClick={() => handleCopy(table.targetUrl)} sx={{ borderRadius: 2.5, border: "1px solid rgba(212,178,95,0.28)" }}>
                  <ContentCopyRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1.1}>
                <Button
                  fullWidth
                  startIcon={<PrintOutlinedIcon />}
                  onClick={() => handlePrint(table.qrUrl)}
                  sx={{
                    borderRadius: 3,
                    py: 1.05,
                    bgcolor: "rgba(212,178,95,0.18)",
                    color: "text.primary",
                    "&:hover": { bgcolor: "rgba(212,178,95,0.28)" },
                  }}
                >
                  Print
                </Button>
                <Button
                  fullWidth
                  onClick={() => handleMarkTableFree(table)}
                  disabled={updatingTableId === table.id || table.status === "available"}
                  sx={{
                    borderRadius: 3,
                    py: 1.05,
                    bgcolor: "rgba(124,230,162,0.15)",
                    color: table.status === "available" ? "text.disabled" : "#7ce6a2",
                    border: "1px solid rgba(124,230,162,0.28)",
                    "&:hover": { bgcolor: "rgba(124,230,162,0.24)" },
                  }}
                >
                  {updatingTableId === table.id ? "Updating..." : table.status === "available" ? "Free" : "Mark Free"}
                </Button>
                <IconButton
                  color="error"
                  onClick={() => handleDeleteTable(table.id)}
                  sx={{ borderRadius: 2.5, border: "1px solid rgba(255,77,79,0.45)" }}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Snackbar
        open={notice.open}
        autoHideDuration={3200}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setNotice((current) => ({ ...current, open: false }))}
          severity={notice.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminQrSystemPanel;
