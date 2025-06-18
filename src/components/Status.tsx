import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Refresh,
  Videocam,
  VideocamOff,
  Speed,
  PanTool,
} from "@mui/icons-material";
import { fetchWrapper } from "../utils/fetch";
import { API_BASE_URL, CAMERA_ENDPOINTS } from "../config";
import { useSelectedCamera } from "../utils/useSelectedCamera";

interface CameraStatus {
  PTZPosition: {
    PanTilt: { x: number; y: number };
    Zoom: { x: number };
  };
}

interface CameraInfo {
  nickname: string;
  host: string;
  port: number;
  status: "online" | "offline";
  error?: string;
  limits?: any;
  current_position?: any;
}

const Status: React.FC = () => {
  const [currentStatus, setCurrentStatus] = useState<CameraStatus | null>({
    PTZPosition: {
      PanTilt: { x: 0, y: 0 },
      Zoom: { x: 0 },
    },
  });
  const [allCameras, setAllCameras] = useState<CameraInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { selectedCamera } = useSelectedCamera();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const fetchCurrentCameraStatus = useCallback(async () => {
    if (!selectedCamera) return;

    setLoading(true);
    setError(null);

    await fetchWrapper(
      `${API_BASE_URL}${CAMERA_ENDPOINTS.STATUS}?nickname=${selectedCamera}`,
      "GET",
      undefined,
      (data: CameraStatus) => {
        setCurrentStatus(data);
        setLastUpdate(new Date());
        setLoading(false);
      },
      (error) => {
        setError(`Failed to fetch status for ${selectedCamera}`);
        setLoading(false);
      }
    );
  }, [selectedCamera]);

  const fetchAllCameras = useCallback(async () => {
    setLoading(true);
    setError(null);

    await fetchWrapper(
      `${API_BASE_URL}${CAMERA_ENDPOINTS.CAMERAS}`,
      "GET",
      undefined,
      (data: { cameras: CameraInfo[] }) => {
        setAllCameras(data.cameras || []);
        setLastUpdate(new Date());
        setLoading(false);
      },
      (error) => {
        setError("Failed to fetch camera information");
        setLoading(false);
      }
    );
  }, []);

  const formatPosition = (value: number) => {
    return value.toFixed(3);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      default:
        return "default";
    }
  };

  useEffect(() => {
    fetchCurrentCameraStatus();
    fetchAllCameras();
  }, [fetchCurrentCameraStatus, fetchAllCameras]);

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Camera Status</Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          {loading && <CircularProgress size={20} />}
          <IconButton
            onClick={() => {
              fetchCurrentCameraStatus();
              fetchAllCameras();
            }}
            disabled={loading}
          >
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Current Camera Detailed Status */}
      {currentStatus && (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Current Camera: {selectedCamera}
          </Typography>

          <Grid container spacing={2}>
            {/* PTZ Position */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <PanTool fontSize="small" />
                    <Typography variant="subtitle1">PTZ Position</Typography>
                  </Stack>

                  <Stack spacing={1}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Pan (X):</Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatPosition(currentStatus.PTZPosition.PanTilt.x)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">Tilt (Y):</Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {formatPosition(currentStatus.PTZPosition.PanTilt.y)}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Movement Limits */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <Speed fontSize="small" />
                    <Typography variant="subtitle1">Movement Limits</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Divider />

      {/* All Cameras Overview */}
      <Box>
        <Typography variant="h6" gutterBottom>
          All Cameras Overview
        </Typography>

        <Grid container spacing={2}>
          {allCameras.map((camera) => (
            <Grid item xs={12} sm={6} md={4} key={camera.nickname}>
              <Card
                variant="outlined"
                sx={{
                  border: camera.nickname === selectedCamera ? 2 : 1,
                  borderColor:
                    camera.nickname === selectedCamera
                      ? "primary.main"
                      : "divider",
                }}
              >
                <CardContent>
                  <Stack spacing={2}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="subtitle1" noWrap>
                        {camera.nickname}
                      </Typography>
                      {camera.status === "online" ? (
                        <Videocam color="success" fontSize="small" />
                      ) : (
                        <VideocamOff color="error" fontSize="small" />
                      )}
                    </Stack>

                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Status:</Typography>
                        <Chip
                          size="small"
                          label={camera.status}
                          color={getStatusColor(camera.status) as any}
                          variant="outlined"
                        />
                      </Stack>

                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2">Host:</Typography>
                        <Typography variant="body2" fontFamily="monospace">
                          {camera.host}:{camera.port}
                        </Typography>
                      </Stack>

                      {camera.error && (
                        <Typography variant="caption" color="error">
                          {camera.error}
                        </Typography>
                      )}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Refresh Info */}
      <Typography variant="caption" color="text.secondary" textAlign="center">
        Status refreshes automatically when switching cameras. Click refresh for
        latest information.
      </Typography>
    </Stack>
  );
};

export default Status;
