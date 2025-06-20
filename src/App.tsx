import type React from "react";
import { useState, useRef, useEffect } from "react";
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Stack,
  useMediaQuery,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { MoreVert, Cable, Restore, Gesture } from "@mui/icons-material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import darkTheme from "./theme";
import {
  Navbar,
  CameraSelector,
  ActionBar,
  CameraControl,
  Status,
  CameraOverlay,
  RunnerScript,
  MjpegPlayer,
  InstallPrompt,
} from "./components";
import { CameraDataManagerProvider } from "./contexts/CameraDataManagerContext";
import { NotificationProvider } from "./contexts";
import { useOBSControl } from "./hooks";
import MovementControls from "./components/MovementControls";

const App: React.FC = () => {
  const [value, setValue] = useState(1);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [cameraOverlayOpen, setCameraOverlayOpen] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const {
    refreshStreams,
    reconnect,
    loading: obsLoading,
    isRefreshing,
  } = useOBSControl();

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

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Handle floating action button menu (short press)
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    const timer = longPressTimerRef.current;
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  const renderTabContent = () => {
    switch (value) {
      case 1:
        return (
          <Stack spacing={3}>
            <CameraSelector />
            <CameraControl />
            <MjpegPlayer
              title="SSV Cam"
              height={200}
              autoPlay={true}
              controls={true}
            />
            <ActionBar />
            <MovementControls />
          </Stack>
        );

      case 2:
        return <RunnerScript />;

      case 3:
        return <Status />;

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
      <NotificationProvider>
        <CameraDataManagerProvider>
          <div className="App">
            <Navbar value={value} handleChange={handleChange} />

            <Container maxWidth="sm">
              <Box py={3} mx="auto">
                {renderTabContent()}
              </Box>
            </Container>

            {/* Floating Action Buttons */}
            <Fab
              color="primary"
              size="small"
              onClick={() => setCameraOverlayOpen(true)}
              disabled={obsLoading}
              sx={{
                position: "fixed",
                bottom: 16,
                right: 16,
                zIndex: 1000,
              }}
            >
              <Gesture />
            </Fab>

            <Fab
              color="primary"
              size="small"
              onClick={handleMenuOpen}
              disabled={obsLoading || isRefreshing}
              sx={{
                position: "fixed",
                bottom: 16,
                right: 72,
                zIndex: 1000,
              }}
            >
              {obsLoading || isRefreshing ? (
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
                onClick={() => {
                  refreshStreams();
                  handleMenuClose();
                }}
                disabled={obsLoading || isRefreshing}
              >
                <ListItemIcon>
                  <Restore fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Refresh RTSP Streams" />
              </MenuItem>
              <MenuItem
                onClick={() => {
                  reconnect();
                  handleMenuClose();
                }}
                disabled={obsLoading}
              >
                <ListItemIcon>
                  <Cable fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Reconnect to OBS" />
              </MenuItem>
            </Menu>

            {/* Camera Control Overlay */}
            <CameraOverlay
              open={cameraOverlayOpen}
              onClose={() => setCameraOverlayOpen(false)}
            />

            {/* PWA Install Prompt */}
            <InstallPrompt />
          </div>
        </CameraDataManagerProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
