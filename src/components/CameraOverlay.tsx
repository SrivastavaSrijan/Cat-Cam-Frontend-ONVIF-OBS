import type React from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Stack,
  Backdrop,
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

interface CameraOverlayProps {
  open: boolean;
  onClose: () => void;
}

const CameraOverlay: React.FC<CameraOverlayProps> = ({ open, onClose }) => {
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

  return (
    <Dialog open={open} onClose={onClose} fullScreen>
      <DialogContent
        {...swipeHandlers}
        onClick={handleDoubleTap}
        sx={{ "& > *": { userSelect: "none" } }}
      >
        {/* Swipe Indicators with backdrop */}
        <Fade in={Boolean(swipeIndicator.direction)} timeout={100}>
          <Backdrop
            open
            sx={{ fontSize: isContinuousMoving ? "6rem" : "4rem" }}
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
          </Backdrop>
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
          width="calc(100% - 48px)"
          mx="auto"
        >
          {/* Mode Indicator */}
          <Box onClick={handleDoubleTap}>
            <ToggleButtonGroup
              value={cameraMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode !== null) {
                  setCameraMode(newMode);
                }
              }}
              size="large"
            >
              <ToggleButton value="normal">
                <CameraAlt fontSize="inherit" />
              </ToggleButton>
              <ToggleButton value="move">
                <PanTool fontSize="inherit" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Stack direction="row" spacing={1}>
            <IconButton onClick={handleHelpClick}>
              <Info />
            </IconButton>
            <IconButton onClick={onClose}>
              <Close />
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
          height="calc(100vh - 48px)" // Adjust for header and footer
          position="relative"
          justifyContent="center"
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
      </DialogContent>
    </Dialog>
  );
};

export default CameraOverlay;
