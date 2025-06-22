import { useState, useCallback, useRef, useMemo } from "react";
import { apiClient } from "../api/client";
import { useNotification } from "./useNotification";
import { useLoading } from "./useLoading";
import type {
  CameraStatus,
  CameraInfo,
  Preset,
  MovementDirection,
} from "../types/api";

// Update interfaces to match our typed API
export interface CameraData {
  presets: Preset[];
  selectedPreset: string | null;
  status: CameraStatus | null;
  isLoading: boolean;
  error: string | null;
}

export type StreamView = {
  layout_mode: "grid" | "highlight";
  highlighted_source?: string;
};

export const useAppData = () => {
  const [cameraData, setCameraData] = useState<Record<string, CameraData>>({});
  const [isContinuousMoving, setIsContinuousMoving] = useState<
    Record<string, boolean>
  >({});

  // Camera selection state
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [allCameras, setAllCameras] = useState<CameraInfo[]>([]);
  const [camerasLoaded, setCamerasLoaded] = useState(false);
  const [streamView, setStreamView] = useState<StreamView | undefined>(
    undefined
  );

  // MJPEG Stream state - centralized here
  const [streamURL, setStreamURL] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  const { loading, withLoading } = useLoading();
  const { showError, showSuccess } = useNotification();

  const loadingRef = useRef<Set<string>>(new Set());
  const cameraListLoadingRef = useRef(false);
  const streamPlayerRef = useRef<HTMLImageElement>(null);

  const loadCameraData = useCallback(
    async (nickname: string) => {
      if (!nickname || loadingRef.current.has(nickname)) return;

      loadingRef.current.add(nickname);

      // Set loading state
      const loadingData: CameraData = {
        presets: cameraData[nickname]?.presets || [],
        selectedPreset: cameraData[nickname]?.selectedPreset || null,
        status: cameraData[nickname]?.status || null,
        isLoading: true,
        error: null,
      };
      setCameraData((prev) => ({ ...prev, [nickname]: loadingData }));

      try {
        // Fetch status using typed API client
        const cameraStatus = await withLoading(() =>
          apiClient.getCameraStatus(nickname)
        );

        // Fetch presets using typed API client
        const presets = await withLoading(() =>
          apiClient.getCameraPresets(nickname)
        );

        // Filter presets that have position data
        const cleanedPresets = presets.filter((preset) => preset?.PTZPosition);

        // Auto-select preset based on current position
        let selectedPreset: string | null = null;
        if (cleanedPresets.length > 0 && cameraStatus) {
          const { x, y } = cameraStatus.PTZPosition?.PanTilt ?? {};
          const presetAtPosition = cleanedPresets.find(
            (preset) =>
              preset.PTZPosition?.PanTilt?.x === x &&
              preset.PTZPosition?.PanTilt?.y === y
          );
          if (presetAtPosition) {
            selectedPreset = presetAtPosition.Token;
          }
        }

        const successData: CameraData = {
          presets: cleanedPresets,
          selectedPreset,
          status: cameraStatus,
          isLoading: false,
          error: null,
        };
        setCameraData((prev) => ({ ...prev, [nickname]: successData }));
      } catch (error) {
        const errorData: CameraData = {
          presets: [],
          selectedPreset: null,
          status: null,
          isLoading: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load camera data",
        };
        setCameraData((prev) => ({ ...prev, [nickname]: errorData }));
        showError(
          `Failed to load data for ${nickname}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        loadingRef.current.delete(nickname);
      }
    },
    [withLoading, showError, cameraData]
  );

  const gotoPreset = useCallback(
    async (nickname: string, presetToken: string) => {
      if (!nickname) return;

      const currentData = cameraData[nickname];
      if (!currentData || presetToken === currentData.selectedPreset) return;

      try {
        await apiClient.gotoPreset(nickname, presetToken);

        // Update selected preset
        const updatedData: CameraData = {
          ...currentData,
          selectedPreset: presetToken,
        };
        setCameraData((prev) => ({ ...prev, [nickname]: updatedData }));

        const preset = currentData.presets.find((p) => p.Token === presetToken);
        showSuccess(`Moved to preset: ${preset?.Name || "Unknown"}`);
      } catch (error) {
        showError("Failed to go to preset");
        // Reset selected preset on error
        const updatedData: CameraData = {
          ...currentData,
          selectedPreset: null,
        };
        setCameraData((prev) => ({ ...prev, [nickname]: updatedData }));
      }
    },
    [cameraData, showSuccess, showError]
  );

  const startContinuousMove = useCallback(
    async (nickname: string, direction: MovementDirection) => {
      if (!nickname || isContinuousMoving[nickname]) return;

      try {
        await apiClient.continuousMove(nickname, direction);
        setIsContinuousMoving((prev) => ({ ...prev, [nickname]: true }));
      } catch (error) {
        showError("Failed to start movement");
      }
    },
    [isContinuousMoving, showError]
  );

  const stopContinuousMove = useCallback(
    async (nickname: string) => {
      if (!nickname) return;

      try {
        await apiClient.stopMove(nickname);
        setIsContinuousMoving((prev) => ({ ...prev, [nickname]: false }));
      } catch (error) {
        showError("Failed to stop movement");
      }
    },
    [showError]
  );

  const moveCamera = useCallback(
    async (
      nickname: string,
      direction: MovementDirection,
      velocityFactor = 1
    ) => {
      if (!nickname) return;

      try {
        await apiClient.moveCamera(nickname, direction, velocityFactor);
      } catch (error) {
        showError("Failed to move camera");
      }
    },
    [showError]
  );

  const getCameraData = useCallback(
    (nickname: string): CameraData | null => {
      return cameraData[nickname] || null;
    },
    [cameraData]
  );

  const selectStreamView = useCallback((params: StreamView) => {
    setStreamView(params);
  }, []);

  const isCameraMoving = useCallback(
    (nickname: string): boolean => {
      return isContinuousMoving[nickname] || false;
    },
    [isContinuousMoving]
  );

  // Camera list management
  const loadCameraList = useCallback(async () => {
    if (cameraListLoadingRef.current || camerasLoaded) return;

    cameraListLoadingRef.current = true;

    try {
      const cameras = await apiClient.getAllCameras();

      setAllCameras(cameras);
      setCamerasLoaded(true);

      // Check current OBS transformation to see if a camera is already highlighted
      try {
        const currentStreamView = await withLoading(() =>
          apiClient.getTransformationState()
        );
        selectStreamView(currentStreamView);
        if (currentStreamView?.layout_mode === "highlight") {
          // Check if the highlighted source corresponds to an online camera
          const onlineCameras = cameras.filter(
            (cam) => cam.status === "online"
          );
          const highlightedCamera = onlineCameras.find(
            (cam) => cam.nickname === currentStreamView?.highlighted_source
          );

          if (highlightedCamera) {
            setSelectedCamera(highlightedCamera.nickname);
            loadCameraData(highlightedCamera.nickname);
            console.log(
              "Auto-selected camera from current OBS highlight:",
              highlightedCamera.nickname
            );
            return; // Exit early, don't auto-select first camera
          }
        }
      } catch (error) {
        console.warn(
          "Failed to get current transformation, will use default selection:",
          error
        );
      }

      // Fallback: Auto-select first online camera if none selected and no highlighted source
      const onlineCameras = cameras.filter((cam) => cam.status === "online");
      if (!selectedCamera && onlineCameras.length > 0) {
        setSelectedCamera(onlineCameras[0].nickname);
        loadCameraData(onlineCameras[0].nickname);
        console.log(
          "Auto-selected first online camera:",
          onlineCameras[0].nickname
        );
      }

      console.log(
        `Loaded ${cameras.length} cameras, ${onlineCameras.length} online`
      );
    } catch (error) {
      showError("Failed to load camera list");
      console.error("Camera list loading error:", error);
    } finally {
      cameraListLoadingRef.current = false;
    }
  }, [
    camerasLoaded,
    loadCameraData,
    selectStreamView,
    selectedCamera,
    showError,
    withLoading,
  ]);

  const selectCamera = useCallback((nickname: string) => {
    setSelectedCamera(nickname);
    console.log("Camera selected:", nickname);
  }, []);

  const cameraList = useMemo(() => {
    return allCameras
      .filter((cam) => cam.status === "online")
      .map((cam) => cam.nickname);
  }, [allCameras]);

  const onlineCameraCount = cameraList.length;
  const totalCameraCount = allCameras.length;

  return useMemo(
    () => ({
      // Camera data management
      loadCameraData,
      gotoPreset,
      startContinuousMove,
      stopContinuousMove,
      moveCamera,
      getCameraData,
      isCameraMoving,
      globalLoading: loading,

      // Camera selection management
      selectedCamera,
      allCameras,
      cameraList,
      onlineCameraCount,
      totalCameraCount,
      isLoadingCameras: cameraListLoadingRef.current,
      loadCameraList,
      selectCamera,

      // OBS control
      streamView,
      selectStreamView,

      // MJPEG Stream management
      streamURL,
      setStreamURL,
      isStreaming,
      setIsStreaming,
      isStreamLoading,
      setIsStreamLoading,
      streamPlayerRef,
    }),
    [
      loadCameraData,
      gotoPreset,
      startContinuousMove,
      stopContinuousMove,
      moveCamera,
      getCameraData,
      isCameraMoving,
      loading,
      selectedCamera,
      allCameras,
      cameraList,
      onlineCameraCount,
      totalCameraCount,
      loadCameraList,
      selectCamera,
      streamView,
      selectStreamView,
      streamURL,
      isStreaming,
      isStreamLoading,
    ]
  );
};
