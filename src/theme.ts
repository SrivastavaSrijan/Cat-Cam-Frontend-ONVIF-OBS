// src/theme.ts
import { createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  typography: {
    fontFamily: `"Poppins", "Helvetica", "Arial", sans-serif`,
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
  },
  palette: {
    mode: "dark",
    divider: "rgba(255, 255, 255, 0.12)",
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
      disabled: "rgba(255, 255, 255, 0.5)",
    },
    primary: {
      main: "#f48fb1",
      light: "#ffc1e3",
      dark: "#bf5f82",
    },
    secondary: {
      main: "#90caf9",
      light: "#c3fdff",
      dark: "#5d99c6",
    },
    error: {
      main: "#f44336",
      light: "#ff7961",
      dark: "#ba000d",
    },
    warning: {
      main: "#ffa726",
      light: "#ffd95b",
      dark: "#c77800",
    },
    info: {
      main: "#29b6f6",
      light: "#4fc3f7",
      dark: "#0288d1",
    },
    success: {
      main: "#66bb6a",
      light: "#98ee99",
      dark: "#338a3e",
    },
  },
});

export default darkTheme;
