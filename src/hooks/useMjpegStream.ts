import { useState, useCallback, useEffect } from "react";
import { useApi } from "./useApi";
import { useNotification } from "./useNotification";

interface MjpegStreamStatus {
  running: boolean;
  port?: number;
  url?: string;
  pid?: number;
  managed_process?: boolean;
}

export const useMjpegStream = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("");

  const api = useApi();
  const { showNotification } = useNotification();

  // Check stream status
  const checkStatus = useCallback(async () => {
    try {
      const response = (await api.getMjpegStreamStatus()) as MjpegStreamStatus;
      setIsStreaming(response.running);
      setStreamUrl(response.running ? response.url || null : null);
      return response;
    } catch (error) {
      console.error("Failed to check MJPEG stream status:", error);
      setIsStreaming(false);
      setStreamUrl(null);
      return { running: false };
    }
  }, [api]);

  // Start stream
  const startStream = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const response = (await api.startMjpegStream()) as {
        success: string;
        port: number;
        url: string;
      };

      // Wait for stream to be ready
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsStreaming(true);
      setStreamUrl(response.url);
      showNotification(`MJPEG stream started: ${response.url}`, "success");

      // Verify stream is actually accessible after a short delay
      setTimeout(async () => {
        await checkStatus();
      }, 2000);

      return true;
    } catch (error) {
      console.error("Failed to start MJPEG stream:", error);
      setIsStreaming(false);
      setStreamUrl(null);
      showNotification(
        error instanceof Error ? error.message : "Failed to start MJPEG stream",
        "error"
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [api, isLoading, showNotification, checkStatus]);

  // Stop stream
  const stopStream = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await api.stopMjpegStream();
      setIsStreaming(false);
      setStreamUrl(null);
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
      setIsLoading(false);
    }
  }, [api, isLoading, showNotification]);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    try {
      const response = (await api.getMjpegStreamLogs()) as { logs: string };
      setLogs(response.logs);
      return response.logs;
    } catch (error: unknown) {
      console.error("Failed to fetch MJPEG stream logs:", error);
      showNotification(
        error instanceof Error ? error.message : "Failed to fetch stream logs",
        "error"
      );
      return "";
    }
  }, [api, showNotification]);

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
    isStreaming,
    isLoading,
    streamUrl,
    logs,
    startStream,
    stopStream,
    toggleStream,
    checkStatus,
    fetchLogs,
  };
};
