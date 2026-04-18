import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";

function PaymentCancelPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = String(params.get("orderId") || "").trim();

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", px: 2, py: 6 }}>
      <Paper elevation={2} sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h5" fontWeight={700}>
            Payment Cancelled
          </Typography>
          <Typography color="text.secondary">
            {orderId ? `Order: ${orderId}` : "You cancelled the payment."}
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Button variant="contained" onClick={() => navigate("/checkout")}>
              Try Again
            </Button>
            <Button variant="outlined" onClick={() => navigate("/menu")}>
              Back to Menu
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}

export default PaymentCancelPage;

