import { useCallback, useEffect } from "react";
import { useApi } from "./useApi";
import { useNotification } from "./useNotification";
import { useAppContext } from "../contexts/AppContext";
import { MJPEG_BASE_URL, MJPEG_ENDPOINTS } from "../config";

interface MjpegStreamStatus {
  active: boolean;
  camera_type?: string;
  clients?: number;
}

export const useMjpegStream = () => {
  const api = useApi();
  const { showNotification } = useNotification();
  const {
    isStreaming,
    isStreamLoading,
    setIsStreamLoading,
    setIsStreaming,
    setStreamURL,
  } = useAppContext();

  // Check stream status
  const checkStatus = useCallback(async () => {
    try {
      const response = (await api.getMjpegStreamStatus()) as MjpegStreamStatus;
      setIsStreaming(response.active);

      // Generate stream URL - always use the direct microservice endpoint
      const streamURL = response.active
        ? `${MJPEG_BASE_URL}${MJPEG_ENDPOINTS.STREAM}`
        : null;

      setStreamURL(streamURL);
      return response;
    } catch (error) {
      console.error("Failed to check MJPEG stream status:", error);
      setIsStreamLoading(false);
      setIsStreaming(false);
      setStreamURL(null);
      return { active: false };
    }
  }, [api, setIsStreamLoading, setIsStreaming, setStreamURL]);

  // Start stream
  const startStream = useCallback(async () => {
    if (isStreamLoading) return;

    setIsStreamLoading(true);
    try {
      const response = (await api.startMjpegStream()) as {
        success: string;
        camera_type: string;
      };

      // Wait for stream to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsStreaming(true);
      const streamURL = `${MJPEG_BASE_URL}${MJPEG_ENDPOINTS.STREAM}`;
      setStreamURL(streamURL);
      showNotification(
        `MJPEG stream started (${response.camera_type})`,
        "success"
      );

      // Verify stream is actually accessible after a short delay
      setTimeout(async () => {
        await checkStatus();
      }, 2000);

      return true;
    } catch (error) {
      console.error("Failed to start MJPEG stream:", error);
      setIsStreaming(false);
      setStreamURL(null);
      showNotification(
        error instanceof Error ? error.message : "Failed to start MJPEG stream",
        "error"
      );
      return false;
    } finally {
      setIsStreamLoading(false);
    }
  }, [
    api,
    checkStatus,
    isStreamLoading,
    setIsStreamLoading,
    setIsStreaming,
    setStreamURL,
    showNotification,
  ]);

  // Stop stream
  const stopStream = useCallback(async () => {
    if (isStreamLoading) return;

    setIsStreamLoading(true);
    try {
      await api.stopMjpegStream();
      setIsStreaming(false);
      setStreamURL(null);
      showNotification("MJPEG stream stopped successfully", "success");
      return true;
    } catch (error: unknown) {
      console.error("Failed to stop MJPEG stream:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to stop MJPEG stream",
        "error"
      );
      return false;
    } finally {
      setIsStreamLoading(false);
    }
  }, [
    api,
    isStreamLoading,
    setIsStreamLoading,
    setIsStreaming,
    setStreamURL,
    showNotification,
  ]);

  // Toggle stream
  const toggleStream = useCallback(async () => {
    if (isStreaming) {
      return await stopStream();
    }
    return await startStream();
  }, [isStreaming, startStream, stopStream]);

  // Auto-check status on mount only once
  useEffect(() => {
    let mounted = true;

    const initialCheck = async () => {
      try {
        const response =
          (await api.getMjpegStreamStatus()) as MjpegStreamStatus;
        if (mounted) {
          setIsStreaming(response.active);
          const streamURL = response.active
            ? `${MJPEG_BASE_URL}${MJPEG_ENDPOINTS.STREAM}`
            : null;
          setStreamURL(streamURL);
        }
      } catch (error) {
        console.error("Failed to check initial MJPEG stream status:", error);
        if (mounted) {
          setIsStreaming(false);
          setStreamURL(null);
        }
      }
    };

    initialCheck();

    return () => {
      mounted = false;
    };
  }, [api, setIsStreaming, setStreamURL]); // Add dependencies but it should only run once because these are stable

  return {
    startStream,
    stopStream,
    toggleStream,
    checkStatus,
  };
};
