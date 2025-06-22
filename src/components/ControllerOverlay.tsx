import type React from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Popover,
  Card,
  CardContent,
  Fade,
  type TypographyProps,
} from "@mui/material";
import {
  Close,
  SwipeVertical,
  TouchApp,
  PanTool,
  Info,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { useCameraOverlay, useEventListener, useOrientation } from "../hooks";
import SkeletonLoader from "./SkeletonLoader";

// Styling constants for consistency
const OVERLAY_STYLES = {
  text: {
    primary: {
      textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
      filter: "drop-shadow(0 0 12px rgba(255,255,255,0.4))",
    },
    secondary: {
      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
    },
    muted: {
      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))",
      opacity: 0.4,
      fontWeight: 300,
    },
  },
  background: {
    overlay: "transparent",
    standalone: "rgba(0, 0, 0, 0.95)",
  },
} as const;

interface CameraOverlayProps {
  open: boolean;
  onClose: () => void;
  orientation?: "portrait" | "landscape" | "auto";
  isOverlayMode?: boolean;
}

// Reusable text components with skeleton support
const CameraText: React.FC<{
  children: React.ReactNode;
  variant?: "current" | "adjacent";
  size?: "small" | "medium" | "large";
  loading?: boolean;
}> = ({ children, variant = "current", size = "medium", loading = false }) => {
  const getTypographyProps = (): TypographyProps => {
    if (variant === "current") {
      return {
        variant: size === "large" ? "h2" : size === "medium" ? "h3" : "h4",
        color: "text.primary",
        fontWeight: 200,
        sx: {
          letterSpacing: 2,
          fontSize: {
            xs:
              size === "large"
                ? "2.5rem"
                : size === "medium"
                ? "2rem"
                : "1.5rem",
            sm:
              size === "large"
                ? "3.5rem"
                : size === "medium"
                ? "2.5rem"
                : "2rem",
          },
          ...OVERLAY_STYLES.text.primary,
          borderRadius: 2,
          padding: "8px 16px",
          textAlign: "center",
        },
      };
    }
    return {
      variant: "h6",
      color: "text.secondary",
      sx: {
        ...OVERLAY_STYLES.text.secondary,
        mb: variant === "adjacent" ? 2 : 0,
        mt: variant === "adjacent" ? 2 : 0,
      },
    };
  };

  if (loading || !children) {
    return (
      <SkeletonLoader
        variant={
          variant === "current" ? "camera-text-current" : "camera-text-adjacent"
        }
        size={size}
      />
    );
  }

  return <Typography {...getTypographyProps()}>{children}</Typography>;
};

const PresetText: React.FC<{
  children: React.ReactNode;
  variant?: "current" | "adjacent";
  size?: "small" | "medium";
  loading?: boolean;
}> = ({ children, variant = "current", size = "medium", loading = false }) => {
  const getTypographyProps = (): TypographyProps => {
    if (variant === "current") {
      return {
        variant: "h4",
        color: children ? "primary" : "text.secondary",
        sx: {
          fontWeight: 300,
          letterSpacing: 1,
          fontSize: {
            xs: size === "medium" ? "1.5rem" : "1.2rem",
            sm: size === "medium" ? "2rem" : "1.5rem",
          },
          ...OVERLAY_STYLES.text.secondary,
          borderRadius: 1,
          padding: "4px 12px",
        },
      };
    }
    return {
      variant: "h6",
      color: "text.secondary",
      sx: {
        ...OVERLAY_STYLES.text.muted,
        fontSize: "0.9rem",
      },
    };
  };

  if (loading || (!children && variant === "current")) {
    return (
      <SkeletonLoader
        variant={
          variant === "current" ? "preset-text-current" : "preset-text-adjacent"
        }
        size={size}
      />
    );
  }

  return (
    <Typography {...getTypographyProps()}>
      {children || <span>&mdash;</span>}
    </Typography>
  );
};

