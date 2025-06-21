import { useState, useEffect, useCallback } from "react";
import { useAppContext, type CameraData } from "../contexts/AppContext";

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

export const useCameraControl = (nickname: string | null) => {
  const [data, setData] = useState<{
    presets: Preset[];
    selectedPreset: string | null;
    status: CameraStatus | null;
    isLoading: boolean;
    error: string | null;
  }>({
    presets: [],
    selectedPreset: null,
    status: null,
    isLoading: false,
    error: null,
  });

  const {
    subscribeToCamera,
    getCameraData,
    loadCameraData,
    gotoPreset: managerGotoPreset,
    startContinuousMove: managerStartContinuousMove,
    stopContinuousMove: managerStopContinuousMove,
    moveCamera: managerMoveCamera,
    isCameraMoving,
  } = useAppContext();

  // Subscribe to camera data when nickname changes
  useEffect(() => {
    if (!nickname) {
      setData({
        presets: [],
        selectedPreset: null,
        status: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Subscribe to updates
    const unsubscribe = subscribeToCamera(
      nickname,
      (cameraData: CameraData) => {
        setData(cameraData);
      }
    );

    // Load data if not already loaded
    const existingData = getCameraData(nickname);
    if (
      !existingData ||
      (existingData.presets.length === 0 &&
        !existingData.isLoading &&
        !existingData.error)
    ) {
      loadCameraData(nickname);
    }

    return unsubscribe;
  }, [nickname, subscribeToCamera, getCameraData, loadCameraData]);

  const gotoPreset = useCallback(
    (presetToken: string) => {
      if (nickname) {
        return managerGotoPreset(nickname, presetToken);
      }
    },
    [nickname, managerGotoPreset]
  );

  const startContinuousMove = useCallback(
    (direction: string) => {
      if (nickname) {
        return managerStartContinuousMove(nickname, direction);
      }
    },
    [nickname, managerStartContinuousMove]
  );

  const stopContinuousMove = useCallback(() => {
    if (nickname) {
      return managerStopContinuousMove(nickname);
    }
  }, [nickname, managerStopContinuousMove]);

  const moveCamera = useCallback(
    (direction: string, velocityFactor = 1) => {
      if (nickname) {
        return managerMoveCamera(nickname, direction, velocityFactor);
      }
    },
    [nickname, managerMoveCamera]
  );

  const refresh = useCallback(() => {
    if (nickname) {
      return loadCameraData(nickname);
    }
  }, [nickname, loadCameraData]);

  const isContinuousMoving = nickname ? isCameraMoving(nickname) : false;

  return {
    presets: data.presets,
    selectedPreset: data.selectedPreset,
    currentStatus: data.status,
    loading: data.isLoading,
    error: data.error,
    isContinuousMoving,
    gotoPreset,
    startContinuousMove,
    stopContinuousMove,
    moveCamera,
    refresh,
  };
};
