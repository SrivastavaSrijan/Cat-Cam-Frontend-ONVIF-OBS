import type React from "react";
import { useEffect } from "react";
import {
  Select,
  MenuItem,
  Box,
  Stack,
  Typography,
  FormControl,
  Card,
  CardContent,
  Chip,
  Badge,
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { useSelectedCamera } from "../utils/useSelectedCamera";
import { fetchWrapper } from "../utils/fetch";
import { API_BASE_URL, OBS_ENDPOINTS } from "../config";

const CameraSelector: React.FC = () => {
  const {
    selectedCamera,
    cameraList,
    allCameras,
    onlineCameraCount,
    totalCameraCount,
    handleCameraChange,
  } = useSelectedCamera();

  // Auto-select first online camera if none selected and cameras are available
  useEffect(() => {
    const selectFirst = () => {
      if (!selectedCamera && cameraList.length > 0) {
        // Select first online camera by default
        handleCameraChange(cameraList[0]);
        console.log("Auto-selected first online camera:", cameraList[0]);
      }
    };
    const timer = setTimeout(selectFirst, 500);
    return () => clearTimeout(timer);
  }, [cameraList, selectedCamera, handleCameraChange]);

  // Optional: Try to check for currently highlighted camera (but don't depend on it)
  useEffect(() => {
    const checkCurrentlyHighlighted = async () => {
      // Only check if no camera is already selected and we have cameras
      if (selectedCamera || cameraList.length === 0) return;

      await fetchWrapper(
        `${API_BASE_URL}${OBS_ENDPOINTS.CURRENT_TRANSFORMATION}`,
        "GET",
        undefined,
        (data: {
          layout_mode: "grid" | "highlight";
          highlighted_source?: string;
        }) => {
          if (
            data.layout_mode === "highlight" &&
            data.highlighted_source &&
            cameraList.includes(data.highlighted_source)
          ) {
            handleCameraChange(data.highlighted_source);
            console.log("Found highlighted camera:", data.highlighted_source);
          }
        },
        (error) => {
          console.warn(
            "Could not check currently highlighted camera (OBS may be disconnected):",
            error
          );
          // This is fine - we'll fall back to auto-selecting first camera
        }
      );
    };
    // Small delay to let the auto-selection happen first
    checkCurrentlyHighlighted();
  }, [cameraList, selectedCamera, handleCameraChange]);

  const handleSelectChange = (event: { target: { value: unknown } }) => {
    const camera = event.target.value as string;
    // Only allow selecting online cameras
    const cameraData = allCameras.find((c) => c.nickname === camera);
    if (cameraData?.status === "online") {
      handleCameraChange(camera);
    }
  };

  const getCameraIcon = (status: string) => {
    return status === "online" ? (
      <Videocam sx={{ fontSize: 20, color: "success.main" }} />
    ) : (
      <VideocamOff sx={{ fontSize: 20, color: "error.main" }} />
    );
  };

  const getStatusColor = (status: string) => {
    return status === "online" ? "success.main" : "error.main";
  };

  return (
    <Card elevation={1} sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Camera Selection */}
        <Stack direction="column" spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1}
            width="100%"
          >
            <Typography
              variant="subtitle2"
              sx={{ mb: 1.5, color: "text.secondary" }}
            >
              Select Camera
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircleIcon
                sx={{
                  fontSize: 8,
                  color: onlineCameraCount > 0 ? "success.main" : "error.main",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                }}
              >
                {onlineCameraCount}/{totalCameraCount} online
              </Typography>
            </Stack>
          </Stack>

          <FormControl fullWidth>
            <Select
              value={selectedCamera || ""}
              onChange={handleSelectChange}
              displayEmpty
              variant="outlined"
              sx={{
                borderRadius: 2,
                "& .MuiSelect-select": {
                  py: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                },
              }}
            >
              <MenuItem value="" disabled>
                <Typography color="text.secondary">
                  Choose a camera...
                </Typography>
              </MenuItem>
              {allCameras.map((camera) => (
                <MenuItem
                  key={camera.nickname}
                  value={camera.nickname}
                  disabled={camera.status === "offline"}
                  sx={{
                    opacity: camera.status === "offline" ? 0.6 : 1,
                  }}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ width: "100%" }}
                  >
                    {getCameraIcon(camera.status)}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ flex: 1 }}
                    >
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 500,
                          color:
                            camera.status === "offline"
                              ? "text.disabled"
                              : "text.primary",
                        }}
                      >
                        {camera.nickname}
                      </Typography>
                      <Chip
                        label={camera.status}
                        size="small"
                        color={camera.status === "online" ? "success" : "error"}
                        variant="outlined"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          borderWidth: 1,
                        }}
                      />
                    </Stack>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CameraSelector;
