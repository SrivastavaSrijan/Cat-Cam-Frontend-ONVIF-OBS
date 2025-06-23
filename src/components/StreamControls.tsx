import type React from "react";
import { useEffect, useState, useCallback } from "react";
import { Stack, ToggleButtonGroup, ToggleButton, Box } from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Monitor,
  Laptop,
  Close,
} from "@mui/icons-material";
import { useOBSControl, useLoading } from "../hooks";
import SkeletonLoader from "./SkeletonLoader";

interface StreamControlsProps {
  onRefresh?: () => void;
}

const StreamControls: React.FC<StreamControlsProps> = ({ onRefresh }) => {
  // Virtual Camera State
  const [virtualCameraStatus, setVirtualCameraStatus] =
    useState<string>("unknown");
  const [isVirtualCameraLoading, setIsVirtualCameraLoading] = useState(false);
  const [projectorLoading, setProjectorLoading] = useState(false);
  const [projectorActive, setProjectorActive] = useState(false);
  const [activeProjectorMonitor, setActiveProjectorMonitor] = useState<
    number | null
  >(null);

  // Dialog State

  const obsControl = useOBSControl();
  const { withLoading } = useLoading();

  // Virtual Camera Functions
  const checkVirtualCameraStatus = useCallback(async () => {
    setIsVirtualCameraLoading(true);
    try {
      const response = await withLoading(() =>
        obsControl.getVirtualCameraStatus()
      );
      if (response.active) {
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
  }, [obsControl, withLoading]);

  const toggleVirtualCamera = async (action: "start" | "stop") => {
    if (isVirtualCameraLoading) return;

    setIsVirtualCameraLoading(true);
    try {
      if (action === "start") {
        await withLoading(() => obsControl.startVirtualCamera());
        setVirtualCameraStatus("active");
        setTimeout(() => onRefresh?.(), 1000);
      } else {
        await withLoading(() => obsControl.stopVirtualCamera());
        setVirtualCameraStatus("inactive");
      }
    } catch (error) {
      console.error(`Failed to ${action} virtual camera:`, error);
    } finally {
      setIsVirtualCameraLoading(false);
    }
  };

  const handleProjectorToggle = async (monitor: number | null) => {
    if (projectorLoading) return;

    setProjectorLoading(true);
    try {
      if (monitor !== null) {
        // Start projector
        await withLoading(() => obsControl.startProjector("Mosaic", monitor));
        setProjectorActive(true);
        setActiveProjectorMonitor(monitor);
      } else {
        // Close projector
        await withLoading(() => obsControl.closeProjector());
        setProjectorActive(false);
        setActiveProjectorMonitor(null);
      }
    } catch (error) {
      console.error("Projector operation failed:", error);
    } finally {
      setProjectorLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    if (virtualCameraStatus === "unknown") {
      checkVirtualCameraStatus();
    }
  }, [checkVirtualCameraStatus, virtualCameraStatus]);

  return isVirtualCameraLoading ? (
    <SkeletonLoader variant="stream-controls" />
  ) : (
    <>
      {/* Virtual Camera Controls */}
      <Stack direction="row" spacing={1} alignItems="center">
        <ToggleButtonGroup exclusive size="small">
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
            {virtualCameraStatus === "active" ? <Videocam /> : <VideocamOff />}
          </ToggleButton>
        </ToggleButtonGroup>
        {/* MJPEG Stream Controls */}
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
        <ToggleButtonGroup
          exclusive
          size="small"
          onChange={(_, value) => {
            handleProjectorToggle(value);
          }}
        >
          <ToggleButton
            value={0}
            selected={activeProjectorMonitor === 0}
            disabled={projectorLoading}
          >
            <Monitor />
          </ToggleButton>
          <ToggleButton
            value={1}
            selected={activeProjectorMonitor === 1}
            disabled={projectorLoading}
          >
            <Laptop />
          </ToggleButton>
          {projectorActive && (
            <ToggleButton
              value="close"
              onClick={() => handleProjectorToggle(null)}
              disabled={projectorLoading}
            >
              <Close />
            </ToggleButton>
          )}
        </ToggleButtonGroup>
      </Box>
    </>
  );
};

export default StreamControls;
