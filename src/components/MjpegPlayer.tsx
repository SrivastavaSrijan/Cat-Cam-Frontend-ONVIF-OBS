import type React from "react";
import { useRef, useState, useEffect } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import {
  Fullscreen,
  FullscreenExit,
  Refresh,
  CameraAlt,
} from "@mui/icons-material";
import { useMjpegStream } from "../hooks";
import { useAppContext } from "../contexts/AppContext";

interface MjpegPlayerProps {
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
  }>;
}
// Simple black placeholder
const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4=";

const MjpegPlayer: React.FC<MjpegPlayerProps> = ({
  title = "MJPEG Stream",
  width = "100%",
  height = 500,
  autoPlay = true,
  controls = true,
  onCameraOverlay,
  overlayOpen = false,
  onOverlayClose,
  OverlayComponent,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use MJPEG stream hook
  const { streamURL, streamPlayerRef, isStreaming } = useAppContext();
  const { stopStream, startStream } = useMjpegStream();

  // Auto-start stream once when component mounts if autoPlay is enabled
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  useEffect(() => {
    let mounted = true;

    if (autoPlay && !hasAutoStarted && !isStreaming && mounted) {
      setHasAutoStarted(true);
      console.log("Auto-starting MJPEG stream...");
      startStream().catch((error) => {
        console.error("Auto-start failed:", error);
        if (mounted) {
          setError("Failed to auto-start stream");
        }
      });
    }

    return () => {
      mounted = false;
    };
  }, [autoPlay, hasAutoStarted, isStreaming, startStream]);

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
      if (streamPlayerRef.current) {
        streamPlayerRef.current.src = placeholderImage;
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
  }, []);

  return (
    <Stack spacing={2}>
      {/* Stream Controls */}

      {/* Stream Player */}
      <Paper elevation={2}>
        <Box
          ref={containerRef}
          position="relative"
          width={isFullscreen ? "100vw" : width}
          height={isFullscreen ? "100vh" : height}
          bgcolor="black"
        >
          <img
            ref={streamPlayerRef}
            src={streamURL || placeholderImage}
            alt={title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              backgroundColor: "black",
              display: "block",
            }}
            onError={(e) => {
              console.error("Stream error:", e);
              if (streamURL !== placeholderImage && streamURL) {
                setError(`Failed to load stream from: ${streamURL}`);
              }
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
                backdropFilter: "blur(3px)",
                background:
                  "linear-gradient(45deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)",
              }}
            >
              <OverlayComponent
                open={overlayOpen}
                onClose={onOverlayClose || (() => {})}
                orientation={isFullscreen ? "landscape" : "auto"}
              />
            </Box>
          )}

          {/* Show loading text when no stream URL */}
          {!streamURL && (
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
              <Typography variant="h6" color="white">
                {isStreaming ? "Loading stream..." : "No stream available"}
              </Typography>
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
                <IconButton
                  onClick={refreshStream}
                  size="small"
                  color="primary"
                >
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
                    <IconButton onClick={refreshStream} size="small">
                      <Refresh fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack direction="row" spacing={1}>
                  {onCameraOverlay && (
                    <Tooltip title="Camera Controls">
                      <IconButton onClick={onCameraOverlay} size="small">
                        <CameraAlt fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    <IconButton onClick={toggleFullscreen} size="small">
                      {isFullscreen ? (
                        <FullscreenExit fontSize="inherit" />
                      ) : (
                        <Fullscreen fontSize="inherit" />
                      )}
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* Always show fullscreen and camera controls when stream is working */}
          {controls && streamURL && !error && (
            <Box position="absolute" bottom={0} right={0}>
              <Stack direction="row" spacing={1} p={1}>
                {onCameraOverlay && (
                  <Tooltip title="Camera Controls">
                    <IconButton onClick={onCameraOverlay} size="small">
                      <CameraAlt fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  <IconButton onClick={toggleFullscreen} size="small">
                    {isFullscreen ? (
                      <FullscreenExit fontSize="inherit" />
                    ) : (
                      <Fullscreen fontSize="inherit" />
                    )}
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

export default MjpegPlayer;
