import type React from "react";
import { useState } from "react";
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Stack,
  useMediaQuery,
  Card,
  CardContent,
} from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import darkTheme from "./theme";
import {
  Navbar,
  CameraSelector,
  ActionBar,
  Status,
  RunnerScript,
  InstallPrompt,
  Fabs,
  StreamControls,
  ControllerOverlay,
  Presets,
  PlayerWithController,
} from "./components";
import { AppProvider } from "./contexts/AppContext";
import { NotificationProvider } from "./contexts";
import MovementControls from "./components/MovementControls";

const App: React.FC = () => {
  const [value, setValue] = useState(1);
  const [cameraOverlayOpen, setCameraOverlayOpen] = useState(false);
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

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const renderTabContent = () => {
    switch (value) {
      case 1:
        return (
          <Stack spacing={3}>
            <CameraSelector />
            <Presets />
            <PlayerWithController
              title="SSV Cam"
              height={200}
              autoPlay={true}
              controls={true}
            />
            <Card>
              <CardContent>
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <StreamControls />
                  <Box flexGrow={1} />
                  <ActionBar />
                </Stack>
              </CardContent>
            </Card>
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
        <AppProvider>
          <div className="App">
            <Navbar value={value} handleChange={handleChange} />

            <Container maxWidth="sm">
              <Box py={3} mx="auto">
                {renderTabContent()}
              </Box>
            </Container>

            <Fabs onCameraOverlayOpen={setCameraOverlayOpen} />

            {/* Standalone App-level Camera Overlay */}
            <ControllerOverlay
              open={cameraOverlayOpen}
              onClose={() => setCameraOverlayOpen(false)}
              isOverlayMode={false} // Use standalone mode with solid background
            />

            <InstallPrompt />
          </div>
        </AppProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
