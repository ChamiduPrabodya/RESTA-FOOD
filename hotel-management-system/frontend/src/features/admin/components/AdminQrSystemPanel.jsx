import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

const buildQrUrl = (tableLabel) => {
  const targetUrl = `https://resta-fast-food.local/menu?table=${encodeURIComponent(tableLabel)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;
};

function AdminQrSystemPanel() {
  const [tableInput, setTableInput] = useState("");
  const [tables, setTables] = useState(["TABLE 1", "TABLE 2", "TABLE 3"]);

  const tableCards = useMemo(
    () =>
      tables.map((label) => ({
        id: label,
        label,
        qrUrl: buildQrUrl(label),
      })),
    [tables]
  );

  const handleAddTable = () => {
    const trimmed = tableInput.trim().toUpperCase();
    if (!trimmed) return;
    if (tables.includes(trimmed)) return;
    setTables((current) => [...current, trimmed]);
    setTableInput("");
  };

  const handleDeleteTable = (label) => {
    setTables((current) => current.filter((item) => item !== label));
  };

  const handlePrint = (qrUrl) => {
    window.open(qrUrl, "_blank", "noopener,noreferrer");
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
              <Typography sx={{ textAlign: "center", color: "primary.main", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 700, mb: 1.6 }}>
                Digital Menu Access
              </Typography>

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
                <IconButton
                  color="error"
                  onClick={() => handleDeleteTable(table.label)}
                  sx={{ borderRadius: 2.5, border: "1px solid rgba(255,77,79,0.45)" }}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

export default AdminQrSystemPanel;
