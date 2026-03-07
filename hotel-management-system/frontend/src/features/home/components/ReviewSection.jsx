import { useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Rating,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

function ReviewSection({ sectionPaddingX, sectionReveal }) {
  const [feedbackRating, setFeedbackRating] = useState(0);

  return (
    <Box
      component={motion.div}
      variants={sectionReveal}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      sx={{ px: sectionPaddingX, py: { xs: 8, md: 10 } }}
    >
      <Grid container spacing={{ xs: 3, md: 6 }} alignItems="stretch">
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 2.2 }}>
            <FormatQuoteRoundedIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700, letterSpacing: 1.6 }}>
              Testimonials 
            </Typography>
          </Stack>
          <Typography
            variant="h2"
            sx={{ fontSize: { xs: "30px", md: "42px" }, lineHeight: 1.1, mb: 4, maxWidth: 820, fontWeight: 700 }}
          >
            What Our Customers <Box component="span" sx={{ color: "primary.main" }}>Say About Us</Box>
          </Typography>
          <Card sx={{ bgcolor: "#120b09", border: "1px solid rgba(212,178,95,0.12)", borderRadius: 4 }}>
            <CardContent sx={{ p: { xs: 4, md: 5.5 }, minHeight: { xs: 140, md: 250 }, display: "grid", placeItems: "center", textAlign: "center" }}>
              <Typography sx={{ color: "rgba(246,247,251,0.35)", fontStyle: "italic", fontSize: { xs: "20px", md: "26px" }, lineHeight: 1.3 }}>
                Be the first to share your experience with us!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Stack direction="row" alignItems="center" spacing={1.1} sx={{ mb: 2.2 }}>
            <ChatBubbleOutlineRoundedIcon sx={{ color: "primary.main", fontSize: 24 }} />
            <Typography variant="h3" sx={{ fontSize: { xs: "24px", md: "32px" }, fontWeight: 700, lineHeight: 1.1 }}>
              Share Your Thoughts
            </Typography>
          </Stack>
          <Card
            sx={{
              height: "100%",
              borderRadius: 6,
              border: "1px solid rgba(212,178,95,0.16)",
              bgcolor: "#120b09",
              boxShadow: "0 22px 55px rgba(0, 0, 0, 0.42)",
            }}
          >
            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
              <Typography sx={{ color: "primary.main", fontWeight: 700, mb: 1.4, textTransform: "uppercase", letterSpacing: 1.5, fontSize: { xs: "14px", md: "16px" } }}>
                Your Rating 
              </Typography>
              <Rating
                name="user-feedback-rating"
                value={feedbackRating}
                onChange={(_, newValue) => setFeedbackRating(newValue ?? 0)}
                size="large"
                sx={{
                  color: "primary.main",
                  fontSize: { xs: "1.9rem", md: "2.4rem" },
                  mb: 4,
                  "& .MuiRating-iconEmpty": { color: "rgba(212,178,95,0.35)" },
                }}
              />

              <Typography sx={{ color: "primary.main", fontWeight: 700, mb: 1.4, textTransform: "uppercase", letterSpacing: 1.5, fontSize: { xs: "14px", md: "16px" } }}>
                Your Message
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={4}
                placeholder="Tell us about your experience..."
                sx={{
                  mb: 4,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#030508",
                    borderRadius: 3,
                    color: "text.primary",
                    fontSize: { xs: "16px", md: "18px" },
                    lineHeight: 1.3,
                    "& fieldset": {
                      borderColor: "rgba(212,178,95,0.22)",
                    },
                    "&:hover fieldset": {
                      borderColor: "rgba(212,178,95,0.45)",
                    },
                    "&.Mui-focused": {
                      boxShadow: "0 0 0 3px rgba(212,178,95,0.1)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& textarea::placeholder": {
                    color: "rgba(246,247,251,0.42)",
                    opacity: 1,
                  },
                }}
              />

              <Button
                variant="contained"
                color="primary"
                startIcon={<SendRoundedIcon />}
                fullWidth
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: { xs: "18px", md: "20px" },
                  color: "#0f1115",
                  boxShadow: "none",
                  "&:hover": {
                    boxShadow: "none",
                    bgcolor: "#dfbf73",
                  },
                }}
              >
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default ReviewSection;