const ControllerOverlay: React.FC<CameraOverlayProps> = ({
  open,
  onClose,
  orientation = "auto",
  isOverlayMode = true,
}) => {
  const {
    cameraMode,
    swipeIndicator,
    helpAnchorEl,
    selectedCamera,
    cameraList,
    loading,
    isContinuousMoving,
    swipeHandlers,
    handleDoubleTap,
    handleHelpClick,
    handleHelpClose,
    getPresetSlots,
    getCameraSlots,
    getPresetDisplayName,
    getCameraDisplayName,
  } = useCameraOverlay(open);

  const presetSlots = getPresetSlots();
  const cameraSlots = getCameraSlots();
  const currentOrientation = useOrientation(orientation);
  const isLandscape = currentOrientation === "landscape";

  useEventListener("keydown", (event) => {
    // Close overlay on Escape key
    if (event.key === "Escape") {
      onClose();
    }
  });

  // Don't render anything if not open
  if (!open) return null;

  const renderCameraSection = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flex={isLandscape ? 1 : 1}
      width="100%"
      height={isLandscape ? "100%" : "auto"}
    >
      {cameraMode === "normal" && (cameraList.length > 1 || loading) && (
        <CameraText variant="adjacent" loading={loading}>
          {loading
            ? ""
            : cameraSlots.prev
            ? getCameraDisplayName(cameraSlots.prev)
            : ""}
        </CameraText>
      )}

      <CameraText
        variant="current"
        size={isLandscape ? "medium" : "large"}
        loading={loading}
      >
        {loading ? "" : getCameraDisplayName(selectedCamera || "")}
      </CameraText>

      {cameraMode === "normal" && (cameraList.length > 1 || loading) && (
        <CameraText variant="adjacent" loading={loading}>
          {loading
            ? ""
            : cameraSlots.next
            ? getCameraDisplayName(cameraSlots.next)
            : ""}
        </CameraText>
      )}
    </Box>
  );

  const renderPresetSection = () => {
    if (
      cameraMode !== "normal" ||
      (!presetSlots.prev &&
        !presetSlots.current &&
        !presetSlots.next &&
        !loading)
    ) {
      return null;
    }

    // Horizontal layout for portrait
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        width="100%"
        px={2}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          maxWidth="90vw"
        >
          <Box flex={1} textAlign="center">
            <PresetText variant="adjacent" loading={loading}>
              {loading
                ? ""
                : presetSlots.prev
                ? getPresetDisplayName(presetSlots.prev)
                : ""}
            </PresetText>
          </Box>

          <Box flex={2} textAlign="center">
            <PresetText variant="current" loading={loading}>
              {loading
                ? ""
                : presetSlots.current
                ? getPresetDisplayName(presetSlots.current)
                : ""}
            </PresetText>
          </Box>

          <Box flex={1} textAlign="center">
            <PresetText variant="adjacent" loading={loading}>
              {loading
                ? ""
                : presetSlots.next
                ? getPresetDisplayName(presetSlots.next)
                : ""}
            </PresetText>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box
      {...swipeHandlers}
      onClick={handleDoubleTap}
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        backgroundColor: isOverlayMode
          ? OVERLAY_STYLES.background.overlay
          : OVERLAY_STYLES.background.standalone,
        zIndex: 10,
        "& > *": { userSelect: "none" },
        padding: 2,
      }}
    >
      {/* Swipe Indicators */}
      <Fade in={Boolean(swipeIndicator.direction)} timeout={100}>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isContinuousMoving ? "6rem" : "4rem",
            zIndex: 11,
          }}
        >
          {swipeIndicator.direction === "up" && (
            <KeyboardArrowUp
              color={cameraMode === "normal" ? "primary" : "warning"}
              fontSize="inherit"
            />
          )}
          {swipeIndicator.direction === "down" && (
            <KeyboardArrowDown
              color={cameraMode === "normal" ? "primary" : "warning"}
              fontSize="inherit"
            />
          )}
          {swipeIndicator.direction === "left" && (
            <KeyboardArrowLeft
              color={cameraMode === "normal" ? "primary" : "warning"}
              fontSize="inherit"
            />
          )}
          {swipeIndicator.direction === "right" && (
            <KeyboardArrowRight
              color={cameraMode === "normal" ? "primary" : "warning"}
              fontSize="inherit"
            />
          )}
        </Box>
      </Fade>

      {/* Header Controls */}
      <Stack
        direction="row"
        justifyContent="space-between"
        spacing={1}
        position="absolute"
        alignItems="center"
        top={10}
        zIndex={10}
        width="calc(100% - 32px)"
        mx="auto"
      >
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleHelpClick} size="small">
            <Info fontSize="inherit" />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="inherit" />
          </IconButton>
        </Stack>
      </Stack>

      {/* Help Popover */}
      <Popover
        open={Boolean(helpAnchorEl)}
        anchorEl={helpAnchorEl}
        onClose={handleHelpClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Card elevation={3}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Controls
            </Typography>
            <Stack spacing={2}>
              <Typography variant="subtitle2" color="primary">
                Normal Mode:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <SwipeVertical color="primary" />
                <Typography variant="body2">
                  Swipe up/down to change cameras
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TouchApp color="primary" />
                <Typography variant="body2">
                  Swipe left/right to change presets
                </Typography>
              </Stack>
              <Typography variant="subtitle2" color="warning.main">
                Move Mode:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PanTool color="warning" />
                <Typography variant="body2">
                  Quick swipe: Move camera once
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PanTool color="warning" />
                <Typography variant="body2">
                  Long swipe: Continuous camera movement
                </Typography>
              </Stack>
              <Typography variant="subtitle2" color="text.secondary">
                General:
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <TouchApp color="disabled" />
                <Typography variant="body2">
                  Double tap anywhere to toggle modes
                </Typography>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Popover>

      {/* Main Content */}
      <Box
        width="100%"
        height="100%"
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        pt={8}
        pb={2}
      >
        <Stack
          width="100%"
          height="100%"
          justifyContent="space-between"
          alignItems="center"
          spacing={4}
        >
          {renderCameraSection()}
          {renderPresetSection()}
        </Stack>
      </Box>
    </Box>
  );
};

export default ControllerOverlay;
