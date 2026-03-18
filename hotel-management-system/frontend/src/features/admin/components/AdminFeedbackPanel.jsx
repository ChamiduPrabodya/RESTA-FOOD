import { Box, Card, CardContent, Rating, Stack, Typography } from "@mui/material";

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function AdminFeedbackPanel({ feedbacks }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="h2" sx={{ fontSize: { xs: "24px", md: "30px" }, mb: 0 }}>
        Customer Feedback
      </Typography>

      {feedbacks.length === 0 && (
        <Card sx={{ bgcolor: "#17100c", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography sx={{ color: "text.secondary", textAlign: "center" }}>
              No feedback submitted yet.
            </Typography>
          </CardContent>
        </Card>
      )}

      {feedbacks.map((item) => (
        <Card key={item.id} sx={{ mt: 0, bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.14)", borderRadius: 4 }}>
          <CardContent sx={{ p: 2.6 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: "rgba(212,178,95,0.2)",
                    color: "primary.main",
                    fontWeight: 700,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {String(item.userName || "U").charAt(0).toUpperCase()}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.2rem", lineHeight: 1.1 }}>
                    {item.userName || item.userEmail}
                  </Typography>
                  <Typography sx={{ color: "text.secondary", fontSize: "1rem" }}>
                    {formatDateTime(item.createdAt)}
                  </Typography>
                </Box>
              </Stack>
              <Rating value={Number(item.rating) || 0} readOnly sx={{ color: "primary.main" }} />
            </Stack>

            <Typography sx={{ mt: 1.8, borderLeft: "2px solid rgba(212,178,95,0.4)", pl: 1.5, fontStyle: "italic", fontSize: "1.15rem" }}>
              "{item.message}"
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default AdminFeedbackPanel;
