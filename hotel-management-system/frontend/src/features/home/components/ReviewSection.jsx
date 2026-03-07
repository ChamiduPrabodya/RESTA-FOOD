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
      <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
        <Grid item xs={12} md={6}>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 2 }}>
            <FormatQuoteRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
            <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700 }}>
              Testimonials
            </Typography>
          </Stack>
          <Typography variant="h2" sx={{ fontSize: { xs: "34px", md: "48px" }, mb: 3, maxWidth: 620 }}>
            What Our Customers <Box component="span" sx={{ color: "primary.main" }}>Say About Us</Box>
          </Typography>
          <Card sx={{ bgcolor: "#140d0a", border: "1px solid rgba(212,178,95,0.15)", minHeight: 180 }}>
            <CardContent sx={{ p: 5, minHeight: 180, display: "grid", placeItems: "center" }}>
              <Typography sx={{ color: "text.secondary", textAlign: "center", fontStyle: "italic" }}>
                Be the first to share your experience with us!
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mb: 2 }}>
            <ChatBubbleOutlineRoundedIcon sx={{ color: "primary.main", fontSize: 18 }} />
            <Typography sx={{ color: "primary.main", textTransform: "uppercase", fontWeight: 700 }}>
              Feedback Form
            </Typography>
          </Stack>
          <Card sx={{ bgcolor: "#1a110d", border: "1px solid rgba(212,178,95,0.18)", borderRadius: 5, height: "100%" }}>
            <CardContent sx={{ p: { xs: 3, md: 4.5 } }}>
              <Typography variant="h3" sx={{ fontSize: "26px", mb: 2.6 }}>Share Your Thoughts</Typography>

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
                placeholder="Tell us about your experience..."
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#07090d",
                    borderRadius: 3,
                  },
                }}
              />

              <Button variant="contained" color="primary" startIcon={<SendRoundedIcon />} fullWidth sx={{ py: 1.5 }}>
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
