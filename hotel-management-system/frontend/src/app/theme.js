import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#d4b25f" },
    background: { default: "#07090d", paper: "#11141a" },
    text: { primary: "#f6f7fb", secondary: "#a8adb7" },
  },
  typography: {
    fontFamily: '"Poppins", "Segoe UI", sans-serif',
    h1: { fontSize: "64px", fontWeight: 800 },
    h2: { fontSize: "48px", fontWeight: 700 },
    h3: { fontSize: "32px", fontWeight: 600 },
    body1: { fontSize: "16px" },
    body2: { fontSize: "14px" },
    button: { fontSize: "16px", fontWeight: 600, textTransform: "none" },
  },
});

export default theme;

