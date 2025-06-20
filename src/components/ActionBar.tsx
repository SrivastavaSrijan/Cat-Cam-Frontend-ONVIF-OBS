import type React from "react";
import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  Alert,
  FormControlLabel,
} from "@mui/material";
import {
  GridView,
  CenterFocusStrong,
  NightlightRound,
} from "@mui/icons-material";
import { useCameraDataManagerContext } from "../contexts/CameraDataManagerContext";
import { useApi, useOBSControl, useAutoDismissError } from "../hooks";

const ActionBar: React.FC = () => {
  const [nightMode, setNightMode] = useState<boolean | undefined>(undefined);
  const [nightModeLoading, setNightModeLoading] = useState(false);

  const { selectedCamera } = useCameraDataManagerContext();
  const { error, setError } = useAutoDismissError();
  const { switchStreamView, streamView } = useOBSControl();
  const api = useApi();
  // Check night mode status
  const checkNightMode = useCallback(async () => {
    if (!selectedCamera) return;

    setNightModeLoading(true);
    try {
      const data = await api.getCameraImaging(selectedCamera);
      const actualNightMode =
        (data as { imaging?: { brightness?: number } })?.imaging?.brightness ===
        0;
      setNightMode(actualNightMode);
    } catch (error) {
      console.error("Failed to check night mode status:", error);
    } finally {
      setNightModeLoading(false);
    }
  }, [selectedCamera, api]);

  // Handle night mode toggle
  const handleNightModeToggle = useCallback(async () => {
    if (!selectedCamera || nightModeLoading) return;

    const newNightMode = !nightMode;
    setNightModeLoading(true);

    try {
      await api.toggleNightMode(selectedCamera, newNightMode);
      setNightMode(newNightMode);
      setError(null);
    } catch (error) {
      console.error("Failed to toggle night mode:", error);
      setError("Failed to toggle night mode");
    } finally {
      setNightModeLoading(false);
    }
  }, [selectedCamera, nightMode, nightModeLoading, api, setError]);

  // Check night mode when camera changes
  useEffect(() => {
    if (selectedCamera && nightMode === undefined) {
      checkNightMode();
    }
  }, [selectedCamera, checkNightMode, nightMode]);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Stream View Toggle */}
          <Stack
            spacing={1}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <ToggleButtonGroup
              value={streamView}
              exclusive
              onChange={(_, newView) => {
                if (newView) {
                  switchStreamView(newView, selectedCamera || undefined);
                }
              }}
              size="medium"
            >
              <ToggleButton value="grid">
                <GridView fontSize="inherit" />
              </ToggleButton>
              <ToggleButton value="highlight">
                <CenterFocusStrong fontSize="inherit" />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Night Mode Toggle */}
            {selectedCamera && (
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={nightMode}
                      onChange={handleNightModeToggle}
                      disabled={nightModeLoading}
                      size="small"
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <NightlightRound fontSize="inherit" />
                    </Stack>
                  }
                />
              </Stack>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ActionBar;
