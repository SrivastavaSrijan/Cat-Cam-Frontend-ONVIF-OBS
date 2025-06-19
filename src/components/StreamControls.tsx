import type React from "react";
import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Box,
  CircularProgress,
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Monitor,
  Laptop,
  Close,
} from "@mui/icons-material";
import { useApi, useLoading } from "../hooks";

interface StreamControlsProps {
  onRefresh: () => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({ onRefresh }) => {
  const [virtualCameraStatus, setVirtualCameraStatus] =
    useState<string>("unknown");
  const [isVirtualCameraLoading, setIsVirtualCameraLoading] = useState(false);
  const [projectorLoading, setProjectorLoading] = useState(false);
  const [projectorActive, setProjectorActive] = useState(false);
  const [activeProjectorMonitor, setActiveProjectorMonitor] = useState<
    string | null
  >(null);
  const api = useApi();
  const { withLoading } = useLoading();

  // Initialize virtual camera status on first use
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

  useEffect(() => {
    if (virtualCameraStatus === "unknown") {
      // Check virtual camera status on mount
      checkVirtualCameraStatus();
    }
  }, [checkVirtualCameraStatus, virtualCameraStatus]);

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          {/* Virtual Camera Controls */}
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

          {/* Projector Controls */}
          <Box display="flex" alignItems="center" gap={1}>
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
                    activeProjectorMonitor === "secondary" ? null : "secondary"
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
      </CardContent>
    </Card>
  );
};

export default StreamControls;
