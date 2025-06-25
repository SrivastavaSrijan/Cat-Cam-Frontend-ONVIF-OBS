import type React from "react";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { Box, Paper, Stack, useTheme, useMediaQuery } from "@mui/material";
import { useStream } from "../hooks";
import { useEventListener } from "../hooks/useEventListener";
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
  overlayOpen?: boolean;
  onOverlayClose?: () => void;
  OverlayComponent?: React.ComponentType<{
    open: boolean;
    onClose: () => void;
    orientation?: "portrait" | "landscape" | "auto";
    isOverlayMode?: boolean;
    usePortal?: boolean;
  }>;
  isOverlayMode?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
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

  // Listen for fullscreen changes to update state properly
  const handleFullscreenChange = useCallback(() => {
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
  }, [isOverlayMode, onOverlayClose]);

  useEventListener("fullscreenchange", handleFullscreenChange, document);
  useEventListener("webkitfullscreenchange", handleFullscreenChange, document);
  useEventListener("mozfullscreenchange", handleFullscreenChange, document);
  useEventListener("MSFullscreenChange", handleFullscreenChange, document);

  return (
    <Stack spacing={2} ref={containerRef}>
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
            showControls={controls}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              console.error("Stream error:", e);
              if (streamURL !== placeholderImage && streamURL) {
                setError(`Failed to load stream from: ${streamURL}`);
              }
            }}
            style={{
              backgroundColor: "black",
            }}
            onFullscreenChange={setIsFullscreen}
            onRefresh={refreshStream}
            onCameraOverlay={onCameraOverlay}
            showCameraControls={!!onCameraOverlay}
            error={error}
          />

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

          {/* Render overlay using portal - always use portal when overlay is open */}
          {OverlayComponent && overlayOpen && (
            <OverlayComponent
              open={overlayOpen}
              onClose={onOverlayClose || (() => {})}
              orientation={isFullscreen ? "landscape" : "auto"}
              isOverlayMode={isOverlayMode}
              usePortal={true} // Always use portal to avoid stacking context issues
            />
          )}
        </Box>
      </Paper>
    </Stack>
  );
};

export default Player;
