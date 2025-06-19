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
  PlayArrow,
  Pause,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Refresh,
} from "@mui/icons-material";
import StreamControls from "./StreamControls";

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

  useEffect(() => {
    if (autoPlay) {
      startStream();
    }
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPlay]);

  const startStream = () => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Add timestamp for cache busting
    const separator = streamUrl.includes("?") ? "&" : "?";
    const urlWithTimestamp = `${streamUrl}${separator}_t=${Date.now()}`;

    setStreamSrc(urlWithTimestamp);
    setIsPlaying(true);
    setError(null);
    setIsLoading(true);

    // Set a timeout to handle stuck loading
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError("Stream loading timeout - please check your connection");
    }, 10000); // 10 second timeout
  };

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
    if (isPlaying) {
      stopStream();
      // Small delay before restarting to ensure cleanup
      setTimeout(() => startStream(), 100);
    }
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
            src={streamSrc}
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
              setIsLoading(false);
              setError(null);
            }}
            onError={(e) => {
              if (loadingTimeoutRef.current) {
                clearTimeout(loadingTimeoutRef.current);
              }
              setIsLoading(false);
              setError("Failed to load MJPEG stream - please check the URL");
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
              <Typography variant="body2" color="white">
                Loading stream...
              </Typography>
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
              bgcolor="rgba(0,0,0,0.8)"
            >
              <Stack spacing={2} alignItems="center">
                <Typography variant="body2" color="white">
                  {error}
                </Typography>
                <IconButton onClick={refreshStream} color="primary">
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
