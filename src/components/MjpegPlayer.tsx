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
} from "@mui/icons-material";
import StreamControls from "./StreamControls";
import { useMjpegStream } from "../hooks";

interface MjpegPlayerProps {
  title?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}
// Base64 placeholder image (simple camera icon)
const placeholderImage =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik02MCA2MEgxNDBWOTBINjBWNjBaIiBzdHJva2U9IiM3NzciIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI3NSIgcj0iMTIiIHN0cm9rZT0iIzc3NyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9Ijc1IiByPSI2IiBmaWxsPSIjNzc3Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzc3IiBmb250LXNpemU9IjEyIj5ObyBTdHJlYW08L3RleHQ+Cjwvc3ZnPgo=";

const MjpegPlayer: React.FC<MjpegPlayerProps> = ({
  title = "MJPEG Stream",
  width = "100%",
  height = 500,
  autoPlay = true,
  controls = true,
  className = "",
}) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [streamSrc, setStreamSrc] = useState<string>("");

  // Use MJPEG stream hook
  const { isStreaming, streamUrl } = useMjpegStream();

  const startStream = useCallback(() => {
    if (!streamUrl) {
      setError("No stream URL available");
      setIsLoading(false);
      return;
    }

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Add cache-busting parameters and headers to prevent any caching
    const cacheBustingUrl = `${streamUrl}${
      streamUrl.includes("?") ? "&" : "?"
    }t=${Date.now()}&nocache=${Math.random()}`;

    setStreamSrc(cacheBustingUrl);
    setIsPlaying(true);
    setError(null);
    setIsLoading(true);

    // Set a timeout to handle stuck loading
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError(`Stream loading timeout. URL: ${streamUrl}`);
    }, 8000);
  }, [streamUrl]);

  // Handle stream status changes
  useEffect(() => {
    if (isStreaming && streamUrl && isPlaying) {
      // Stream is available and we want to play
      startStream();
    } else if (!isStreaming) {
      // Stream stopped, show placeholder
      setStreamSrc(placeholderImage);
      setError("Stream is not running");
      setIsLoading(false);
    }
  }, [isStreaming, streamUrl, isPlaying, startStream]);

  // Auto-start when stream becomes available
  useEffect(() => {
    if (autoPlay && isStreaming && streamUrl) {
      setIsPlaying(true);
      startStream();
    }
  }, [autoPlay, isStreaming, streamUrl, startStream]);

  const stopStream = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setStreamSrc(placeholderImage);
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopStream();
    } else if (isStreaming && streamUrl) {
      startStream();
    } else {
      setError("Stream is not available");
    }
  };

  const refreshStream = () => {
    if (isStreaming && streamUrl) {
      // Force stop current stream
      stopStream();
      // Clear the image source completely to force reload
      if (imgRef.current) {
        imgRef.current.src = placeholderImage;
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
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          // Force landscape orientation on mobile
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          if ((window.screen.orientation as any)?.lock) {
            try {
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              await (window.screen.orientation as any).lock("landscape");
            } catch (orientationError) {
              console.log(
                "Orientation lock not supported or failed:",
                orientationError
              );
            }
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          // Unlock orientation when exiting fullscreen
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          if ((window.screen.orientation as any)?.unlock) {
            try {
              window.screen.orientation.unlock();
            } catch (orientationError) {
              console.log("Orientation unlock failed:", orientationError);
            }
          }
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

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
      <StreamControls onRefresh={refreshStream} />

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
            ref={imgRef}
            src={streamSrc || placeholderImage}
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
              if (streamSrc !== placeholderImage && streamSrc) {
                setIsLoading(false);
                setError(null);
              }
            }}
            onError={(e) => {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
              setIsLoading(false);
              if (streamSrc !== placeholderImage && streamSrc) {
                setError(`Failed to load MJPEG stream from: ${streamSrc}`);
                // Fall back to placeholder image
                setStreamSrc(placeholderImage);
              }
              console.error("Stream error:", e);
            }}
          />

          {isLoading && streamSrc && streamSrc !== placeholderImage && (
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
                <Typography variant="body2" color="white">
                  Loading stream...
                </Typography>
                <Typography
                  variant="caption"
                  color="white"
                  sx={{ opacity: 0.7 }}
                >
                  {streamSrc}
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
              <Stack
                spacing={2}
                alignItems="center"
                sx={{ textAlign: "center", px: 2 }}
              >
                <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                  {error}
                </Typography>

                {isStreaming && (
                  <IconButton
                    onClick={refreshStream}
                    color="primary"
                    size="large"
                  >
                    <Refresh />
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
              <IconButton
                onClick={togglePlayPause}
                size="large"
                color="primary"
              >
                <PlayArrow fontSize="large" />
              </IconButton>
            </Box>
          )}

          {controls && (
            <Box
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              bgcolor="rgba(0,0,0,0.7)"
            >
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
                      {isPlaying ? <Pause /> : <PlayArrow />}
                    </IconButton>
                  </Tooltip>

                  <Typography variant="caption" color="white">
                    {title}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1}>
                  <Tooltip
                    title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                  >
                    <IconButton onClick={toggleFullscreen} size="small">
                      {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
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
