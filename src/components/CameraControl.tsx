import type React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  Alert,
  Stack,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack,
  ArrowDownward,
  ArrowForward,
  ArrowUpward,
  Home,
  Refresh,
  Videocam,
} from "@mui/icons-material";
import { fetchWrapper } from "../utils/fetch";
import { API_BASE_URL, CAMERA_ENDPOINTS } from "../config";
import { useSelectedCamera } from "../utils/useSelectedCamera";
import { CAMERA_PRESETS } from "../utils/contants";

interface Preset {
  Name: string;
  Token: string;
  PTZPosition?: {
    PanTilt: { x: number; y: number };
    Zoom: { x: number };
  };
}

interface CameraStatus {
  PTZPosition: {
    PanTilt: { x: number; y: number };
    Zoom: { x: number };
  };
  limits: {
    x_max: number;
    x_min: number;
    y_max: number;
    y_min: number;
    max_velocity: number;
  };
}

const CameraControl: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [presetsLoading, setPresetsLoading] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<CameraStatus | null>(null);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [isContinuousMoving, setIsContinuousMoving] = useState<boolean>(false);

  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  const { selectedCamera } = useSelectedCamera();

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchCurrentCameraStatus = useCallback(async () => {
    if (!selectedCamera) return;

    setPresetsLoading(true);
    setError(null);

    await fetchWrapper(
      `${API_BASE_URL}${CAMERA_ENDPOINTS.STATUS}?nickname=${selectedCamera}`,
      "GET",
      undefined,
      (data: CameraStatus) => {
        setCurrentStatus(data);
        fetchPresets(data);
      },
      (error) => {
        setError(`Failed to fetch status for ${selectedCamera}`);
        setPresetsLoading(false);
      }
    );
  }, [selectedCamera]);

  // Fetch camera presets - Fixed infinite loop by removing selectedPreset dependency
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const fetchPresets = useCallback(
    async (status: CameraStatus) => {
      if (!selectedCamera) return;

      setPresetsLoading(true);
      setError(null);

      await fetchWrapper(
        `${API_BASE_URL}${CAMERA_ENDPOINTS.PRESETS}?nickname=${selectedCamera}`,
        "GET",
        undefined,
        (data: { presets: Preset[] }) => {
          const cleanedPresets = (data.presets || []).filter(
            (preset) => preset?.PTZPosition
          );
          setPresets(cleanedPresets);
          setPresetsLoading(false);

          // Set first preset as selected if none selected
          if (cleanedPresets.length > 0) {
            const { x, y } = status?.PTZPosition?.PanTilt ?? {};
            console.log(x, y);
            const presetAtPosition = cleanedPresets.find(
              (preset) =>
                preset.PTZPosition?.PanTilt?.x === x &&
                preset.PTZPosition?.PanTilt?.y === y
            );
            if (presetAtPosition) {
              setSelectedPreset(presetAtPosition.Token);
            } else if (!selectedPreset) {
              // If no preset is selected, default to the first available preset
              setSelectedPreset(cleanedPresets[0].Token);
            }
          }
        },
        (error) => {
          console.error("Failed to fetch presets:", error);
          setError("Camera is offline or unavailable");
          setPresetsLoading(false);
          setPresets([]);
        }
      );
    },
    [selectedCamera]
  ); // Removed selectedPreset from dependencies

  // Handle preset selection
  const handlePresetSelect = async (presetToken: string) => {
    if (!selectedCamera || presetToken === selectedPreset) return;

    setSelectedPreset(presetToken);
    await fetchWrapper(
      `${API_BASE_URL}${CAMERA_ENDPOINTS.GOTO_PRESET}?nickname=${selectedCamera}`,
      "POST",
      { presetToken },
      () => {
        const preset = presets.find((p) => p.Token === presetToken);
        console.log("Moved to preset:", preset?.Name);
      },
      (error) => {
        setError("Failed to go to preset");
        setSelectedPreset(null);
      }
    );
  };

  // Load data when camera changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (selectedCamera) {
      setError(null);
      setPresets([]);
      setSelectedPreset(null);
      fetchCurrentCameraStatus();
    }
  }, [selectedCamera]);

  const handleDirectionStart = (direction: string) => {
    if (!selectedCamera || isContinuousMoving) return;

    pressStartTimeRef.current = Date.now();

    // Set timer for long press detection (500ms)
    pressTimerRef.current = setTimeout(async () => {
      setIsContinuousMoving(true);
      setIsMoving(true);

      try {
        await fetchWrapper(
          `${API_BASE_URL}/ptz/continuous_move?nickname=${selectedCamera}`,
          "POST",
          {
            direction,
            speed: 1,
          }
        );
      } catch (err) {
        console.error("Movement error:", err);
        setError("Failed to start movement.");
        setIsMoving(false);
        setIsContinuousMoving(false);
      }
    }, 100);
  };

  const handleDirectionEnd = async (direction?: string) => {
    if (!selectedCamera) return;

    const pressDuration = Date.now() - pressStartTimeRef.current;

    // Clear the long press timer
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }

    if (isContinuousMoving) {
      // Stop continuous movement
      try {
        await fetchWrapper(
          `${API_BASE_URL}/ptz/stop?nickname=${selectedCamera}`,
          "POST"
        );
      } catch (err) {
        console.error("Stop movement error:", err);
        setError("Failed to stop movement.");
      } finally {
        setIsMoving(false);
        setIsContinuousMoving(false);
      }
    } else if (pressDuration < 500 && direction) {
      // Handle as tap (short press)
      try {
        await fetchWrapper(
          `${API_BASE_URL}/ptz/move?nickname=${selectedCamera}`,
          "POST",
          {
            direction,
            velocity_factor: 1,
          }
        );
      } catch (err) {
        console.error("Tap movement error:", err);
        setError("Failed to move camera.");
      }
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
      }
    };
  }, []);

  if (!selectedCamera) {
    return (
      <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
        <Videocam sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography variant="body1">Select a camera to begin</Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ borderRadius: 3, fontSize: "0.875rem" }}
        >
          {error}
        </Alert>
      )}

      {/* Presets */}
      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, fontSize: "0.875rem" }}
            >
              Presets
            </Typography>
            <IconButton
              onClick={fetchCurrentCameraStatus}
              disabled={presetsLoading}
              size="small"
              sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}
            >
              <Refresh sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          {presets.length > 0 ? (
            <ToggleButtonGroup
              exclusive
              value={selectedPreset}
              onChange={(_, value) => value && handlePresetSelect(value)}
              sx={{
                width: "100%",
                gap: 0.75,
                "& .MuiToggleButton-root": {
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2.5,
                  px: 2,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: "0.8rem",
                  minWidth: "auto",
                  flex: 1,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    borderColor: "primary.main",
                  },
                },
              }}
            >
              {presets.map((preset) => (
                <ToggleButton key={preset.Token} value={preset.Token}>
                  {CAMERA_PRESETS.get(selectedCamera)?.get(preset.Name) ||
                    preset.Name}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 2, fontSize: "0.8rem" }}
            >
              {presetsLoading ? "Loading..." : "No presets"}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Movement Controls */}
      <Card elevation={0} sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gridTemplateRows: "1fr 1fr 1fr",
              gap: 1,
              maxWidth: 200,
              mx: "auto",
            }}
          >
            {/* Grid layout: 3x3 with movement controls */}
            <Box /> {/* Empty top-left */}
            <IconButton
              onMouseDown={() => handleDirectionStart("up")}
              onMouseUp={() => handleDirectionEnd("up")}
              onMouseLeave={() => handleDirectionEnd()}
              onTouchStart={() => handleDirectionStart("up")}
              onTouchEnd={() => handleDirectionEnd("up")}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                borderRadius: 2,
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              <ArrowUpward sx={{ fontSize: 20 }} />
            </IconButton>
            <Box /> {/* Empty top-right */}
            <IconButton
              onMouseDown={() => handleDirectionStart("left")}
              onMouseUp={() => handleDirectionEnd("left")}
              onMouseLeave={() => handleDirectionEnd()}
              onTouchStart={() => handleDirectionStart("left")}
              onTouchEnd={() => handleDirectionEnd("left")}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                borderRadius: 2,
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <IconButton
              sx={{
                width: 48,
                height: 48,
                backgroundColor: "action.hover",
                borderRadius: 2,
                "&:hover": { backgroundColor: "action.selected" },
              }}
            >
              <Home sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              onMouseDown={() => handleDirectionStart("right")}
              onMouseUp={() => handleDirectionEnd("right")}
              onMouseLeave={() => handleDirectionEnd()}
              onTouchStart={() => handleDirectionStart("right")}
              onTouchEnd={() => handleDirectionEnd("right")}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                borderRadius: 2,
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              <ArrowForward sx={{ fontSize: 20 }} />
            </IconButton>
            <Box /> {/* Empty bottom-left */}
            <IconButton
              onMouseDown={() => handleDirectionStart("down")}
              onMouseUp={() => handleDirectionEnd("down")}
              onMouseLeave={() => handleDirectionEnd()}
              onTouchStart={() => handleDirectionStart("down")}
              onTouchEnd={() => handleDirectionEnd("down")}
              sx={{
                width: 48,
                height: 48,
                backgroundColor: "primary.main",
                color: "primary.contrastText",
                borderRadius: 2,
                "&:hover": { backgroundColor: "primary.dark" },
              }}
            >
              <ArrowDownward sx={{ fontSize: 20 }} />
            </IconButton>
            <Box /> {/* Empty bottom-right */}
          </Box>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default CameraControl;
