import type React from "react";
import { useState, useCallback, useEffect } from "react";
import { ToggleButtonGroup, ToggleButton, Alert } from "@mui/material";
import {
  GridView,
  CenterFocusStrong,
  NightlightRound,
  WbSunny,
} from "@mui/icons-material";
import { useAppContext } from "../contexts/AppContext";
import { useApi, useOBSControl, useAutoDismissError } from "../hooks";

const ActionBar: React.FC = () => {
  const [nightMode, setNightMode] = useState<boolean | undefined>(undefined);
  const [nightModeLoading, setNightModeLoading] = useState(false);

  const { selectedCamera, streamView } = useAppContext();
  const { error, setError } = useAutoDismissError();
  const { switchStreamView } = useOBSControl();
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
    <>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Stream View Toggle */}

      <ToggleButtonGroup
        value={streamView?.layout_mode || "grid"}
        exclusive
        onChange={(_, newView) => {
          if (newView) {
            switchStreamView(newView, selectedCamera || undefined);
          }
        }}
        size="small"
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
        <ToggleButtonGroup
          value={nightMode ? "dark" : "bright"}
          exclusive
          onChange={(_, newMode) => {
            if (newMode && !nightModeLoading) {
              handleNightModeToggle();
            }
          }}
          size="small"
        >
          <ToggleButton value="bright" disabled={nightModeLoading}>
            <WbSunny fontSize="inherit" />
          </ToggleButton>
          <ToggleButton value="dark" disabled={nightModeLoading}>
            <NightlightRound fontSize="inherit" />
          </ToggleButton>
        </ToggleButtonGroup>
      )}
    </>
  );
};

export default ActionBar;
