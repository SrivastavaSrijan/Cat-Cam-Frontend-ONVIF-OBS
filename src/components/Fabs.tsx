import {
  Gesture,
  MoreVert,
  Restore,
  Cable,
  Refresh,
} from "@mui/icons-material";
import {
  Fab,
  CircularProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useOBSControl } from "../hooks";
import { useStream } from "../hooks/useStream";
import { useState } from "react";

interface FabsProps {
  onCameraOverlayOpen: (value: boolean) => void;
}
const Fabs = ({ onCameraOverlayOpen }: FabsProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Handle floating action button menu (short press)
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const { reconnect, loading: obsLoading } = useOBSControl();
  const {
    getStatus,
    startStream,
    stopStream,
    loading: streamLoading,
  } = useStream();

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

  return (
    <>
      {/* Floating Action Buttons */}
      <Fab
        color="primary"
        size="small"
        onClick={() => onCameraOverlayOpen(true)}
        disabled={obsLoading || streamLoading}
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
        disabled={obsLoading || streamLoading}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 72,
          zIndex: 1000,
        }}
      >
        {obsLoading || streamLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          <MoreVert fontSize="medium" />
        )}
      </Fab>

      {/* Action Menu */}
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
          onClick={() => {
            refreshStream();
            handleMenuClose();
          }}
          disabled={obsLoading || streamLoading}
        >
          <ListItemIcon>
            <Refresh />
          </ListItemIcon>
          <ListItemText primary="Refresh Stream" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            reconnect(); // Use reconnect instead of refreshStreams
            handleMenuClose();
          }}
          disabled={obsLoading || streamLoading}
        >
          <ListItemIcon>
            <Restore />
          </ListItemIcon>
          <ListItemText primary="Refresh" />
        </MenuItem>
        <MenuItem
          onClick={() => {
            reconnect();
            handleMenuClose();
          }}
          disabled={obsLoading || streamLoading}
        >
          <ListItemIcon>
            <Cable />
          </ListItemIcon>
          <ListItemText primary="Reconnect" />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Fabs;
