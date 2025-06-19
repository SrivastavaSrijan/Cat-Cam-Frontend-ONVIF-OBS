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
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 8px rgba(143, 188, 143, 0.3)",
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          "&.Mui-selected": {
            backgroundColor: "#8fbc8f",
            color: "#1a1d23",
            "&:hover": {
              backgroundColor: "#a8cfa8",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
        },
        colorSuccess: {
          backgroundColor: "rgba(127, 176, 105, 0.2)",
          color: "#7fb069",
          borderColor: "rgba(127, 176, 105, 0.5)",
        },
        colorError: {
          backgroundColor: "rgba(242, 139, 130, 0.2)",
          color: "#f28b82",
          borderColor: "rgba(242, 139, 130, 0.5)",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
        },
        standardWarning: {
          backgroundColor: "rgba(253, 214, 99, 0.1)",
          color: "#fdd663",
          border: "1px solid rgba(253, 214, 99, 0.3)",
        },
        standardError: {
          backgroundColor: "rgba(242, 139, 130, 0.1)",
          color: "#f28b82",
          border: "1px solid rgba(242, 139, 130, 0.3)",
        },
        standardSuccess: {
          backgroundColor: "rgba(127, 176, 105, 0.1)",
          color: "#7fb069",
          border: "1px solid rgba(127, 176, 105, 0.3)",
        },
        standardInfo: {
          backgroundColor: "rgba(143, 188, 143, 0.1)",
          color: "#8fbc8f",
          border: "1px solid rgba(143, 188, 143, 0.3)",
        },
      },
    },
  },
});

export default darkTheme;
