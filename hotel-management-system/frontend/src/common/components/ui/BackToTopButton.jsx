import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Fab } from "@mui/material";
import KeyboardArrowUpRoundedIcon from "@mui/icons-material/KeyboardArrowUpRounded";

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 280);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <AnimatePresence>
      {visible && (
        <Fab
          component={motion.button}
          initial={{ opacity: 0, y: 20, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.92 }}
          transition={{ duration: 0.2 }}
          color="primary"
          onClick={scrollToTop}
          aria-label="Back to top"
          sx={{
            position: "fixed",
            right: { xs: 16, md: 24 },
            bottom: { xs: 16, md: 24 },
            zIndex: 1300,
            boxShadow: "0 14px 24px rgba(0,0,0,0.35)",
          }}
        >
          <KeyboardArrowUpRoundedIcon />
        </Fab>
      )}
    </AnimatePresence>
  );
}

export default BackToTopButton;

