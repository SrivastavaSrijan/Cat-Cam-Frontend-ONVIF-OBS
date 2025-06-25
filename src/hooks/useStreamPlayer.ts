import { useRef, useState, useEffect, useCallback } from "react";
import { useStream } from "./index";
import { useAppContext } from "../contexts/AppContext";
import { useEventListener } from "./useEventListener";

/* ------------------------------------------------------------------ */
/* Types                                                             */
/* ------------------------------------------------------------------ */
export interface CanvasStreamPlayerRef {
  setSrc(src: string): void;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const getDisplayedDims = (
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number
) => {
  if (!imgW || !imgH) return { dw: containerW, dh: containerH }; // fallback
  const containerAR = containerW / containerH;
  const imgAR = imgW / imgH;

  if (containerAR > imgAR) {
    // container wider ⇒ height clamps, width letter-boxes
    const dh = containerH;
    const dw = dh * imgAR;
    return { dw, dh };
  }
  const dw = containerW;
  const dh = dw / imgAR;
  return { dw, dh };
};

interface Transform {
  scale?: number;
  x?: number;
  y?: number;
}

export interface StreamPlayerState {
  isFullscreen: boolean;
  inPip: boolean;
  error: string | null;
  containerWidth: number;
  transform: Transform;
}

export interface StreamPlayerActions {
  handleStartStream: () => Promise<void>;
  refreshStream: () => Promise<void>;
  toggleFullscreen: () => Promise<void>;
  togglePiP: () => Promise<void>;
  resetZoom: () => void;
  setError: (error: string | null) => void;
  setTransform: (transform: Transform) => void;
}

export const useStreamPlayer = (autoPlay = true) => {
  const { streamURL, setStreamURL, isStreaming } = useAppContext();
  const { stopStream, startStream, getStatus } = useStream();

  // State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [inPip, setInPip] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [transform, setTransform] = useState<Transform>({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const playerRef = useRef<any>(null);

  // Stream management
  const handleStartStream = useCallback(async () => {
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
    }
  }, [getStatus, isStreaming, setStreamURL, startStream]);

  const refreshStream = useCallback(async () => {
    try {
      console.log("Refreshing MJPEG stream...");
      setError(null);

      if (!isStreaming) {
        await startStream();
        return;
      }

      if (playerRef.current?.setSrc) {
        playerRef.current.setSrc(
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4="
        );
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
  }, [isStreaming, startStream, stopStream]);

  // Fullscreen management
  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
        // @ts-ignore - orientation lock API
        if (window.screen?.orientation?.lock) {
          try {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            await (window.screen.orientation as any)?.lock?.("landscape");
          } catch (e) {
            console.log("Orientation lock not supported");
          }
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        // @ts-ignore - orientation lock API
        if (window.screen?.orientation?.unlock) {
          try {
            window.screen.orientation.unlock();
          } catch (e) {
            console.log("Orientation unlock failed");
          }
        }
      }
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  }, [isFullscreen]);

  // PiP management
  const togglePiP = useCallback(async () => {
    if (inPip && document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }
    // PiP logic would be handled by the CanvasStreamPlayer component
  }, [inPip]);

  const resetZoom = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 });
  }, []);

  // Auto-start stream
  useEffect(() => {
    if (autoPlay && !hasAutoStarted && !isStreaming) {
      setHasAutoStarted(true);
      handleStartStream();
    }
  }, [autoPlay, handleStartStream, hasAutoStarted, isStreaming]);

  // Fullscreen event listeners
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = Boolean(
      document.fullscreenElement ||
        // @ts-ignore
        document.webkitFullscreenElement ||
        // @ts-ignore
        document.mozFullScreenElement ||
        // @ts-ignore
        document.msFullscreenElement
    );
    setIsFullscreen(isCurrentlyFullscreen);
  }, []);

  const handlePipChange = useCallback(() => {
    const pip = !!document.pictureInPictureElement;
    setInPip(pip);
  }, []);

  useEventListener("fullscreenchange", handleFullscreenChange, document);
  useEventListener("webkitfullscreenchange", handleFullscreenChange, document);
  useEventListener("mozfullscreenchange", handleFullscreenChange, document);
  useEventListener("MSFullscreenChange", handleFullscreenChange, document);
  useEventListener("enterpictureinpicture", handlePipChange, document);
  useEventListener("leavepictureinpicture", handlePipChange, document);

  // Container width measurement
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      const width = containerRef.current?.offsetWidth || 0;
      setContainerWidth(width);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const state: StreamPlayerState = {
    isFullscreen,
    inPip,
    error,
    containerWidth,
    transform,
  };

  const actions: StreamPlayerActions = {
    handleStartStream,
    refreshStream,
    toggleFullscreen,
    togglePiP,
    resetZoom,
    setError,
    setTransform,
  };

  return {
    ...state,
    ...actions,
    containerRef,
    playerRef,
    streamURL,
  };
};
