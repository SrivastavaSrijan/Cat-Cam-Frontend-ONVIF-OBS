import { useCallback } from "react";
import { fetchWrapper, type FetchOptions } from "../utils/fetch";
import {
  API_BASE_URL,
  CAMERA_ENDPOINTS,
  OBS_ENDPOINTS,
  MJPEG_ENDPOINTS,
} from "../config";

export const useApi = () => {
  const apiCall = useCallback(
    async <T>(
      endpoint: string,
      method: "GET" | "POST" = "GET",
      body?: unknown,
      options?: FetchOptions
    ): Promise<T> => {
      return new Promise((resolve, reject) => {
        fetchWrapper(
          `${API_BASE_URL}${endpoint}`,
          method,
          body,
          (data: T) => resolve(data),
          (error) => reject(error),
          options
        );
      });
    },
    []
  );

  // Camera-specific API calls
  const getCameraStatus = useCallback(
    (nickname: string) =>
      apiCall(`${CAMERA_ENDPOINTS.STATUS}?nickname=${nickname}`),
    [apiCall]
  );

  const getCameraPresets = useCallback(
    (nickname: string) =>
      apiCall(`${CAMERA_ENDPOINTS.PRESETS}?nickname=${nickname}`),
    [apiCall]
  );

  const getCameraImaging = useCallback(
    (nickname: string) =>
      apiCall(`${CAMERA_ENDPOINTS.IMAGING}?nickname=${nickname}`),
    [apiCall]
  );

  const getAllCameras = useCallback(
    () => apiCall(CAMERA_ENDPOINTS.CAMERAS),
    [apiCall]
  );

  const gotoPreset = useCallback(
    (nickname: string, presetToken: string) =>
      apiCall(`${CAMERA_ENDPOINTS.GOTO_PRESET}?nickname=${nickname}`, "POST", {
        presetToken,
      }),
    [apiCall]
  );

  const toggleNightMode = useCallback(
    (nickname: string, enable: boolean) =>
      apiCall(`${CAMERA_ENDPOINTS.NIGHT_MODE}?nickname=${nickname}`, "POST", {
        enable,
      }),
    [apiCall]
  );

  const continuousMove = useCallback(
    (nickname: string, direction: string, speed = 1) =>
      apiCall(
        `${CAMERA_ENDPOINTS.CONTINUOUS_MOVE}?nickname=${nickname}`,
        "POST",
        {
          direction,
          speed,
        }
      ),
    [apiCall]
  );

  const stopMove = useCallback(
    (nickname: string) =>
      apiCall(`${CAMERA_ENDPOINTS.STOP}?nickname=${nickname}`, "POST"),
    [apiCall]
  );

  const moveCamera = useCallback(
    (nickname: string, direction: string, velocityFactor = 1) =>
      apiCall(`/ptz/move?nickname=${nickname}`, "POST", {
        direction,
        velocity_factor: velocityFactor,
      }),
    [apiCall]
  );

  // OBS-specific API calls
  const obsTransform = useCallback(
    (type: "highlight" | "grid", activeSource?: string) =>
      apiCall(OBS_ENDPOINTS.TRANSFORM, "POST", {
        type,
        active_source: activeSource,
      }),
    [apiCall]
  );

  const obsCurrentTransformation = useCallback(
    () =>
      apiCall<{
        layout_mode: "grid" | "highlight";
        highlighted_source: string;
      }>(OBS_ENDPOINTS.CURRENT_TRANSFORMATION),
    [apiCall]
  );

  const obsSwitchScene = useCallback(
    (sceneName: string) =>
      apiCall(OBS_ENDPOINTS.SWITCH_SCENE, "POST", { scene_name: sceneName }),
    [apiCall]
  );

  const obsReconnect = useCallback(
    () => apiCall(OBS_ENDPOINTS.RECONNECT, "POST"),
    [apiCall]
  );

  const startVirtualCamera = useCallback(
    () => apiCall(OBS_ENDPOINTS.VIRTUAL_CAMERA.START, "POST"),
    [apiCall]
  );

  const stopVirtualCamera = useCallback(
    () => apiCall(OBS_ENDPOINTS.VIRTUAL_CAMERA.STOP, "POST"),
    [apiCall]
  );

  const checkVirtualCameraStatus = useCallback(
    () => apiCall(OBS_ENDPOINTS.VIRTUAL_CAMERA.STATUS),
    [apiCall]
  );

  const startProjector = useCallback(
    (sourceName: string) =>
      apiCall(OBS_ENDPOINTS.PROJECTOR.START, "POST", {
        source_name: sourceName,
      }),
    [apiCall]
  );

  const closeProjector = useCallback(
    () =>
      apiCall(OBS_ENDPOINTS.PROJECTOR.CLOSE, "POST", {
        projector_type: "source",
      }),
    [apiCall]
  );

  // MJPEG Stream operations
  const startMjpegStream = useCallback(
    () => apiCall(MJPEG_ENDPOINTS.START, "POST"),
    [apiCall]
  );

  const stopMjpegStream = useCallback(
    () => apiCall(MJPEG_ENDPOINTS.STOP, "POST"),
    [apiCall]
  );

  const getMjpegStreamStatus = useCallback(
    () => apiCall(MJPEG_ENDPOINTS.STATUS),
    [apiCall]
  );

  const getMjpegStreamLogs = useCallback(
    () => apiCall(MJPEG_ENDPOINTS.LOGS),
    [apiCall]
  );

  return {
    apiCall,
    // Camera operations
    getCameraStatus,
    getCameraPresets,
    getCameraImaging,
    getAllCameras,
    gotoPreset,
    toggleNightMode,
    continuousMove,
    stopMove,
    moveCamera,
    // OBS operations
    obsCurrentTransformation,
    obsTransform,
    obsSwitchScene,
    obsReconnect,
    startVirtualCamera,
    stopVirtualCamera,
    checkVirtualCameraStatus,
    startProjector,
    closeProjector,
    // MJPEG Stream operations
    startMjpegStream,
    stopMjpegStream,
    getMjpegStreamStatus,
    getMjpegStreamLogs,
  };
};
