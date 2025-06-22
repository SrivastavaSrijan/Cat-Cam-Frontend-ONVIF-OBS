import { useState, useCallback } from "react";
import { apiClient, ApiClientError } from "../api/client";
import type {
  Scene,
  CurrentScene,
  TransformationState,
  VirtualCameraStatus,
  UseOBSControlReturn,
} from "../types/api";

export const useOBSControl = (): UseOBSControlReturn => {
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
        const errorMessage = err instanceof ApiClientError 
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

  // OBS operations
  const getScenes = useCallback(
    (): Promise<Scene[]> =>
      handleApiCall(() => apiClient.getScenes()),
    [handleApiCall]
  );

  const getCurrentScene = useCallback(
    (): Promise<CurrentScene> =>
      handleApiCall(() => apiClient.getCurrentScene()),
    [handleApiCall]
  );

  const switchScene = useCallback(
    (sceneName: string): Promise<void> =>
      handleApiCall(() => apiClient.switchScene(sceneName)),
    [handleApiCall]
  );

  const getTransformationState = useCallback(
    (): Promise<TransformationState> =>
      handleApiCall(() => apiClient.getTransformationState()),
    [handleApiCall]
  );

  const applyTransformation = useCallback(
    (type: "grid" | "highlight", activeSource?: string): Promise<void> =>
      handleApiCall(() => apiClient.applyTransformation(type, activeSource)),
    [handleApiCall]
  );

  const reconnect = useCallback(
    (): Promise<void> =>
      handleApiCall(() => apiClient.reconnectOBS()),
    [handleApiCall]
  );

  const startVirtualCamera = useCallback(
    (): Promise<void> =>
      handleApiCall(() => apiClient.startVirtualCamera()),
    [handleApiCall]
  );

  const stopVirtualCamera = useCallback(
    (): Promise<void> =>
      handleApiCall(() => apiClient.stopVirtualCamera()),
    [handleApiCall]
  );

  const getVirtualCameraStatus = useCallback(
    (): Promise<VirtualCameraStatus> =>
      handleApiCall(() => apiClient.getVirtualCameraStatus()),
    [handleApiCall]
  );

  const startProjector = useCallback(
    (sourceName: string): Promise<void> =>
      handleApiCall(() => apiClient.startProjector(sourceName)),
    [handleApiCall]
  );

  const closeProjector = useCallback(
    (): Promise<void> =>
      handleApiCall(() => apiClient.closeProjector()),
    [handleApiCall]
  );

  return {
    loading,
    error,
    clearError,
    // OBS operations
    getScenes,
    getCurrentScene,
    switchScene,
    getTransformationState,
    applyTransformation,
    reconnect,
    startVirtualCamera,
    stopVirtualCamera,
    getVirtualCameraStatus,
    startProjector,
    closeProjector,
  };
};
