import { useState, useCallback, useRef, useMemo } from "react";
import { useApi } from "./useApi";
import { useNotification } from "./useNotification";
import { useLoading } from "./useLoading";
import { useOBSControl } from "./useOBSControl";

interface Preset {
  Name: string;
  Token: string;
  PTZPosition?: {
    PanTilt: { x: number; y: number };
    Zoom: { x: number };
  };
}

interface CameraStatus {
  PTZPosition: {
    PanTilt: { x: number; y: number };
    Zoom: { x: number };
  };
  limits: {
    x_max: number;
    x_min: number;
    y_max: number;
    y_min: number;
    max_velocity: number;
  };
}

interface CameraInfo {
  nickname: string;
  host: string;
  port: number;
  status: "online" | "offline";
  error?: string;
}

export interface CameraData {
  presets: Preset[];
  selectedPreset: string | null;
  status: CameraStatus | null;
  isLoading: boolean;
  error: string | null;
}

type CameraDataCallback = (data: CameraData) => void;

export const useCameraDataManager = () => {
  const [cameraData, setCameraData] = useState<Record<string, CameraData>>({});
  const [isContinuousMoving, setIsContinuousMoving] = useState<
    Record<string, boolean>
  >({});

  // Camera selection state
  const [selectedCamera, setSelectedCamera] = useState<string | null>(null);
  const [allCameras, setAllCameras] = useState<CameraInfo[]>([]);
  const [camerasLoaded, setCamerasLoaded] = useState(false);

  const { loading, withLoading } = useLoading();
  const { showError, showSuccess } = useNotification();
  const api = useApi();
  const { switchStreamView } = useOBSControl();

  const loadingRef = useRef<Set<string>>(new Set());
  const callbacksRef = useRef<Record<string, Set<CameraDataCallback>>>({});
  const cameraListLoadingRef = useRef(false);

  const subscribeToCamera = useCallback(
    (nickname: string, callback: CameraDataCallback) => {
      if (!callbacksRef.current[nickname]) {
        callbacksRef.current[nickname] = new Set();
      }
      callbacksRef.current[nickname].add(callback);

      // Return current data if available - get from current state, not dependency
      setCameraData((currentData) => {
        if (currentData[nickname]) {
          callback(currentData[nickname]);
        }
        return currentData; // Don't change state, just read it
      });

      // Return unsubscribe function
      return () => {
        callbacksRef.current[nickname]?.delete(callback);
      };
    },
    [] // No dependencies!
  );

  const notifySubscribers = useCallback(
    (nickname: string, data: CameraData) => {
      setCameraData((prev) => ({ ...prev, [nickname]: data }));
      if (callbacksRef.current[nickname]) {
        // biome-ignore lint/complexity/noForEach: <explanation>
        callbacksRef.current[nickname].forEach((callback) => callback(data));
      }
    },
    []
  );

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
      notifySubscribers(nickname, loadingData);

      try {
        // Fetch status
        const status = await withLoading(() => api.getCameraStatus(nickname));
        const cameraStatus = status as CameraStatus;

        // Fetch presets
        const presetResponse = await withLoading(() =>
          api.getCameraPresets(nickname)
        );
        const response = presetResponse as { presets: Preset[] };
        const cleanedPresets = (response.presets || []).filter(
          (preset) => preset?.PTZPosition
        );

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
        notifySubscribers(nickname, successData);
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
        notifySubscribers(nickname, errorData);
        showError(
          `Failed to load data for ${nickname}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        loadingRef.current.delete(nickname);
      }
    },
    [api, withLoading, showError, notifySubscribers, cameraData]
  );

  const gotoPreset = useCallback(
    async (nickname: string, presetToken: string) => {
      if (!nickname) return;

      const currentData = cameraData[nickname];
      if (!currentData || presetToken === currentData.selectedPreset) return;

      try {
        await api.gotoPreset(nickname, presetToken);

        // Update selected preset
        const updatedData: CameraData = {
          ...currentData,
          selectedPreset: presetToken,
        };
        notifySubscribers(nickname, updatedData);

        const preset = currentData.presets.find((p) => p.Token === presetToken);
        showSuccess(`Moved to preset: ${preset?.Name || "Unknown"}`);
      } catch (error) {
        showError("Failed to go to preset");
        // Reset selected preset on error
        const updatedData: CameraData = {
          ...currentData,
          selectedPreset: null,
        };
        notifySubscribers(nickname, updatedData);
      }
    },
    [api, cameraData, notifySubscribers, showSuccess, showError]
  );

  const startContinuousMove = useCallback(
    async (nickname: string, direction: string) => {
      if (!nickname || isContinuousMoving[nickname]) return;

      try {
        await api.continuousMove(nickname, direction);
        setIsContinuousMoving((prev) => ({ ...prev, [nickname]: true }));
      } catch (error) {
        showError("Failed to start movement");
      }
    },
    [api, isContinuousMoving, showError]
  );

  const stopContinuousMove = useCallback(
    async (nickname: string) => {
      if (!nickname) return;

      try {
        await api.stopMove(nickname);
        setIsContinuousMoving((prev) => ({ ...prev, [nickname]: false }));
      } catch (error) {
        showError("Failed to stop movement");
      }
    },
    [api, showError]
  );

  const moveCamera = useCallback(
    async (nickname: string, direction: string, velocityFactor = 1) => {
      if (!nickname) return;

      try {
        await api.moveCamera(nickname, direction, velocityFactor);
      } catch (error) {
        showError("Failed to move camera");
      }
    },
    [api, showError]
  );

  const getCameraData = useCallback(
    (nickname: string): CameraData | null => {
      return cameraData[nickname] || null;
    },
    [cameraData]
  );

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
      const response = await api.getAllCameras();
      const data = response as { cameras: CameraInfo[] };
      const cameras = data.cameras || [];

      setAllCameras(cameras);
      setCamerasLoaded(true);

      // Auto-select first online camera if none selected
      const onlineCameras = cameras.filter((cam) => cam.status === "online");
      if (!selectedCamera && onlineCameras.length > 0) {
        setSelectedCamera(onlineCameras[0].nickname);
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
  }, [api, camerasLoaded, selectedCamera, showError]);

  const selectCamera = useCallback(
    (nickname: string) => {
      setSelectedCamera(nickname);
      console.log("Camera selected:", nickname);
      switchStreamView("highlight", nickname);
    },
    [switchStreamView]
  );

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
      subscribeToCamera,
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
    }),
    [
      subscribeToCamera,
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
    ]
  );
};
