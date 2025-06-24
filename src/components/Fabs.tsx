import { Gesture, MoreVert, Refresh } from "@mui/icons-material";
import {
  Fab,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from "@mui/material";
import { useOBSControl } from "../hooks";
import { useStream } from "../hooks/useStream";
import { useCameraControl } from "../hooks";
import { useState } from "react";

interface FabsProps {
  onCameraOverlayOpen: (value: boolean) => void;
}
const Fabs = ({ onCameraOverlayOpen }: FabsProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedOptions, setSelectedOptions] = useState({
    rtsp: false,
    obs: false,
    stream: false,
    camera: false,
  });

  // Handle floating action button menu (short press)
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOptionChange = (option: keyof typeof selectedOptions) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const { refreshMainSource, reconnect, loading: obsLoading } = useOBSControl();
  const { startStream, stopStream, loading: streamLoading } = useStream();
  const { reinitializeCameras, loading: cameraLoading } = useCameraControl();

  const refreshStream = async () => {
    try {
      await stopStream();
      // Wait a bit before restarting
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await startStream();
    } catch (error) {
      console.error("Failed to refresh stream:", error);
    }
  };

  const handleRefreshSelected = async () => {
    handleMenuClose();

    try {
      // If OBS reconnect is selected, do that first
      if (selectedOptions.obs) {
        await reconnect();
      }
      // Execute selected operations in parallel
      const operations = [
        selectedOptions.rtsp && refreshMainSource(),
        selectedOptions.stream && refreshStream(),
        selectedOptions.camera && reinitializeCameras(),
      ].filter(Boolean);

      if (operations.length > 0) {
        await Promise.all(operations);
      }

      // Reset selections after handling
      setSelectedOptions({
        rtsp: false,
        obs: false,
        stream: false,
        camera: false,
      });
    } catch (error) {
      console.error("Error during refresh operations:", error);
    }
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <Fab
        color="primary"
        size="small"
        onClick={() => onCameraOverlayOpen(true)}
        disabled={obsLoading || streamLoading || cameraLoading}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        <Gesture fontSize="medium" />
      </Fab>

      <Fab
        color="primary"
        size="small"
        onClick={handleMenuOpen}
        disabled={obsLoading || streamLoading || cameraLoading}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 72,
          zIndex: 1000,
        }}
      >
        {obsLoading || streamLoading || cameraLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <MoreVert fontSize="medium" />
        )}
      </Fab>

      {/* Action Menu with Checkboxes */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <MenuItem
          onClick={() => handleOptionChange("rtsp")}
          disabled={obsLoading || streamLoading || cameraLoading}
        >
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={selectedOptions.rtsp}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText primary="RTSP" />
        </MenuItem>

        <MenuItem
          onClick={() => handleOptionChange("obs")}
          disabled={obsLoading || streamLoading || cameraLoading}
        >
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={selectedOptions.obs}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText primary="OBS" />
        </MenuItem>

        <MenuItem
          onClick={() => handleOptionChange("stream")}
          disabled={obsLoading || streamLoading || cameraLoading}
        >
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={selectedOptions.stream}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText primary="Stream" />
        </MenuItem>

        <MenuItem
          onClick={() => handleOptionChange("camera")}
          disabled={obsLoading || streamLoading || cameraLoading}
        >
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={selectedOptions.camera}
              tabIndex={-1}
              disableRipple
            />
          </ListItemIcon>
          <ListItemText primary="Camera" />
        </MenuItem>

        <MenuItem
          onClick={handleRefreshSelected}
          disabled={
            obsLoading ||
            streamLoading ||
            cameraLoading ||
            (!selectedOptions.rtsp &&
              !selectedOptions.obs &&
              !selectedOptions.stream &&
              !selectedOptions.camera)
          }
        >
          <ListItemIcon>
            <Refresh />
          </ListItemIcon>
          <ListItemText primary="Refresh" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Fabs;
