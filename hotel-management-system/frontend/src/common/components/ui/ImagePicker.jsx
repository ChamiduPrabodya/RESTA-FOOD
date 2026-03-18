import { useId, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

const defaultAccept = "image/*";
const defaultMaxBytes = 5 * 1024 * 1024;

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.onload = () => resolve(String(reader.result || ""));
    reader.readAsDataURL(file);
  });

const extractPossibleUrl = (dataTransfer) => {
  const uriList = String(dataTransfer?.getData?.("text/uri-list") || "").trim();
  if (uriList) return uriList.split(/\r?\n/)[0].trim();
  const plain = String(dataTransfer?.getData?.("text/plain") || "").trim();
  if (plain) return plain.split(/\s+/)[0].trim();
  return "";
};

function ImagePicker({
  value,
  onChange,
  label = "Image",
  placeholder = "Paste an image URL or drag & drop a file",
  accept = defaultAccept,
  maxBytes = defaultMaxBytes,
  disabled = false,
  sx,
}) {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  const previewSrc = useMemo(() => String(value || "").trim(), [value]);

  const handleSetValue = (nextValue) => {
    setError("");
    onChange?.(nextValue);
  };

  const handleFiles = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!String(file.type || "").startsWith("image/")) {
      setError("Please choose an image file (PNG/JPG/WebP/SVG).");
      return;
    }
    if (Number(file.size || 0) > maxBytes) {
      setError(`Image is too large. Max size is ${Math.round(maxBytes / (1024 * 1024))} MB.`);
      return;
    }
    try {
      const dataUrl = await readAsDataUrl(file);
      handleSetValue(dataUrl);
    } catch {
      setError("Unable to read the selected image.");
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    const dt = event.dataTransfer;
    if (dt?.files?.length) {
      await handleFiles(dt.files);
      return;
    }
    const possibleUrl = extractPossibleUrl(dt);
    if (possibleUrl) {
      handleSetValue(possibleUrl);
      return;
    }
    setError("Drop an image file or an image URL.");
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  return (
    <Stack spacing={0.8} sx={sx}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography sx={{ color: "text.secondary", textTransform: "uppercase", fontWeight: 700 }}>
          {label}
        </Typography>
        <Stack direction="row" spacing={0.6} alignItems="center">
          <Button
            size="small"
            variant="outlined"
            component="label"
            disabled={disabled}
            startIcon={<UploadFileRoundedIcon />}
          >
            Upload
            <input
              id={inputId}
              hidden
              type="file"
              accept={accept}
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </Button>
          <IconButton
            size="small"
            color="error"
            disabled={disabled || !previewSrc}
            onClick={() => handleSetValue("")}
            aria-label="Clear image"
          >
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        sx={{
          borderRadius: 2.5,
          border: "1px dashed",
          borderColor: dragActive ? "primary.main" : "rgba(255,255,255,0.16)",
          bgcolor: "#0f1116",
          p: 1,
          transition: "border-color 160ms ease",
          opacity: disabled ? 0.7 : 1,
        }}
      >
        <TextField
          fullWidth
          value={previewSrc}
          disabled={disabled}
          onChange={(event) => handleSetValue(event.target.value)}
          placeholder={placeholder}
          size="small"
          sx={{ "& .MuiOutlinedInput-root": { bgcolor: "transparent" } }}
        />

        {!!previewSrc && (
          <Box
            component="img"
            src={previewSrc}
            alt="Preview"
            loading="lazy"
            sx={{
              mt: 1,
              width: "100%",
              maxHeight: 180,
              objectFit: "cover",
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.10)",
              bgcolor: "#0b0d12",
            }}
            onError={() => setError("Preview failed to load. Check the URL/path.")}
          />
        )}
      </Box>

      {!!error && (
        <Typography sx={{ color: "error.main", fontSize: 13 }}>
          {error}
        </Typography>
      )}
    </Stack>
  );
}

export default ImagePicker;
