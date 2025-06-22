// src/theme.ts
import { createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  typography: {
    fontFamily: `"Inter", "SF Pro Display", "Segoe UI", "Roboto", sans-serif`,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
  },
  palette: {
    mode: "dark",
    background: {
      default: "#1a1d23", // Warm dark gray instead of pure black
      paper: "#242831", // Slightly lighter warm gray for cards
    },
    divider: "rgba(255, 255, 255, 0.08)",
    text: {
      primary: "#e8eaed", // Soft white
      secondary: "#9aa0a6", // Muted gray
      disabled: "#5f6368", // Darker muted gray
    },
    primary: {
      main: "#cd7f32", // Rust
      light: "#d9a66b", // Light rust
      dark: "#a65d1e", // Darker rust
      contrastText: "#1a1d23",
    },
    secondary: {
      main: "#fdd663", // Warm golden yellow (keeps the warm accent)
      light: "#fde68a", // Light yellow
      dark: "#f59e0b", // Deeper gold
      contrastText: "#1a1d23",
    },
    error: {
      main: "#f28b82", // Soft coral red
      light: "#fcb1a6", // Light coral
      dark: "#ea4335", // Deeper red
    },
    warning: {
      main: "#fdd663", // Warm amber
      light: "#fde68a", // Light amber
      dark: "#f59e0b", // Deep amber
    },
    info: {
      main: "#8fbc8f", // Use olive for info too
      light: "#a8cfa8", // Light olive
      dark: "#6b8e6b", // Deep olive
    },
    success: {
      main: "#7fb069", // Slightly more vibrant sage green
      light: "#a7f3d0", // Light mint
      dark: "#5a8f47", // Deep green
    },
  },
  components: {
    MuiSvgIcon: {
      defaultProps: {
        fontSize: "inherit", // Default icon size
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#242831",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          borderRadius: "12px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#242831",
          borderRadius: "8px",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 500,
        },
      },
    },
  },
});

export default darkTheme;
