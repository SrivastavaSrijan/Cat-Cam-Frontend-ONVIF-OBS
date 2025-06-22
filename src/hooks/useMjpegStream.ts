import { useState, useCallback } from "react";
import { apiClient, ApiClientError } from "../api/client";
import type {
  MjpegStreamStatus,
  MjpegHealthStatus,
  UseMjpegStreamReturn,
} from "../types/api";

export const useMjpegStream = (): UseMjpegStreamReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const handleApiCall = useCallback(
    async <T>(apiCall: () => Promise<T>): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiCall();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : err instanceof Error
            ? err.message
            : "An unknown error occurred";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // MJPEG operations
  const getHealth = useCallback(
    (): Promise<MjpegHealthStatus> =>
      handleApiCall(() => apiClient.getMjpegHealth()),
    [handleApiCall]
  );

  const getStatus = useCallback(
    (): Promise<MjpegStreamStatus> =>
      handleApiCall(() => apiClient.getMjpegStatus()),
    [handleApiCall]
  );

  const startStream = useCallback(
    (): Promise<void> => handleApiCall(() => apiClient.startMjpegStream()),
    [handleApiCall]
  );

  const stopStream = useCallback(
    (): Promise<void> => handleApiCall(() => apiClient.stopMjpegStream()),
    [handleApiCall]
  );

  return {
    loading,
    error,
    clearError,
    // MJPEG operations
    getHealth,
    getStatus,
    startStream,
    stopStream,
  };
};
