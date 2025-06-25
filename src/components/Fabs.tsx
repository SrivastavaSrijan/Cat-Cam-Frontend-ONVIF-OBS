import {
  Gesture,
  MoreVert,
  Refresh,
  Videocam,
  Analytics,
  VideoSettings,
} from "@mui/icons-material";
import {
  Fab,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { useOBSControl, usePWABackgroundSync } from "../hooks";

import { useCameraControl, useStream } from "../hooks";
import { useState } from "react";

interface FabsProps {
  onCameraOverlayOpen: (value: boolean) => void;
  currentTab: number;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
}

const navigationItems = [
  { value: 1, icon: <Videocam />, label: "Camera" },
  { value: 2, icon: <Analytics />, label: "Analytics" },
  { value: 3, icon: <VideoSettings />, label: "Settings" },
];

const Fabs = ({ onCameraOverlayOpen, currentTab, onTabChange }: FabsProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [refreshDialogOpen, setRefreshDialogOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({
    rtsp: false,
    obs: false,
    stream: false,
    camera: false,
  });

  // Set up PWA background sync
  usePWABackgroundSync();

  // Handle floating action button menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRefreshDialogOpen = () => {
    setRefreshDialogOpen(true);
    handleMenuClose();
  };

  const handleRefreshDialogClose = () => {
    setRefreshDialogOpen(false);
    setSelectedOptions({
      rtsp: false,
      obs: false,
      stream: false,
      camera: false,
    });
  };

  const handleNavigationChange = (newValue: number) => {
    onTabChange({} as React.SyntheticEvent, newValue);
    handleMenuClose();
  };

  const handleGestureControl = () => {
    onCameraOverlayOpen(true);
    handleMenuClose();
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
    handleRefreshDialogClose();
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
    } catch (error) {
      console.error("Error during refresh operations:", error);
    }
  };

  return (
    <>
      {/* Single Floating Action Button */}
      <Fab
        color="primary"
        size="medium"
        onClick={handleMenuOpen}
        disabled={obsLoading || streamLoading || cameraLoading}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
      >
        {obsLoading || streamLoading || cameraLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <MoreVert fontSize="medium" />
        )}
      </Fab>

      {/* Comprehensive Menu */}
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
        PaperProps={{
          sx: { minWidth: 200 },
        }}
      >
        {/* Navigation Section */}
        <Typography
          variant="overline"
          sx={{ px: 2, py: 1, color: "text.secondary" }}
        >
          Navigation
        </Typography>
        {navigationItems.map((item) => (
          <MenuItem
            key={item.value}
            onClick={() => handleNavigationChange(item.value)}
            selected={item.value === currentTab}
            sx={{ pl: 3 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </MenuItem>
        ))}

        <Divider sx={{ my: 1 }} />

        {/* Gesture Control Section */}
        <Typography
          variant="overline"
          sx={{ px: 2, py: 1, color: "text.secondary" }}
        >
          Controls
        </Typography>
        <MenuItem onClick={handleGestureControl} sx={{ pl: 3 }}>
          <ListItemIcon>
            <Gesture />
          </ListItemIcon>
          <ListItemText primary="Gesture Control" />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        {/* Refresh Section */}
        <Typography
          variant="overline"
          sx={{ px: 2, py: 1, color: "text.secondary" }}
        >
          Refresh
        </Typography>
        <MenuItem onClick={handleRefreshDialogOpen} sx={{ pl: 3 }}>
          <ListItemIcon>
            <Refresh />
          </ListItemIcon>
          <ListItemText primary="Refresh Options" />
        </MenuItem>
      </Menu>

      {/* Refresh Dialog */}
      <Dialog
        open={refreshDialogOpen}
        onClose={handleRefreshDialogClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Refresh Options</DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedOptions.rtsp}
                  onChange={() => handleOptionChange("rtsp")}
                />
              }
              label="RTSP"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedOptions.obs}
                  onChange={() => handleOptionChange("obs")}
                />
              }
              label="OBS"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedOptions.stream}
                  onChange={() => handleOptionChange("stream")}
                />
              }
              label="Stream"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedOptions.camera}
                  onChange={() => handleOptionChange("camera")}
                />
              }
              label="Camera"
            />
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRefreshDialogClose}>Cancel</Button>
          <Button
            onClick={handleRefreshSelected}
            variant="contained"
            disabled={
              !selectedOptions.rtsp &&
              !selectedOptions.obs &&
              !selectedOptions.stream &&
              !selectedOptions.camera
            }
          >
            Refresh
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Fabs;
