import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Switch,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  GridView,
  CenterFocusStrong,
  NightlightRound,
} from "@mui/icons-material";
import { fetchWrapper } from "../utils/fetch";
import { API_BASE_URL, CAMERA_ENDPOINTS, OBS_ENDPOINTS } from "../config";
import { useSelectedCamera } from "../utils/useSelectedCamera";

const ActionBar: React.FC = () => {
  const [streamView, setStreamView] = useState<"mosaic" | "highlight">(
    "mosaic"
  );
  const [nightMode, setNightMode] = useState(false);
  const [nightModeLoading, setNightModeLoading] = useState(false);
  const [obsError, setObsError] = useState<string | null>(null);
  const { selectedCamera } = useSelectedCamera();

  // Check night mode status
  const checkNightMode = useCallback(async () => {
    if (!selectedCamera) return;

    setNightModeLoading(true);
    await fetchWrapper(
      `${API_BASE_URL}${CAMERA_ENDPOINTS.IMAGING}?nickname=${selectedCamera}`,
      "GET",
      undefined,
      (data) => {
        const actualNightMode = data?.imaging?.brightness === 0;
        setNightMode(actualNightMode);
        setNightModeLoading(false);
      },
      (error) => {
        console.error("Failed to check night mode status:", error);
        setNightModeLoading(false);
      }
    );
  }, [selectedCamera]);

  // Handle stream view change using OBS transform endpoint
  const handleStreamViewChange = async (view: "mosaic" | "highlight") => {
    if (view === streamView) return;

    if (view === "highlight" && selectedCamera) {
      await fetchWrapper(
        `${API_BASE_URL}${OBS_ENDPOINTS.TRANSFORM}`,
        "POST",
        {
          type: "highlight",
          active_source: selectedCamera,
        },
        () => {
          setStreamView("highlight");
          setObsError(null);
        },
        (error) => {
          console.error("Failed to highlight camera:", error);
          setObsError(
            "OBS connection lost. Use the floating action button to reconnect."
          );
        }
      );
    } else if (view === "mosaic") {
      await fetchWrapper(
        `${API_BASE_URL}${OBS_ENDPOINTS.TRANSFORM}`,
        "POST",
        {
          type: "grid",
        },
        () => {
          setStreamView("mosaic");
          setObsError(null);
        },
        (error) => {
          console.error("Failed to switch to mosaic:", error);
          setObsError(
            "OBS connection lost. Use the floating action button to reconnect."
          );
        }
      );
    }
  };

  // Switch to highlight view when camera changes
  const switchToHighlight = useCallback(async () => {
    if (!selectedCamera) return;

    await fetchWrapper(
      `${API_BASE_URL}${OBS_ENDPOINTS.TRANSFORM}`,
      "POST",
      {
        type: "highlight",
        active_source: selectedCamera,
      },
      () => {
        setStreamView("highlight");
        setObsError(null);
      },
      (error) => {
        console.error("Failed to highlight camera:", error);
        setObsError(
          "OBS connection lost. Use the floating action button to reconnect."
        );
      }
    );
  }, [selectedCamera]);

  // Toggle night mode with validation
  const handleNightModeChange = async () => {
    if (!selectedCamera || nightModeLoading) return;

    setNightModeLoading(true);
    const newMode = !nightMode;

    await fetchWrapper(
      `${API_BASE_URL}${CAMERA_ENDPOINTS.NIGHT_MODE}?nickname=${selectedCamera}`,
      "POST",
      { enable: newMode },
      async () => {
        // Validate the change by checking imaging settings
        await fetchWrapper(
          `${API_BASE_URL}${CAMERA_ENDPOINTS.IMAGING}?nickname=${selectedCamera}`,
          "GET",
          undefined,
          (data) => {
            const actualNightMode = data?.imaging?.brightness === 0;
            setNightMode(actualNightMode);
            setNightModeLoading(false);

            if (actualNightMode !== newMode) {
              console.warn("Night mode change may not have taken effect");
            }
          },
          (error) => {
            console.error("Failed to validate night mode change:", error);
            setNightMode(newMode);
            setNightModeLoading(false);
          }
        );
      },
      (error) => {
        console.error("Failed to toggle night mode:", error);
        setNightModeLoading(false);
      }
    );
  };

  // Auto-dismiss OBS error after 15 seconds
  useEffect(() => {
    if (obsError) {
      const timer = setTimeout(() => {
        setObsError(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [obsError]);

  // Load state when camera changes
  useEffect(() => {
    if (selectedCamera) {
      checkNightMode();
      switchToHighlight();
    }
  }, [selectedCamera, checkNightMode, switchToHighlight]);

  return (
    <>
      {obsError && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {obsError}
        </Alert>
      )}

      <Card elevation={0} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            {/* View Mode Toggle */}
            <ToggleButtonGroup
              exclusive
              value={streamView}
              color="primary"
              onChange={(_, value) => value && handleStreamViewChange(value)}
            >
              <ToggleButton value="mosaic">
                <GridView sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value="highlight">
                <CenterFocusStrong sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Night Mode Switch */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <NightlightRound
                sx={{
                  fontSize: 18,
                  color: nightMode ? "warning.main" : "text.secondary",
                  opacity: nightModeLoading ? 0.5 : 1,
                }}
              />
              <Switch
                checked={nightMode}
                onChange={handleNightModeChange}
                disabled={nightModeLoading}
                size="small"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: "warning.main",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "warning.main",
                  },
                }}
              />
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};

export default ActionBar;
