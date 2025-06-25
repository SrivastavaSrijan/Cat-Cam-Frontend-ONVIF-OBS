import type React from "react";
import { useMemo, useState } from "react";
import { Box, Paper, Stack } from "@mui/material";
import SkeletonLoader from "./SkeletonLoader";
import CanvasStreamPlayer from "./CanvasStreamPlayer";
import { useStreamPlayer } from "../hooks/useStreamPlayer";
import { PLAYER_CONFIG } from "../config";
import ControllerOverlay from "./ControllerOverlay";

const Player: React.FC = () => {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const handleOverlayOpen = () => {
    setOverlayOpen(true);
  };

  const handleOverlayClose = () => {
    setOverlayOpen(false);
  };
  const {
    isFullscreen,
    error,
    containerWidth,
    containerRef,
    playerRef,
    streamURL,
    refreshStream,
    setError,
  } = useStreamPlayer(true);

  // Calculate proper height based on aspect ratio and container width
  const playerHeight = useMemo(() => {
    if (isFullscreen) return "100vh";

    // For percentage or auto width, use container width if available
    if (containerWidth > 0) {
      return containerWidth / PLAYER_CONFIG.ASPECT_RATIO;
    }
  }, [isFullscreen, containerWidth]);

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
            ref={playerRef}
            src={streamURL || PLAYER_CONFIG.PLACEHOLDER}
            alt="Stream Player"
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              console.error("Stream error:", e);
              if (streamURL !== PLAYER_CONFIG.PLACEHOLDER && streamURL) {
                setError(`Failed to load stream from: ${streamURL}`);
              }
            }}
            onRefresh={refreshStream}
            onCameraOverlay={handleOverlayOpen}
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
          {overlayOpen && (
            <ControllerOverlay
              open={overlayOpen}
              isOverlayMode
              onClose={handleOverlayClose}
              orientation={isFullscreen ? "landscape" : "auto"}
            />
          )}
        </Box>
      </Paper>
    </Stack>
  );
};

export default Player;
