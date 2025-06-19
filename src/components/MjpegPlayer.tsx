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
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Refresh,
} from "@mui/icons-material";
import StreamControls from "./StreamControls";
import { useMjpegStream } from "../hooks";
import { MJPEG_ENDPOINTS } from "../config";

interface MjpegPlayerProps {
  streamUrl: string;
  title?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
}

const MjpegPlayer: React.FC<MjpegPlayerProps> = ({
  streamUrl,
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

  // Base64 placeholder image (simple camera icon)
  const placeholderImage =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzMzIi8+CjxwYXRoIGQ9Ik02MCA2MEgxNDBWOTBINjBWNjBaIiBzdHJva2U9IiM3NzciIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSI3NSIgcj0iMTIiIHN0cm9rZT0iIzc3NyIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSJub25lIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9Ijc1IiByPSI2IiBmaWxsPSIjNzc3Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTIwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNzc3IiBmb250LXNpemU9IjEyIj5ObyBTdHJlYW08L3RleHQ+Cjwvc3ZnPgo=";

  // Use MJPEG stream hook
  const { isStreaming, streamPort } = useMjpegStream();

  const startStream = useCallback(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Determine which stream URL to use
    let currentStreamUrl = streamUrl;
    if (isStreaming && streamPort) {
      currentStreamUrl = `${MJPEG_ENDPOINTS.STREAM_URL}`;
    }

    // Check for unsafe ports
    try {
      const url = new URL(currentStreamUrl);
      const port = Number.parseInt(url.port);
      const unsafePorts = [
        6000, 6001, 6002, 6003, 6004, 6005, 6006, 6007, 6008, 6009, 6010,
      ];
      if (unsafePorts.includes(port)) {
        setError(
          `Port ${port} is blocked by browsers for security reasons. Please use a safe port like 8080, 8000, or 3000.`
        );
        setIsLoading(false);
        return;
      }
    } catch (urlError) {
      setError(`Invalid stream URL: ${currentStreamUrl}`);
      setIsLoading(false);
      return;
    }

    // Don't add cache busting for MJPEG streams - it can interfere
    setStreamSrc(currentStreamUrl);
    setIsPlaying(true);
    setError(null);
    setIsLoading(true);

    // Set a timeout to handle stuck loading
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError(`Stream loading timeout. URL: ${currentStreamUrl}`);
    }, 8000);
  }, [isStreaming, streamPort, streamUrl]);

  // Auto-refresh when stream status or port changes
  useEffect(() => {
    if (isStreaming && streamPort) {
      // Stream just became available, auto-start/refresh
      setTimeout(() => {
        setIsPlaying(true);
        startStream();
      }, 500);
    } else if (!isStreaming && isPlaying) {
      // Stream stopped, show placeholder
      setStreamSrc(placeholderImage);
      setError("Stream is not running");
      setIsLoading(false);
    }
  }, [isStreaming, streamPort, startStream, isPlaying]);

  // Only restart when stream becomes available
  useEffect(() => {
    if (isPlaying && isStreaming && streamPort) {
      setTimeout(() => startStream(), 200);
    }
  }, [isPlaying, isStreaming, startStream, streamPort]);

  const stopStream = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setStreamSrc("");
    setIsPlaying(false);
    setIsLoading(false);
    setError(null);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopStream();
    } else {
      startStream();
    }
  };

  const refreshStream = () => {
    stopStream();
    setTimeout(() => {
      if (isStreaming && streamPort) {
        startStream();
      }
    }, 300);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (autoPlay) {
      startStream();
    }
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [autoPlay, startStream]);

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
            onLoad={() => {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
              // Only clear loading if it's not the placeholder image
              if (streamSrc !== placeholderImage) {
                setIsLoading(false);
                setError(null);
              }
            }}
            onError={(e) => {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
              setIsLoading(false);
              if (streamSrc !== placeholderImage) {
                setError(`Failed to load MJPEG stream from: ${streamSrc}`);
                // Fall back to placeholder image
                setStreamSrc(placeholderImage);
              }
              console.error("Stream error:", e);
            }}
          />

          {isLoading && (
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

          {error && streamSrc === placeholderImage && (
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

                <IconButton
                  onClick={refreshStream}
                  color="primary"
                  size="large"
                >
                  <Refresh />
                </IconButton>
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

                  <Tooltip title="No Audio">
                    <IconButton size="small" disabled>
                      <VolumeOff />
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
