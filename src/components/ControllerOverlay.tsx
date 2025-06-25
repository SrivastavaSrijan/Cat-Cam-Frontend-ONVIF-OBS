import type React from "react";
import { createPortal } from "react-dom";
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
import { OVERLAY_STYLES } from "../config";

interface CameraOverlayProps {
  open: boolean;
  onClose: () => void;
  orientation?: "portrait" | "landscape" | "auto";
  isOverlayMode?: boolean;
  usePortal?: boolean; // New prop to control portal usage
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
        color: "primary.light",
        fontWeight: 200,
        sx: OVERLAY_STYLES.text.primary,
      };
    }
    return {
      variant: "h6",
      color: "text.secondary",
      sx: OVERLAY_STYLES.text.muted,
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
        color: children ? "primary.light" : "text.secondary",
        sx: OVERLAY_STYLES.text.primary,
      };
    }
    return {
      variant: "h6",
      color: "text.secondary",
      sx: OVERLAY_STYLES.text.muted,
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
  usePortal = true,
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
    <Stack
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      flex={isLandscape ? 1 : 1}
      gap={isLandscape ? 2 : 3}
      width="100%"
      height={isLandscape ? "100%" : "auto"}
      textAlign="center"
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
    </Stack>
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
        <Stack
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          maxWidth="90vw"
          gap={2}
          direction="row"
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
        </Stack>
      </Box>
    );
  };

  const overlayContent = (
    <Box
      {...swipeHandlers}
      id="overlay-container"
      onClick={handleDoubleTap}
      sx={{
        position: usePortal ? "fixed" : "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        backgroundColor: isOverlayMode
          ? OVERLAY_STYLES.background.overlay
          : OVERLAY_STYLES.background.standalone,
        zIndex: usePortal ? 99999 : 10,
        "& > *": { userSelect: "none" },
        padding: 2,
        // Force a new stacking context and ensure visibility
        transform: "translateZ(0)",
        willChange: "transform",
        isolation: "isolate",
        // Add backdrop effects when using portal and overlay mode
        ...(usePortal &&
          isOverlayMode && {
            backdropFilter: "blur(3px)",
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.8) 100%)",
          }),
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
        justifyContent="flex-end"
        spacing={1}
        position="absolute"
        alignItems="center"
        top={24}
        zIndex={10}
        width="calc(100% - 32px)"
        mx="auto"
      >
        <Stack direction="row" spacing={1}>
          <IconButton onClick={handleHelpClick} size="large">
            <Info />
          </IconButton>
          <IconButton onClick={onClose} size="large">
            <Close />
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

  const fullscreenElement =
    document.fullscreenElement ||
    // @ts-ignore
    document.webkitFullscreenElement ||
    // @ts-ignore
    document.mozFullScreenElement ||
    // @ts-ignore
    document.msFullscreenElement;

  const portalTarget = fullscreenElement || document.body;

  return createPortal(overlayContent, portalTarget);
};

export default ControllerOverlay;
