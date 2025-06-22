import { useState, useCallback, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { useAppContext } from "../contexts/AppContext";
import { useOBSControl } from "./useOBSControl";
import { CAMERA_PRESETS } from "../utils/contants";
import type { MovementDirection } from "../types/api";

export type CameraMode = "normal" | "move";

export const useCameraOverlay = (open: boolean) => {
  const {
    selectedCamera,
    cameraList,
    allCameras,
    selectCamera,
    loadCameraList,
    isLoadingCameras,
    getCameraData,
    gotoPreset,
    isCameraMoving,
    startContinuousMove,
    stopContinuousMove,
    moveCamera,
  } = useAppContext();

  const { applyTransformation } = useOBSControl();

  // Initialize overlay camera - use selected camera or first available
  const [overlayCameraId, setOverlayCameraId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get camera data from app context
  const currentCameraData = overlayCameraId
    ? getCameraData(overlayCameraId)
    : null;

  const [cameraMode, setCameraMode] = useState<CameraMode>("normal");
  const [lastTap, setLastTap] = useState<number>(0);
  const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLElement | null>(null);
  const [swipeIndicator, setSwipeIndicator] = useState<{
    direction: string;
    show: boolean;
  }>({ direction: "", show: false });

  // Initialize cameras when overlay opens
  if (
    open &&
    !isInitialized &&
    cameraList.length === 0 &&
    allCameras.length === 0 &&
    !isLoadingCameras
  ) {
    loadCameraList();
  }

  // Initialize overlay camera when overlay opens
  if (open && !isInitialized && cameraList.length > 0) {
    const initialCamera = selectedCamera || cameraList[0];
    setOverlayCameraId(initialCamera);
    setIsInitialized(true);
    if (!selectedCamera && initialCamera) {
      selectCamera(initialCamera);
    }
    // Transform OBS to highlight the initial camera
    Promise.resolve().then(async () => {
      try {
        await applyTransformation("highlight", initialCamera);
      } catch (error) {
        console.error("Failed to switch OBS view:", error);
      }
    });
  }

  // Reset when overlay closes
  if (!open && isInitialized) {
    setIsInitialized(false);
  }

  const doubleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const swipeIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longSwipeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const swipeStartTimeRef = useRef<number>(0);

  // Camera navigation (up/down swipe)
  const navigateCamera = useCallback(
    async (direction: "next" | "prev") => {
      if (cameraList.length === 0) return;

      const currentIndex =
        cameraList.findIndex((cam) => cam === overlayCameraId) || 0;
      let newIndex: number;

      if (direction === "next") {
        newIndex = (currentIndex + 1) % cameraList.length;
      } else {
        newIndex =
          currentIndex === 0 ? cameraList.length - 1 : currentIndex - 1;
      }

      const newCamera = cameraList[newIndex];
      setOverlayCameraId(newCamera);
      selectCamera(newCamera);

      // Transform OBS to highlight the new camera
      try {
        await applyTransformation("highlight", newCamera);
      } catch (error) {
        console.error("Failed to switch OBS view:", error);
      }
    },
    [cameraList, overlayCameraId, selectCamera, applyTransformation]
  );

  // Show swipe indicator
  const showSwipeIndicator = useCallback((direction: string) => {
    setSwipeIndicator({ direction, show: true });

    if (swipeIndicatorTimeoutRef.current) {
      clearTimeout(swipeIndicatorTimeoutRef.current);
    }

    swipeIndicatorTimeoutRef.current = setTimeout(() => {
      setSwipeIndicator({ direction: "", show: false });
    }, 250);
  }, []);

  // Enhanced preset navigation
  const navigatePreset = useCallback(
    async (direction: "next" | "prev") => {
      if (!currentCameraData?.presets.length || !overlayCameraId) return;

      const currentIndex = currentCameraData.selectedPreset
        ? currentCameraData.presets.findIndex(
            (preset) => preset.Token === currentCameraData.selectedPreset
          )
        : -1;

      let newIndex: number;

      if (currentIndex === -1) {
        newIndex =
          direction === "next" ? 0 : currentCameraData.presets.length - 1;
      } else {
        if (direction === "next") {
          newIndex = (currentIndex + 1) % currentCameraData.presets.length;
        } else {
          newIndex =
            currentIndex === 0
              ? currentCameraData.presets.length - 1
              : currentIndex - 1;
        }
      }

      const newPreset = currentCameraData.presets[newIndex];
      await gotoPreset(overlayCameraId, newPreset.Token);
    },
    [currentCameraData, overlayCameraId, gotoPreset]
  );

  // Long swipe handler for continuous movement
  const handleLongSwipeStart = useCallback(
    (direction: string) => {
      if (
        cameraMode !== "move" ||
        !overlayCameraId ||
        isCameraMoving(overlayCameraId)
      )
        return;

      swipeStartTimeRef.current = Date.now();

      longSwipeTimeoutRef.current = setTimeout(async () => {
        showSwipeIndicator(direction);
        await startContinuousMove(
          overlayCameraId,
          direction as MovementDirection
        );
      }, 500);
    },
    [
      cameraMode,
      overlayCameraId,
      isCameraMoving,
      showSwipeIndicator,
      startContinuousMove,
    ]
  );

  const handleLongSwipeEnd = useCallback(
    async (direction?: string) => {
      if (!overlayCameraId || cameraMode !== "move") return;

      const swipeDuration = Date.now() - swipeStartTimeRef.current;

      if (longSwipeTimeoutRef.current) {
        clearTimeout(longSwipeTimeoutRef.current);
        longSwipeTimeoutRef.current = null;
      }

      if (isCameraMoving(overlayCameraId)) {
        await stopContinuousMove(overlayCameraId);
      } else if (swipeDuration < 500 && direction) {
        await moveCamera(overlayCameraId, direction as MovementDirection);
      }
    },
    [
      overlayCameraId,
      cameraMode,
      isCameraMoving,
      stopContinuousMove,
      moveCamera,
    ]
  );

  // Enhanced swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipeStart: (eventData) => {
      if (cameraMode === "move") {
        const { dir } = eventData;
        if (dir === "Up") handleLongSwipeStart("up");
        else if (dir === "Down") handleLongSwipeStart("down");
        else if (dir === "Left") handleLongSwipeStart("left");
        else if (dir === "Right") handleLongSwipeStart("right");
      }
    },
    onSwipedUp: () => {
      showSwipeIndicator("up");
      if (cameraMode === "normal") {
        navigateCamera("prev");
      } else {
        handleLongSwipeEnd("up");
      }
    },
    onSwipedDown: () => {
      showSwipeIndicator("down");
      if (cameraMode === "normal") {
        navigateCamera("next");
      } else {
        handleLongSwipeEnd("down");
      }
    },
    onSwipedLeft: () => {
      showSwipeIndicator("left");
      if (cameraMode === "normal") {
        navigatePreset("next");
      } else {
        handleLongSwipeEnd("left");
      }
    },
    onSwipedRight: () => {
      showSwipeIndicator("right");
      if (cameraMode === "normal") {
        navigatePreset("prev");
      } else {
        handleLongSwipeEnd("right");
      }
    },
    onTouchEndOrOnMouseUp: () => {
      if (cameraMode === "move") {
        handleLongSwipeEnd();
      }
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 30,
  });

  // Double tap handler
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();

    if (doubleTapTimeoutRef.current) {
      clearTimeout(doubleTapTimeoutRef.current);
      doubleTapTimeoutRef.current = null;
    }

    if (now - lastTap < 300) {
      setCameraMode((prev) => (prev === "normal" ? "move" : "normal"));
      setLastTap(0);
    } else {
      setLastTap(now);
      doubleTapTimeoutRef.current = setTimeout(() => {
        setLastTap(0);
      }, 300);
    }
  }, [lastTap]);

  // Slot machine effect helpers
  const getPresetSlots = useCallback(() => {
    if (!currentCameraData?.presets.length) {
      return { prev: null, current: null, next: null };
    }

    if (currentCameraData.presets.length === 1) {
      return {
        prev: null,
        current: currentCameraData.presets[0],
        next: null,
      };
    }

    const currentIndex = currentCameraData.selectedPreset
      ? currentCameraData.presets.findIndex(
          (preset) => preset.Token === currentCameraData.selectedPreset
        )
      : -1;

    if (currentIndex === -1) {
      // No preset selected, show first preset as current
      return {
        prev: currentCameraData.presets[currentCameraData.presets.length - 1],
        current: currentCameraData.presets[0],
        next: currentCameraData.presets[1] || currentCameraData.presets[0],
      };
    }

    const prevIndex =
      currentIndex === 0
        ? currentCameraData.presets.length - 1
        : currentIndex - 1;
    const nextIndex = (currentIndex + 1) % currentCameraData.presets.length;

    return {
      prev: currentCameraData.presets[prevIndex],
      current: currentCameraData.presets[currentIndex],
      next: currentCameraData.presets[nextIndex],
    };
  }, [currentCameraData]);

  const getCameraSlots = useCallback(() => {
    if (cameraList.length === 0)
      return { prev: null, current: null, next: null };

    const currentIndex =
      cameraList.findIndex((cam) => cam === overlayCameraId) || 0;
    const prevIndex =
      currentIndex === 0 ? cameraList.length - 1 : currentIndex - 1;
    const nextIndex = (currentIndex + 1) % cameraList.length;

    return {
      prev: cameraList[prevIndex],
      current: cameraList[currentIndex],
      next: cameraList[nextIndex],
    };
  }, [cameraList, overlayCameraId]);

  // Display name helpers
  const getPresetDisplayName = useCallback(
    (preset: { Name: string }) => {
      return (
        (overlayCameraId &&
          CAMERA_PRESETS.get(overlayCameraId)?.get(preset.Name)) ||
        preset.Name
      );
    },
    [overlayCameraId]
  );

  const getCameraDisplayName = useCallback(
    (cameraNickname: string) => {
      return (
        allCameras.find((cam) => cam.nickname === cameraNickname)?.nickname ||
        cameraNickname
      );
    },
    [allCameras]
  );

  // Help handlers
  const handleHelpClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      setHelpAnchorEl(event.currentTarget);
    },
    []
  );

  const handleHelpClose = useCallback(() => {
    setHelpAnchorEl(null);
  }, []);

  return {
    // State
    cameraMode,
    setCameraMode,
    swipeIndicator,
    helpAnchorEl,
    selectedCamera: overlayCameraId,
    cameraList,
    allCameras,

    // Camera control state from context
    presets: currentCameraData?.presets || [],
    selectedPreset: currentCameraData?.selectedPreset || null,
    loading: currentCameraData?.isLoading || false,
    error: currentCameraData?.error || null,
    isContinuousMoving: overlayCameraId
      ? isCameraMoving(overlayCameraId)
      : false,

    // Handlers
    swipeHandlers,
    handleDoubleTap,
    handleHelpClick,
    handleHelpClose,

    // Utilities
    getPresetSlots,
    getCameraSlots,
    getPresetDisplayName,
    getCameraDisplayName,
  };
};
