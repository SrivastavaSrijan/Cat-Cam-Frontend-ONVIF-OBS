import { useState, useCallback } from "react";
import { apiClient, ApiClientError } from "../api/client";
import type {
  CameraStatus,
  CameraInfo,
  Preset,
  ImagingSettings,
  MovementDirection,
  UseCameraControlReturn,
} from "../types/api";

export const useCameraControl = (): UseCameraControlReturn => {
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

  // Camera operations
  const getCameraStatus = useCallback(
    (nickname: string): Promise<CameraStatus> =>
      handleApiCall(() => apiClient.getCameraStatus(nickname)),
    [handleApiCall]
  );

  const getCameraPresets = useCallback(
    (nickname: string): Promise<Preset[]> =>
      handleApiCall(() => apiClient.getCameraPresets(nickname)),
    [handleApiCall]
  );

  const getCameraImaging = useCallback(
    (nickname: string): Promise<ImagingSettings> =>
      handleApiCall(() => apiClient.getCameraImaging(nickname)),
    [handleApiCall]
  );

  const getAllCameras = useCallback(
    (): Promise<CameraInfo[]> => handleApiCall(() => apiClient.getAllCameras()),
    [handleApiCall]
  );

  const switchCamera = useCallback(
    (nickname: string): Promise<void> =>
      handleApiCall(() => apiClient.switchCamera(nickname)),
    [handleApiCall]
  );

  const gotoPreset = useCallback(
    (nickname: string, presetToken: string): Promise<void> =>
      handleApiCall(() => apiClient.gotoPreset(nickname, presetToken)),
    [handleApiCall]
  );

  const moveCamera = useCallback(
    (
      nickname: string,
      direction: MovementDirection,
      velocityFactor?: number
    ): Promise<void> =>
      handleApiCall(() =>
        apiClient.moveCamera(nickname, direction, velocityFactor)
      ),
    [handleApiCall]
  );

  const continuousMove = useCallback(
    (
      nickname: string,
      direction: MovementDirection,
      speed?: number
    ): Promise<void> =>
      handleApiCall(() => apiClient.continuousMove(nickname, direction, speed)),
    [handleApiCall]
  );

  const stopMove = useCallback(
    (nickname: string): Promise<void> =>
      handleApiCall(() => apiClient.stopMove(nickname)),
    [handleApiCall]
  );

  const setMovementSpeed = useCallback(
    (
      nickname: string,
      panTiltSpeed?: number,
      zoomSpeed?: number
    ): Promise<void> =>
      handleApiCall(() =>
        apiClient.setMovementSpeed(nickname, panTiltSpeed, zoomSpeed)
      ),
    [handleApiCall]
  );

  const toggleNightMode = useCallback(
    (nickname: string, enable: boolean): Promise<void> =>
      handleApiCall(() => apiClient.toggleNightMode(nickname, enable)),
    [handleApiCall]
  );

  const reinitializeCameras = useCallback(
    (): Promise<CameraInfo[]> =>
      handleApiCall(() => apiClient.reinitializeCameras()),
    [handleApiCall]
  );

  return {
    loading,
    error,
    clearError,
    // Camera operations
    getCameraStatus,
    getCameraPresets,
    getCameraImaging,
    getAllCameras,
    switchCamera,
    gotoPreset,
    moveCamera,
    continuousMove,
    stopMove,
    setMovementSpeed,
    toggleNightMode,
    reinitializeCameras,
  };
};
