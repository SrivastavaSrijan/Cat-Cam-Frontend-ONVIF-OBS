import type React from "react";
import { useState } from "react";
import {
  CssBaseline,
  Container,
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import darkTheme from "./theme";
import {
  CameraSelector,
  ActionBar,
  Status,
  RunnerScript,
  InstallPrompt,
  Fabs,
  StreamControls,
  ControllerOverlay,
  Presets,
  Player,
} from "./components";
import { NotificationProvider, AppProvider } from "./contexts";
import MovementControls from "./components/MovementControls";

const App: React.FC = () => {
  const [value, setValue] = useState(1);
  const [cameraOverlayOpen, setCameraOverlayOpen] = useState(false);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const disablePlayer =
    new URLSearchParams(window.location.search).get("disablePlayer") === "true";

  const renderTabContent = () => {
    switch (value) {
      case 1:
        return (
          <Stack spacing={{ xs: 2, md: 3 }}>
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
            {!disablePlayer && <Player />}
            <CameraSelector />
            <Presets />
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
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <NotificationProvider>
        <AppProvider>
          <div className="App">
            <Container maxWidth="sm">
              <Box py={{ xs: 3, md: 4 }} mx="auto">
                {renderTabContent()}
              </Box>
            </Container>

            <Fabs
              onCameraOverlayOpen={setCameraOverlayOpen}
              currentTab={value}
              onTabChange={handleChange}
            />

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
