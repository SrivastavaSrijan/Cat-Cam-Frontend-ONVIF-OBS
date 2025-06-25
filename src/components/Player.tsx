import type React from "react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
  Container,
} from "@mui/material";
import {
  Fullscreen,
  FullscreenExit,
  Refresh,
  CameraAlt,
} from "@mui/icons-material";
import { useStream } from "../hooks";
import { useAppContext } from "../contexts/AppContext";
import SkeletonLoader from "./SkeletonLoader";
import CanvasStreamPlayer, {
  type CanvasStreamPlayerRef,
} from "./CanvasStreamPlayer";

interface PlayerProps {
  title?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  controls?: boolean;
  onCameraOverlay?: () => void;
  // Add overlay props
  overlayOpen?: boolean;
  onOverlayClose?: () => void;
  OverlayComponent?: React.ComponentType<{
    open: boolean;
    onClose: () => void;
    orientation?: "portrait" | "landscape" | "auto";
    isOverlayMode?: boolean;
  }>;
  isOverlayMode?: boolean; // Add this prop
  /** Force 16:9 aspect ratio */
  maintainAspectRatio?: boolean;
  aspectRatio?: number; // Added to allow custom aspect ratios
}
// Simple black placeholder
const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4=";

const Player: React.FC<PlayerProps> = ({
  title = "MJPEG Stream",
  width = "100%",
  height = 500,
  autoPlay = true,
  controls = true,
  onCameraOverlay,
  overlayOpen = false,
  onOverlayClose,
  OverlayComponent,
  isOverlayMode = true, // Default to overlay mode
  maintainAspectRatio = true, // Default to maintain aspect ratio
  aspectRatio = 16 / 9, // Default to 16:9 aspect ratio
}) => {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasPlayerRef = useRef<CanvasStreamPlayerRef>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Calculate proper height based on aspect ratio and container width
  const playerHeight = useMemo(() => {
    if (isFullscreen) return "100vh";
    if (!maintainAspectRatio) return height;

    // For fixed width, calculate height based on aspect ratio
    if (typeof width === "number") {
      return width / aspectRatio;
    }

    // For percentage or auto width, use container width if available
    if (containerWidth > 0) {
      return containerWidth / aspectRatio;
    }

    // Fallback if we can't determine container width
    return typeof height === "number" ? height : 500;
  }, [
    width,
    height,
    maintainAspectRatio,
    isFullscreen,
    aspectRatio,
    containerWidth,
  ]);

  // Measure container width to calculate aspect ratio
  useEffect(() => {
    if (!containerRef.current || !maintainAspectRatio) return;

    const updateWidth = () => {
      const width = containerRef.current?.offsetWidth || 0;
      setContainerWidth(width);
    };

    // Initial measurement
    updateWidth();

    // Set up resize observer for responsive behavior
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [maintainAspectRatio]);

  // Use MJPEG stream hook
  const { streamURL, setStreamURL, isStreaming } = useAppContext();
  const { stopStream, startStream, getStatus } = useStream();

  // Auto-start stream once when component mounts if autoPlay is enabled
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  const handleStartStream = useCallback(
    async (isMounted?: boolean) => {
      if (isStreaming) {
        console.warn("Stream is already running");
        return;
      }

      console.log("Starting MJPEG stream...");
      setError(null);
      try {
        await startStream();
        const response = await getStatus();
        if (!response || !response.stream_url) {
          throw new Error("Stream URL not returned from startStream");
        }
        setStreamURL(response.stream_url);
        console.log("MJPEG stream started successfully");
      } catch (err) {
        console.error("Failed to start MJPEG stream:", err);
        setError("Failed to start MJPEG stream");
        if (isMounted) {
          setError("Failed to auto-start stream");
        }
        return;
      }
    },
    [getStatus, isStreaming, setStreamURL, startStream]
  );

  useEffect(() => {
    let mounted = true;

    if (autoPlay && !hasAutoStarted && !isStreaming && mounted) {
      setHasAutoStarted(true);
      console.log("Auto-starting MJPEG stream...");
      handleStartStream(mounted);
    }

    return () => {
      mounted = false;
    };
  }, [autoPlay, handleStartStream, hasAutoStarted, isStreaming]);

  // Simple refresh function
  const refreshStream = async () => {
    try {
      console.log("Refreshing MJPEG stream...");
      setError(null);

      // If there's no stream running, just try to start it
      if (!isStreaming) {
        await startStream();
        return;
      }

      // If stream is running but we have an error, restart it
      if (canvasPlayerRef.current) {
        canvasPlayerRef.current.setSrc(placeholderImage);
      }

      await stopStream();

      setTimeout(async () => {
        try {
          await startStream();
        } catch (error) {
          console.error("Error restarting stream:", error);
          setError("Failed to restart stream");
        }
      }, 500);
    } catch (error) {
      console.error("Error refreshing stream:", error);
      setError("Failed to refresh stream");
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        // Entering fullscreen
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        // Try to lock orientation to landscape on mobile (optional)
        // @ts-ignore - orientation lock API not fully supported in TypeScript
        if (window.screen?.orientation?.lock) {
          try {
            // @ts-ignore - orientation lock API not fully supported in TypeScript
            await window.screen.orientation.lock("landscape");
          } catch (orientationError) {
            console.log(
              "Orientation lock not supported or failed:",
              orientationError
            );
            // Don't treat this as an error - orientation lock is optional
          }
        }
      } else {
        // Exiting fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        // Unlock orientation when exiting fullscreen
        // @ts-ignore - orientation lock API not fully supported in TypeScript
        if (window.screen?.orientation?.unlock) {
          try {
            window.screen.orientation.unlock();
          } catch (orientationError) {
            console.log("Orientation unlock failed:", orientationError);
            // Don't treat this as an error
          }
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
      // Don't force update the state here - let the event listener handle it
    }
  };

  // Listen for fullscreen changes to update state properly
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          // @ts-ignore - for webkit browsers
          document.webkitFullscreenElement ||
          // @ts-ignore - for mozilla browsers
          document.mozFullScreenElement ||
          // @ts-ignore - for IE/Edge
          document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      if (!isCurrentlyFullscreen) {
        if (isOverlayMode) {
          // If exiting fullscreen in overlay mode, close the overlay
          onOverlayClose?.();
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, [isOverlayMode, onOverlayClose]);

  return (
    <Stack spacing={2} ref={containerRef}>
      {/* Stream Player */}
      <Paper elevation={2}>
        <Box
          position="relative"
          width={isFullscreen ? "100vw" : "100%"}
          height={isFullscreen ? "100vh" : playerHeight}
          bgcolor="black"
          overflow="hidden"
        >
          <CanvasStreamPlayer
            ref={canvasPlayerRef}
            src={streamURL || placeholderImage}
            alt={title}
            width="100%"
            height="100%"
            gesturesEnabled={true}
            minZoom={1}
            maxZoom={4}
            showZoomControls={isFullscreen || !isMobile}
            showZoomLevel={isFullscreen || !isMobile}
            showPipButton={isFullscreen || !isMobile}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              console.error("Stream error:", e);
              if (streamURL !== placeholderImage && streamURL) {
                setError(`Failed to load stream from: ${streamURL}`);
              }
            }}
            style={{
              backgroundColor: "black",
            }}
          />

          {/* Render overlay inside fullscreen container */}
          {OverlayComponent && overlayOpen && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={9999}
              sx={{
                backdropFilter: isOverlayMode ? "blur(3px)" : "none",
                background: isOverlayMode
                  ? "linear-gradient(45deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)"
                  : "transparent",
              }}
            >
              <OverlayComponent
                open={overlayOpen}
                onClose={onOverlayClose || (() => {})}
                orientation={isFullscreen ? "landscape" : "auto"}
                isOverlayMode={isOverlayMode}
              />
            </Box>
          )}

          {/* Show loading skeleton when no stream URL and no error */}
          {!streamURL && !error && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0,0,0,0.9)"
            >
              <SkeletonLoader
                variant="stream-player"
                width="100%"
                height="100%"
              />
            </Box>
          )}

          {/* Show error overlay */}
          {error && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0,0,0,0.8)"
            >
              <Stack spacing={2} alignItems="center">
                <Typography variant="body2" color="white" textAlign="center">
                  {error}
                </Typography>
                <IconButton onClick={refreshStream} size="large">
                  <Refresh />
                </IconButton>
              </Stack>
            </Box>
          )}

          {controls && (error || !streamURL) && (
            <Box position="absolute" bottom={0} left={0} right={0}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                p={1}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title="Refresh Stream">
                    <IconButton onClick={refreshStream} size="large">
                      <Refresh />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack direction="row" spacing={1}>
                  {onCameraOverlay && streamURL && isFullscreen && (
                    <Tooltip title="Camera Controls">
                      <IconButton onClick={onCameraOverlay} size="large">
                        <CameraAlt />
                      </IconButton>
                    </Tooltip>
                  )}
                  {streamURL && (
                    <Tooltip
                      title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      <IconButton onClick={toggleFullscreen} size="large">
                        {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Always show fullscreen and camera controls when stream is working */}
          {controls && streamURL && !error && (
            <Box position="absolute" bottom={0} right={0}>
              <Stack direction="row" spacing={1} p={1}>
                {onCameraOverlay && isFullscreen && (
                  <Tooltip title="Camera Controls">
                    <IconButton onClick={onCameraOverlay} size="large">
                      <CameraAlt />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  <IconButton onClick={toggleFullscreen} size="large">
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
          )}
        </Box>
      </Paper>
    </Stack>
  );
};

export default Player;
