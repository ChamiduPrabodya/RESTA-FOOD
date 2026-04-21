import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Rating,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { useAuth } from "../../auth/context/AuthContext";

const getInitialsFromName = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return "";
  return parts.map((part) => String(part[0] || "").toUpperCase()).join("");
};

function ReviewSection({ sectionPaddingX, sectionReveal }) {
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [notice, setNotice] = useState({ open: false, message: "", severity: "success" });
  const { addFeedback, feedbacks } = useAuth();

  const reviewsToShow = useMemo(() => {
    const source = Array.isArray(feedbacks) ? feedbacks : [];
    return [...source]
      .filter((review) => String(review?.message || "").trim())
      .sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
      })
      .slice(0, 3);
  }, [feedbacks]);

  const handleSubmitFeedback = async () => {
    const result = await addFeedback({
      rating: feedbackRating,
      message: feedbackMessage,
    });

    setNotice({
      open: true,
      message: result.success ? "Feedback submitted successfully." : result.message,
      severity: result.success ? "success" : "error",
    });

    if (result.success) {
      setFeedbackRating(0);
      setFeedbackMessage("");
    }
  };

  return (
    <Box
      component={motion.div}
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      sx={{ px: sectionPaddingX, py: { xs: 8, md: 10 } }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: { xs: 3, md: 4 },
        }}
      >
        <Box>
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={0.8}>
              <FormatQuoteRoundedIcon sx={{ color: "primary.main", fontSize: 16 }} />
              <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, fontSize: "2rem" }}>
                Testimonials
              </Typography>
            </Stack>
            
          </Box>
          <Typography variant="h2" sx={{ fontSize: { xs: "34px", md: "48px" }, mb: 3, maxWidth: 620 }}>
            What Our Customers <Box component="span" sx={{ color: "primary.main" }}>Say About Us</Box>
          </Typography>
          <Stack spacing={1.4}>
            {reviewsToShow.length === 0 ? (
              <Card sx={{ bgcolor: "#140d0a", border: "1px solid rgba(212,178,95,0.15)" }}>
                <CardContent sx={{ p: 2.2 }}>
                  <Typography sx={{ fontWeight: 700, mb: 0.6 }}>No testimonials yet</Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    Be the first to share your experience using the feedback form.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              reviewsToShow.map((review) => (
                <Card key={review.id} sx={{ bgcolor: "#140d0a", border: "1px solid rgba(212,178,95,0.15)" }}>
                  <CardContent sx={{ p: 2.2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                      <Stack direction="row" spacing={1.1} alignItems="center">
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: "999px",
                            display: "grid",
                            placeItems: "center",
                            bgcolor: "rgba(212,178,95,0.14)",
                            border: "1px solid rgba(212,178,95,0.22)",
                            color: "primary.main",
                            fontWeight: 800,
                            fontSize: 12,
                            letterSpacing: 0.7,
                            flex: "0 0 auto",
                          }}
                        >
                          {getInitialsFromName(review.userName || review.userEmail)}
                        </Box>
                        <Typography sx={{ fontWeight: 700 }}>
                          {String(review.userName || review.userEmail || "Customer")}
                        </Typography>
                      </Stack>
                      <Rating value={Number(review.rating) || 0} readOnly size="small" sx={{ color: "primary.main" }} />
                    </Stack>
                    <Typography sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      "{String(review.message || "").trim()}"
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Stack>
        </Box>

        <Box>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 2 }}>
            <ChatBubbleOutlineRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
            <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700 }}>
              Feedback Form
            </Typography>
          </Stack>
          <Card sx={{ bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.18)", borderRadius: 5, height: "100%" }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
              <Stack direction="row" alignItems="center" spacing={1.4} sx={{ mb: 2.6 }}>
                <Typography variant="h3" sx={{ fontSize: "26px", whiteSpace: "nowrap" }}>
                  Share Your Thoughts
                </Typography>
                <Box
                  sx={{
                    flex: 1,
                    height: 1,
                    bgcolor: "rgba(212,178,95,0.28)",
                  }}
                />
              </Stack>

              <Typography sx={{ color: "primary.main", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Your Rating
              </Typography>
              <Rating
                name="user-feedback-rating"
                value={feedbackRating}
                onChange={(_, newValue) => setFeedbackRating(newValue ?? 0)}
                size="large"
                sx={{ color: "primary.main", mb: 3 }}
              />

              <Typography sx={{ color: "primary.main", fontWeight: 700, mb: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Your Message 
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                value={feedbackMessage}
                onChange={(event) => setFeedbackMessage(event.target.value)}
                placeholder="Tell us about your experience..."
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#07090d",
                    borderRadius: 3,
                  },
                }}
              />

              <Button
                variant="contained"
                color="primary"
                startIcon={<SendRoundedIcon />}
                fullWidth
                sx={{ py: 1.5 }}
                onClick={handleSubmitFeedback}
              >
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
      <Snackbar
        open={notice.open}
        autoHideDuration={2500}
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

export default ReviewSection;
