import type React from "react";
import { useEffect, useState } from "react";
import {
  CssBaseline,
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  Stack,
  Divider,
  useMediaQuery,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { MoreVert, Refresh, Cable, Restore } from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import darkTheme from "./theme";
import Navbar from "./components/Navbar";
import CameraSelector from "./components/CameraSelector";
import ActionBar from "./components/ActionBar";
import CameraControl from "./components/CameraControl";
import Status from "./components/Status";
import { SelectedCameraProvider } from "./utils/useSelectedCamera";
import RunnerScript from "./components/RunnerScript";
import { TwitchPlayer } from "react-twitch-embed";
import { API_BASE_URL, OBS_ENDPOINTS } from "./config";
import { fetchWrapper } from "./utils/fetch";

const App: React.FC = () => {
  const [value, setValue] = useState(1);
  const [isLiveView, setIsLiveView] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  // Create simple theme
  const theme = createTheme({
    ...darkTheme,
    palette: {
      ...darkTheme.palette,
      mode: prefersDarkMode ? "dark" : "light",
    },
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
    },
  });

  useEffect(() => {
    setIsLiveView(
      !!new URLSearchParams(window.location.search).get("liveview")
    );
  }, []);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Handle floating action button menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Reconnect to OBS
  const reconnectToOBS = async () => {
    setReconnecting(true);
    setAnchorEl(null);

    await fetchWrapper(
      `${API_BASE_URL}${OBS_ENDPOINTS.RECONNECT}`,
      "POST",
      undefined,
      () => {
        setReconnecting(false);
        setNotification({
          message: "Successfully reconnected to OBS",
          type: "success",
        });
      },
      (error) => {
        console.error("Failed to reconnect to OBS:", error);
        setReconnecting(false);
        setNotification({
          message: "Failed to reconnect to OBS",
          type: "error",
        });
      }
    );
  };

  // Refresh RTSP streams with "Please Wait" toggle
  const refreshStreams = async () => {
    setRefreshing(true);
    setAnchorEl(null);

    try {
      // Switch to "Please Wait" scene
      await fetchWrapper(
        `${API_BASE_URL}${OBS_ENDPOINTS.SWITCH_SCENE}`,
        "POST",
        { scene_name: "Please Wait" },
        () => {
          console.log("Switched to Please Wait scene");
        },
        (error) => {
          console.error("Failed to switch to Please Wait:", error);
          throw new Error("Failed to switch to Please Wait scene");
        }
      );

      // Wait 5 seconds
      setTimeout(async () => {
        // Switch back to Mosaic
        await fetchWrapper(
          `${API_BASE_URL}${OBS_ENDPOINTS.SWITCH_SCENE}`,
          "POST",
          { scene_name: "Mosaic" },
          () => {
            console.log("Switched back to Mosaic scene");
            setRefreshing(false);
            setNotification({
              message: "RTSP streams refreshed successfully",
              type: "success",
            });
          },
          (error) => {
            console.error("Failed to switch back to Mosaic:", error);
            setRefreshing(false);
            setNotification({
              message: "Failed to complete stream refresh",
              type: "error",
            });
          }
        );
      }, 5000);
    } catch (error) {
      setRefreshing(false);
      setNotification({ message: "Failed to refresh streams", type: "error" });
    }
  };

  const renderTabContent = () => {
    switch (value) {
      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <Stack spacing={3}>
                <ActionBar />
                <CameraSelector />
                <CameraControl />
              </Stack>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <RunnerScript />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Status />
            </Grid>
          </Grid>
        );

      default:
        return (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <Typography variant="h6" color="text.secondary">
              Select a tab to get started
            </Typography>
          </Box>
        );
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SelectedCameraProvider>
        <div className="App">
          <Navbar value={value} handleChange={handleChange} />

          <Container
            maxWidth="xl"
            sx={{
              py: 4,
              mt: 0,
              minHeight: "calc(100vh - 120px)",
              backgroundColor: "background.default",
            }}
          >
            {!isLiveView ? null : (
              <>
                <Paper elevation={1} sx={{ mb: 4, p: 2, borderRadius: 2 }}>
                  <TwitchPlayer
                    width="95vw"
                    channel="srijansrivastava"
                    autoplay
                    parent={API_BASE_URL.replace(/:\d+$/, "").replace(
                      "http://",
                      ""
                    )}
                    muted
                  />
                </Paper>
                <Divider sx={{ mb: 4 }} />
              </>
            )}

            {renderTabContent()}
          </Container>

          {/* Floating Action Button */}
          <Fab
            color="primary"
            size="small"
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1000,
            }}
            onClick={handleMenuOpen}
            disabled={refreshing || reconnecting}
          >
            {refreshing || reconnecting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <MoreVert />
            )}
          </Fab>

          {/* Action Menu */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
          >
            <MenuItem
              onClick={refreshStreams}
              disabled={refreshing || reconnecting}
            >
              <ListItemIcon>
                <Restore fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Refresh RTSP Streams" />
            </MenuItem>
            <MenuItem
              onClick={reconnectToOBS}
              disabled={refreshing || reconnecting}
            >
              <ListItemIcon>
                <Cable fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Reconnect to OBS" />
            </MenuItem>
          </Menu>

          {/* Notification Snackbar */}
          <Snackbar
            open={Boolean(notification)}
            autoHideDuration={4000}
            onClose={() => setNotification(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Alert
              severity={notification?.type || "info"}
              onClose={() => setNotification(null)}
              sx={{ width: "100%" }}
            >
              {notification?.message}
            </Alert>
          </Snackbar>
        </div>
      </SelectedCameraProvider>
    </ThemeProvider>
  );
};

export default App;
