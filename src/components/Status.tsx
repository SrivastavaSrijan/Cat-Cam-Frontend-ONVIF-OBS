import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
} from "@mui/material";
import { Refresh, Videocam, VideocamOff } from "@mui/icons-material";
import { useCameraDataManagerContext } from "../contexts/CameraDataManagerContext";
import { useAutoDismissError } from "../hooks";

const Status: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const {
    selectedCamera,
    allCameras,
    getCameraData,
    loadCameraList,
    loadCameraData,
  } = useCameraDataManagerContext();
  const { error, setError } = useAutoDismissError();

  // Get current camera data
  const cameraData = selectedCamera ? getCameraData(selectedCamera) : null;
  const currentStatus = cameraData?.status;

  const fetchCurrentCameraStatus = useCallback(async () => {
    if (!selectedCamera) return;

    try {
      await loadCameraData(selectedCamera);
      setLastUpdate(new Date());
      setError(null);
    } catch (error) {
      setError(`Failed to fetch status for ${selectedCamera}`);
    }
  }, [selectedCamera, loadCameraData, setError]);

  const fetchAllCameras = useCallback(async () => {
    try {
      await loadCameraList();
      setLastUpdate(new Date());
      setError(null);
    } catch (error) {
      setError("Failed to fetch camera information");
    }
  }, [loadCameraList, setError]);

  const refreshData = useCallback(async () => {
    await Promise.all([fetchCurrentCameraStatus(), fetchAllCameras()]);
  }, [fetchCurrentCameraStatus, fetchAllCameras]);

  const formatPosition = (value: number) => {
    return value?.toFixed(3);
  };

  const getStatusColor = (status: string): "success" | "error" | "default" => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Stack spacing={3}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">System Status</Typography>
            <IconButton onClick={refreshData} disabled={cameraData?.isLoading}>
              {cameraData?.isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <Refresh />
              )}
            </IconButton>
          </Stack>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </CardContent>
      </Card>

      {/* Current Camera Status */}
      {selectedCamera && currentStatus && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {selectedCamera} Position
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Pan
                  </Typography>
                  <Typography variant="h6">
                    {formatPosition(currentStatus.PTZPosition?.PanTilt?.x)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tilt
                  </Typography>
                  <Typography variant="h6">
                    {formatPosition(currentStatus.PTZPosition?.PanTilt?.y)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Divider />
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Zoom
                  </Typography>
                  <Typography variant="h6">
                    {formatPosition(currentStatus.PTZPosition?.Zoom?.x)}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* All Cameras Status */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            All Cameras ({allCameras.length})
          </Typography>
          <Stack spacing={2}>
            {allCameras.map((camera) => (
              <Card key={camera.nickname} variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Stack direction="row" alignItems="center" spacing={2}>
                      {camera.status === "online" ? (
                        <Videocam color="success" />
                      ) : (
                        <VideocamOff color="error" />
                      )}
                      <Stack>
                        <Typography variant="subtitle1">
                          {camera.nickname}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textOverflow="ellipsis"
                          overflow="hidden"
                          whiteSpace="nowrap"
                          width="25ch"
                        >
                          {camera.host}:{camera.port}
                        </Typography>
                      </Stack>
                    </Stack>
                    <Chip
                      label={camera.status}
                      color={getStatusColor(camera.status)}
                      size="small"
                    />
                  </Stack>
                  {camera.error && (
                    <Typography variant="body2" color="error">
                      {camera.error}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default Status;
