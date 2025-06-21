import { useCallback, useEffect } from "react";
import { useApi } from "./useApi";
import { useNotification } from "./useNotification";
import { useAppContext } from "../contexts/AppContext";

interface MjpegStreamStatus {
  running: boolean;
  port?: number;
  url?: string;
  pid?: number;
  managed_process?: boolean;
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
    setMjpegLogs,
  } = useAppContext();

  // Check stream status
  const checkStatus = useCallback(async () => {
    try {
      const response = (await api.getMjpegStreamStatus()) as MjpegStreamStatus;
      setIsStreaming(response.running);
      const responseURL =
        process.env.NODE_ENV === "development"
          ? process.env.REACT_APP_MJPEG_STREAM_URL
          : response.url;
      setStreamURL(response.running ? responseURL || null : null);
      return response;
    } catch (error) {
      console.error("Failed to check MJPEG stream status:", error);
      setIsStreamLoading(false);
      setStreamURL(null);
      return { running: false };
    }
  }, [api, setIsStreamLoading, setIsStreaming, setStreamURL]);

  // Start stream
  const startStream = useCallback(async () => {
    if (isStreamLoading) return;

    setIsStreamLoading(true);
    try {
      const response = (await api.startMjpegStream()) as {
        success: string;
        port: number;
        url: string;
      };

      // Wait for stream to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsStreaming(true);
      setStreamURL(response.url);
      showNotification(`MJPEG stream started: ${response.url}`, "success");

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

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const response = (await api.getMjpegStreamLogs()) as { logs: string };
      setMjpegLogs(response.logs);
      return response.logs;
    } catch (error: unknown) {
      console.error("Failed to fetch MJPEG stream logs:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to fetch stream logs",
        "error"
      );
      return "";
    }
  }, [api, setMjpegLogs, showNotification]);

  // Toggle stream
  const toggleStream = useCallback(async () => {
    if (isStreaming) {
      return await stopStream();
    }
    return await startStream();
  }, [isStreaming, startStream, stopStream]);

  // Auto-check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return {
    startStream,
    stopStream,
    toggleStream,
    checkStatus,
    fetchLogs,
  };
};
