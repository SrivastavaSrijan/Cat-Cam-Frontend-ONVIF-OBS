import type React from "react";
import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Stack,
  Popover,
  Card,
  CardContent,
  Fade,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  Close,
  SwipeVertical,
  TouchApp,
  CameraAlt,
  PanTool,
  Info,
  KeyboardArrowLeft,
  KeyboardArrowRight,
  KeyboardArrowUp,
  KeyboardArrowDown,
} from "@mui/icons-material";
import { useCameraOverlay } from "../hooks";

// Add orientation detection hook
const useOrientation = (
  forcedOrientation?: "portrait" | "landscape" | "auto"
) => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  useEffect(() => {
    if (forcedOrientation && forcedOrientation !== "auto") {
      setOrientation(forcedOrientation);
      return;
    }

    const handleOrientationChange = () => {
      // Check both window dimensions and screen.orientation API
      const isLandscape = window.innerWidth > window.innerHeight;

      // @ts-ignore - orientation API not fully supported in TypeScript
      const screenOrientation = window.screen?.orientation?.type;
      const isScreenLandscape = screenOrientation?.includes("landscape");

      // Use screen orientation API if available, otherwise fall back to dimensions
      const finalOrientation =
        isScreenLandscape !== undefined
          ? isScreenLandscape
            ? "landscape"
            : "portrait"
          : isLandscape
          ? "landscape"
          : "portrait";

      setOrientation(finalOrientation);
    };

    // Initial check
    handleOrientationChange();

    // Listen for orientation changes
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, [forcedOrientation]);

  return orientation;
};

interface CameraOverlayProps {
  open: boolean;
  onClose: () => void;
  orientation?: "portrait" | "landscape" | "auto";
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({
  open,
  onClose,
  orientation = "auto",
}) => {
  const {
    cameraMode,
    setCameraMode,
    swipeIndicator,
    helpAnchorEl,
    selectedCamera,
    cameraList,
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

  // Use the orientation hook
  const currentOrientation = useOrientation(orientation);

  // Adjust layout based on orientation
  const isLandscape = currentOrientation === "landscape";

  // Don't render anything if not open
  if (!open) return null;

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
        backgroundColor: "transparent", // Remove background since parent has it
        zIndex: 10,
        "& > *": { userSelect: "none" },
        padding: 2,
      }}
    >
      {/* Swipe Indicators with backdrop */}
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

      {/* Header with mode indicator, close and help buttons */}
      <Stack
        direction="row"
        justifyContent="space-between"
        spacing={1}
        position="absolute"
        alignItems={"center"}
        top={10}
        zIndex={10}
        width="calc(100% - 32px)"
        mx="auto"
        overflow={"hidden"}
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
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
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

      {/* Main content */}
      <Stack
        width={"100%"}
        height="100%"
        position="relative"
        justifyContent="center"
        direction={isLandscape ? "row" : "column"}
        alignItems="center"
        spacing={isLandscape ? 4 : 2}
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="space-between"
          textAlign="center"
          zIndex={5}
          width="100%"
          maxWidth="90vw"
          height="75%"
        >
          {/* Camera Carousel - Vertical (Normal Mode Only) */}
          {cameraMode === "normal" && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              gap={2}
              width="100%"
            >
              {/* Previous Camera - Top */}
              {cameraList.length > 1 && cameraSlots.prev && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  component="div"
                  sx={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
                  }}
                >
                  {getCameraDisplayName(cameraSlots.prev)}
                </Typography>
              )}

              {/* Current Camera */}
              <Typography
                variant="h2"
                color="text.primary"
                fontWeight={200}
                sx={{
                  letterSpacing: 2,
                  fontSize: { xs: "2.5rem", sm: "3.5rem" },
                  textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
                  filter: "drop-shadow(0 0 12px rgba(255,255,255,0.4))",
                  borderRadius: 2,
                  padding: "8px 16px",
                }}
              >
                {getCameraDisplayName(selectedCamera || "")}
              </Typography>

              {/* Next Camera - Bottom */}
              {cameraList.length > 1 && cameraSlots.next && (
                <Typography
                  variant="h6"
                  color="text.secondary"
                  component="div"
                  sx={{
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",
                  }}
                >
                  {getCameraDisplayName(cameraSlots.next)}
                </Typography>
              )}
            </Box>
          )}

          {/* Camera Name (Move Mode Only) */}
          {cameraMode === "move" && (
            <Stack spacing={4} alignItems="center">
              <Typography
                variant="h2"
                color="text.primary"
                fontWeight={200}
                sx={{
                  letterSpacing: 2,
                  fontSize: { xs: "2.5rem", sm: "3.5rem" },
                  textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
                  filter: "drop-shadow(0 0 12px rgba(255,255,255,0.4))",
                  background:
                    "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                  borderRadius: 2,
                  padding: "8px 16px",
                  backdropFilter: "blur(8px)",
                }}
              >
                {getCameraDisplayName(selectedCamera || "")}
              </Typography>
            </Stack>
          )}

          {/* Preset Carousel - Horizontal (Normal Mode Only) */}
          {cameraMode === "normal" &&
            (presetSlots.prev || presetSlots.current || presetSlots.next) && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={3}
                width="100%"
                maxWidth="80vw"
              >
                {/* Previous Preset - Left */}
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    opacity: 0.4,
                    fontWeight: 300,
                    fontSize: "0.9rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "20vw",
                    transition: "opacity 0.3s ease",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))",
                  }}
                >
                  {presetSlots.prev
                    ? getPresetDisplayName(presetSlots.prev)
                    : ""}
                </Typography>

                {/* Current Preset or Placeholder */}
                <Typography
                  variant="h4"
                  color={presetSlots.current ? "primary" : "text.secondary"}
                  sx={{
                    fontWeight: 300,
                    letterSpacing: 1,
                    fontSize: { xs: "1.5rem", sm: "2rem" },
                    textAlign: "center",
                    minWidth: "30vw",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))",

                    borderRadius: 1,
                    padding: "4px 12px",
                  }}
                >
                  {presetSlots.current ? (
                    getPresetDisplayName(presetSlots.current)
                  ) : (
                    <span>&mdash;</span>
                  )}
                </Typography>

                {/* Next Preset - Right */}
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{
                    opacity: 0.4,
                    fontWeight: 300,
                    fontSize: "0.9rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "20vw",
                    transition: "opacity 0.3s ease",
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    filter: "drop-shadow(0 ght`1b20 6px rgba(255,255,255,0.3))",
                  }}
                >
                  {presetSlots.next
                    ? getPresetDisplayName(presetSlots.next)
                    : ""}
                </Typography>
              </Box>
            )}
        </Box>
      </Stack>
    </Box>
  );
};

export default CameraOverlay;
