import { useState, useCallback, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { useCameraControl } from "./useCameraControl";
import { useAppContext } from "../contexts/AppContext";
import { useOBSControl } from "./useOBSControl";
import { CAMERA_PRESETS } from "../utils/contants";

export type CameraMode = "normal" | "move";

export const useCameraOverlay = (open: boolean) => {
  const {
    selectedCamera,
    cameraList,
    allCameras,
    selectCamera,
    loadCameraList,
    isLoadingCameras,
  } = useAppContext();
  const { switchStreamView } = useOBSControl();

  // Initialize overlay camera - use selected camera or first available
  const [overlayCameraId, setOverlayCameraId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use overlay camera for camera control
  const cameraControl = useCameraControl(overlayCameraId);

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
        await switchStreamView("highlight", initialCamera);
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
        await switchStreamView("highlight", newCamera);
      } catch (error) {
        console.error("Failed to switch OBS view:", error);
      }
    },
    [cameraList, overlayCameraId, selectCamera, switchStreamView]
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
      if (cameraControl.presets.length === 0 || !overlayCameraId) return;

      const currentIndex = cameraControl.selectedPreset
        ? cameraControl.presets.findIndex(
            (preset) => preset.Token === cameraControl.selectedPreset
          )
        : -1;

      let newIndex: number;

      if (currentIndex === -1) {
        newIndex = direction === "next" ? 0 : cameraControl.presets.length - 1;
      } else {
        if (direction === "next") {
          newIndex = (currentIndex + 1) % cameraControl.presets.length;
        } else {
          newIndex =
            currentIndex === 0
              ? cameraControl.presets.length - 1
              : currentIndex - 1;
        }
      }

      const newPreset = cameraControl.presets[newIndex];
      await cameraControl.gotoPreset(newPreset.Token);
    },
    [cameraControl, overlayCameraId]
  );

  // Long swipe handler for continuous movement
  const handleLongSwipeStart = useCallback(
    (direction: string) => {
      if (
        cameraMode !== "move" ||
        !overlayCameraId ||
        cameraControl.isContinuousMoving
      )
        return;

      swipeStartTimeRef.current = Date.now();

      longSwipeTimeoutRef.current = setTimeout(async () => {
        showSwipeIndicator(direction);
        await cameraControl.startContinuousMove(direction);
      }, 500);
    },
    [cameraMode, overlayCameraId, cameraControl, showSwipeIndicator]
  );

  const handleLongSwipeEnd = useCallback(
    async (direction?: string) => {
      if (!overlayCameraId || cameraMode !== "move") return;

      const swipeDuration = Date.now() - swipeStartTimeRef.current;

      if (longSwipeTimeoutRef.current) {
        clearTimeout(longSwipeTimeoutRef.current);
        longSwipeTimeoutRef.current = null;
      }

      if (cameraControl.isContinuousMoving) {
        await cameraControl.stopContinuousMove();
      } else if (swipeDuration < 500 && direction) {
        await cameraControl.moveCamera(direction);
      }
    },
    [overlayCameraId, cameraMode, cameraControl]
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
    if (cameraControl.presets.length === 0) {
      return { prev: null, current: null, next: null };
    }

    if (cameraControl.presets.length === 1) {
      return {
        prev: null,
        current: cameraControl.presets[0],
        next: null,
      };
    }

    const currentIndex = cameraControl.selectedPreset
      ? cameraControl.presets.findIndex(
          (preset) => preset.Token === cameraControl.selectedPreset
        )
      : -1;

    if (currentIndex === -1) {
      // No preset selected, show first preset as current
      return {
        prev: cameraControl.presets[cameraControl.presets.length - 1],
        current: cameraControl.presets[0],
        next: cameraControl.presets[1] || cameraControl.presets[0],
      };
    }

    const prevIndex =
      currentIndex === 0 ? cameraControl.presets.length - 1 : currentIndex - 1;
    const nextIndex = (currentIndex + 1) % cameraControl.presets.length;

    return {
      prev: cameraControl.presets[prevIndex],
      current: cameraControl.presets[currentIndex],
      next: cameraControl.presets[nextIndex],
    };
  }, [cameraControl.presets, cameraControl.selectedPreset]);

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

    // Camera control
    ...cameraControl,

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
