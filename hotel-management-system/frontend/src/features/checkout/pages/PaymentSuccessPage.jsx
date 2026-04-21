import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";

const API_BASE_URL = String(import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").trim().replace(/\/$/, "");
const AUTH_TOKEN_STORAGE_KEY = "hms_auth_token";

function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const orderId = String(params.get("orderId") || "").trim();
  const token = useMemo(() => String(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "").trim(), []);

  const [state, setState] = useState(() => {
    if (!orderId) return { loading: false, error: "Missing orderId.", order: null };
    if (!token) return { loading: false, error: "Missing auth token. Please sign in again.", order: null };
    return { loading: true, error: "", order: null };
  });
  const pollRef = useRef({ tries: 0, stop: false });

  useEffect(() => {
    if (!orderId || !token) {
      return () => {};
    }

    const pollState = pollRef.current;
    pollState.stop = false;
    pollState.tries = 0;

    let timeoutId = null;
    let intervalId = null;

    const fetchOrder = async () => {
      if (pollState.stop) return;
      pollState.tries += 1;
      try {
        const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data || data.success !== true) {
          setState({ loading: false, error: data?.message || "Unable to load order.", order: null });
          pollState.stop = true;
          return;
        }

        const order = data.order || null;
        setState({ loading: false, error: "", order });

        const paymentStatus = String(order?.paymentStatus || "").trim().toLowerCase();
        if (paymentStatus === "paid") {
          pollState.stop = true;
        }

        if (pollState.tries >= 12) {
          pollState.stop = true;
        }
      } catch {
        setState({ loading: false, error: "Backend is not reachable. Start the backend server.", order: null });
        pollState.stop = true;
      }
    };

    fetchOrder();
    intervalId = window.setInterval(fetchOrder, 2000);
    timeoutId = window.setTimeout(() => {
      pollState.stop = true;
    }, 25_000);

    return () => {
      pollState.stop = true;
      if (intervalId) window.clearInterval(intervalId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [orderId, token]);

  const paymentStatus = String(state.order?.paymentStatus || "").trim();

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 6 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            Payment Status
          </Typography>

          {!orderId ? (
            <Typography color="error">Missing orderId.</Typography>
          ) : state.loading ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <CircularProgress size={22} />
              <Typography>Checking payment...</Typography>
            </Stack>
          ) : state.error ? (
            <Typography color="error">{state.error}</Typography>
          ) : (
            <>
              <Typography>
                Order: <b>{orderId}</b>
              </Typography>
              <Typography>
                Payment: <b>{paymentStatus || "Pending"}</b>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                If this still shows Pending, wait a few seconds and refresh. PayHere notifies the backend asynchronously.
              </Typography>
            </>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" onClick={() => navigate("/menu")}>
              Go to Menu
            </Button>
            <Button variant="outlined" onClick={() => navigate("/checkout")}>
              Back to Checkout
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

export default PaymentSuccessPage;
