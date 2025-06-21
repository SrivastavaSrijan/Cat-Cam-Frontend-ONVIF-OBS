import type React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import {
  PlayArrow,
  Pause,
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
}
// Base64 placeholder image (simple camera icon)
const placeholderImage =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII";

const MjpegPlayer: React.FC<MjpegPlayerProps> = ({
  title = "MJPEG Stream",
  width = "100%",
  height = 500,
  autoPlay = true,
  controls = true,
  onCameraOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use MJPEG stream hook
  const { streamURL, streamPlayerRef, isStreaming } = useAppContext();
  const { stopStream, startStream } = useMjpegStream();

  const handleStartStream = useCallback(() => {
    if (!streamURL) {
      setError("No stream URL available");
      setIsLoading(false);
      return;
    }

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    setIsPlaying(true);
    setError(null);
    setIsLoading(true);

    // Set a timeout to handle stuck loading
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError(`Stream loading timeout. URL: ${streamURL}`);
    }, 8000);
  }, [streamURL]);

  // Handle stream status changes
  useEffect(() => {
    if (isStreaming && streamURL && isPlaying) {
      // Stream is available and we want to play
      handleStartStream();
    } else if (!isStreaming) {
      // Stream stopped, show placeholder
      setError("Stream is not running");
      setIsLoading(false);
    }
  }, [isStreaming, streamURL, isPlaying, handleStartStream]);

  // Auto-start when stream becomes available
  useEffect(() => {
    if (autoPlay && isStreaming && streamURL) {
      setIsPlaying(true);
      handleStartStream();
    }
  }, [autoPlay, isStreaming, streamURL, handleStartStream]);

  const togglePlayPause = () => {
    if (isPlaying) {
      stopStream();
    } else if (isStreaming && streamURL) {
      startStream();
    } else {
      setError("Stream is not available");
    }
  };

  const refreshStream = () => {
    if (isStreaming && streamURL) {
      // Force stop current stream
      stopStream();
      // Clear the image source completely to force reload
      if (streamPlayerRef.current) {
        streamPlayerRef.current.src = placeholderImage;
      }
      // Wait a bit longer and then restart with fresh cache-busting URL
      setTimeout(() => {
        startStream();
      }, 500);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
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
            // Add attributes to prevent caching
            crossOrigin="anonymous"
            decoding="async"
            loading="eager"
            onLoad={() => {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
              // Only clear loading if it's not the placeholder image
              if (streamURL !== placeholderImage && streamURL) {
                setIsLoading(false);
                setError(null);
              }
            }}
            onError={(e) => {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
              setIsLoading(false);
              if (streamURL !== placeholderImage && streamURL) {
                setError(`Failed to load MJPEG stream from: ${streamURL}`);
                // Don't automatically fall back to placeholder - let the user retry
              }
              console.error("Stream error:", e);
            }}
          />

          {isLoading && streamURL && streamURL !== placeholderImage && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0,0,0,0.5)"
            >
              <Stack spacing={1} alignItems="center">
                <Typography variant="caption" color="white">
                  Loading stream...
                </Typography>
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ opacity: 0.7 }}
                >
                  {streamURL}
                </Typography>
              </Stack>
            </Box>
          )}

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
              bgcolor="rgba(0,0,0,0.6)"
            >
              <Stack spacing={1} alignItems="center">
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ opacity: 0.8 }}
                  textOverflow="ellipsis"
                  overflow={"hidden"}
                  width="20ch"
                >
                  {error}
                </Typography>

                {isStreaming && (
                  <IconButton onClick={refreshStream} size="small">
                    <Refresh fontSize="inherit" />
                  </IconButton>
                )}
              </Stack>
            </Box>
          )}

          {!isPlaying && !isLoading && !error && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0,0,0,0.7)"
            >
              <IconButton onClick={togglePlayPause} size="small">
                <PlayArrow fontSize="inherit" />
              </IconButton>
            </Box>
          )}

          {controls && (
            <Box position="absolute" bottom={0} left={0} right={0}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                p={1}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Tooltip title={isPlaying ? "Stop Stream" : "Start Stream"}>
                    <IconButton onClick={togglePlayPause} size="small">
                      {isPlaying ? (
                        <Pause fontSize="inherit" />
                      ) : (
                        <PlayArrow fontSize="inherit" />
                      )}
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
        </Box>
      </Paper>
    </Stack>
  );
};

export default MjpegPlayer;
