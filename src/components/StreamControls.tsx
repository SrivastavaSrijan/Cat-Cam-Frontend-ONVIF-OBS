import type React from "react";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  CircularProgress,
  Typography,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Monitor,
  Laptop,
  Close,
  PlayArrow,
  Stop,
  Assignment,
  Refresh,
  Circle,
} from "@mui/icons-material";
import { useApi, useLoading, useMjpegStream } from "../hooks";

interface StreamControlsProps {
  onRefresh: () => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({ onRefresh }) => {
  // Virtual Camera State
  const [virtualCameraStatus, setVirtualCameraStatus] =
    useState<string>("unknown");
  const [isVirtualCameraLoading, setIsVirtualCameraLoading] = useState(false);
  const [projectorLoading, setProjectorLoading] = useState(false);
  const [projectorActive, setProjectorActive] = useState(false);
  const [activeProjectorMonitor, setActiveProjectorMonitor] = useState<
    string | null
  >(null);

  // MJPEG Stream State
  const {
    isStreaming,
    isLoading,
    streamUrl,
    startStream,
    stopStream,
    fetchLogs,
    checkStatus,
  } = useMjpegStream();

  // Dialog State
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [currentLogs, setCurrentLogs] = useState("");

  const api = useApi();
  const { withLoading } = useLoading();

  // Virtual Camera Functions
  const checkVirtualCameraStatus = useCallback(async () => {
    setIsVirtualCameraLoading(true);
    try {
      const response = await withLoading(() => api.checkVirtualCameraStatus());
      const response_data = response as { success?: boolean };
      if (response_data.success) {
        setVirtualCameraStatus("active");
      } else {
        setVirtualCameraStatus("inactive");
      }
    } catch (error) {
      console.error("Failed to check virtual camera status:", error);
      setVirtualCameraStatus("inactive");
    } finally {
      setIsVirtualCameraLoading(false);
    }
  }, [api, withLoading]);

  const toggleVirtualCamera = async (action: "start" | "stop") => {
    if (isVirtualCameraLoading) return;

    setIsVirtualCameraLoading(true);
    try {
      if (action === "start") {
        await withLoading(() => api.startVirtualCamera());
        setVirtualCameraStatus("active");
        setTimeout(() => onRefresh(), 1000);
      } else {
        await withLoading(() => api.stopVirtualCamera());
        setVirtualCameraStatus("inactive");
      }
    } catch (error) {
      console.error(`Failed to ${action} virtual camera:`, error);
    } finally {
      setIsVirtualCameraLoading(false);
    }
  };

  const handleProjectorToggle = async (monitor: string | null) => {
    if (projectorLoading) return;

    setProjectorLoading(true);
    try {
      if (monitor) {
        // Start projector
        await withLoading(() => api.startProjector(monitor));
        setProjectorActive(true);
        setActiveProjectorMonitor(monitor);
      } else {
        // Close projector
        await withLoading(() => api.closeProjector());
        setProjectorActive(false);
        setActiveProjectorMonitor(null);
      }
    } catch (error) {
      console.error("Projector operation failed:", error);
    } finally {
      setProjectorLoading(false);
    }
  };

  // MJPEG Stream Functions
  const handleToggleStream = async () => {
    if (isStreaming) {
      await stopStream();
    } else {
      await startStream();
      // Auto-refresh the player after starting stream
      setTimeout(() => onRefresh(), 1000);
    }
  };

  const handleShowLogs = async () => {
    const latestLogs = await fetchLogs();
    setCurrentLogs(latestLogs);
    setLogsDialogOpen(true);
  };

  const handleRefreshLogs = async () => {
    const latestLogs = await fetchLogs();
    setCurrentLogs(latestLogs);
  };

  // Effects
  useEffect(() => {
    if (virtualCameraStatus === "unknown") {
      checkVirtualCameraStatus();
    }
  }, [checkVirtualCameraStatus, virtualCameraStatus]);

  // Refresh MJPEG status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      checkStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            {/* Virtual Camera & Projector Controls */}
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              justifyContent="space-between"
            >
              {/* Virtual Camera Controls */}
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup exclusive size="medium">
                  <ToggleButton
                    value="start"
                    selected={virtualCameraStatus === "active"}
                    disabled={isVirtualCameraLoading}
                    onClick={() => {
                      if (virtualCameraStatus === "active") {
                        toggleVirtualCamera("stop");
                      } else {
                        toggleVirtualCamera("start");
                      }
                    }}
                  >
                    {isVirtualCameraLoading ? (
                      <CircularProgress size={18} />
                    ) : virtualCameraStatus === "active" ? (
                      <Videocam fontSize="inherit" />
                    ) : (
                      <VideocamOff fontSize="inherit" />
                    )}
                  </ToggleButton>
                </ToggleButtonGroup>
                {/* MJPEG Stream Controls */}
                <Stack
                  direction="row"
                  spacing={2}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {/* MJPEG Stream Status */}

                  {/* Stream Controls */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconButton
                      size="small"
                      onClick={handleToggleStream}
                      disabled={isLoading}
                      color={isStreaming ? "error" : "success"}
                    >
                      {isLoading ? (
                        <CircularProgress size={16} />
                      ) : isStreaming ? (
                        <Stop fontSize="inherit" />
                      ) : (
                        <PlayArrow fontSize="inherit" />
                      )}
                    </IconButton>
                  </Stack>
                </Stack>
              </Stack>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
              >
                {/* MJPEG Stream Status */}
              </Stack>

              {/* Projector Controls */}
              <Box>
                <ToggleButtonGroup exclusive size="medium">
                  <ToggleButton
                    value="primary"
                    selected={activeProjectorMonitor === "primary"}
                    disabled={projectorLoading}
                    onClick={() =>
                      handleProjectorToggle(
                        activeProjectorMonitor === "primary" ? null : "primary"
                      )
                    }
                  >
                    <Monitor fontSize="inherit" />
                  </ToggleButton>
                  <ToggleButton
                    value="secondary"
                    selected={activeProjectorMonitor === "secondary"}
                    disabled={projectorLoading}
                    onClick={() =>
                      handleProjectorToggle(
                        activeProjectorMonitor === "secondary"
                          ? null
                          : "secondary"
                      )
                    }
                  >
                    <Laptop fontSize="inherit" />
                  </ToggleButton>
                  {projectorActive && (
                    <ToggleButton
                      value="close"
                      onClick={() => handleProjectorToggle(null)}
                      disabled={projectorLoading}
                    >
                      <Close fontSize="inherit" />
                    </ToggleButton>
                  )}
                </ToggleButtonGroup>
              </Box>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Logs Dialog */}
      <Dialog
        open={logsDialogOpen}
        onClose={() => setLogsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">MJPEG Stream Logs</Typography>
            <Button
              size="small"
              onClick={handleRefreshLogs}
              startIcon={<Refresh />}
            >
              Refresh
            </Button>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            fullWidth
            rows={20}
            value={currentLogs || "No logs available"}
            variant="outlined"
            InputProps={{
              readOnly: true,
              style: {
                fontFamily: "monospace",
                fontSize: "0.875rem",
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StreamControls;
