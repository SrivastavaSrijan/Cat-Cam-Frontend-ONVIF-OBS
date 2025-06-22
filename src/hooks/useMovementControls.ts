import { useRef, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { useAppContext } from "../contexts/AppContext";
import { useAutoDismissError } from "./useAutoDismissError";
import type { MovementDirection } from "../types/api";

export const useMovementControls = () => {
  const {
    selectedCamera,
    moveCamera,
    getCameraData,
    startContinuousMove,
    stopContinuousMove,
    isCameraMoving,
  } = useAppContext();
  const { setError } = useAutoDismissError();

  const cameraData = selectedCamera ? getCameraData(selectedCamera) : null;
  const loading = cameraData?.isLoading || false;
  const isMoving = selectedCamera ? isCameraMoving(selectedCamera) : false;

  // Long press handling
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);

  const handlePressStart = useCallback(
    (direction: MovementDirection) => {
      if (!selectedCamera || isMoving) return;

      pressStartTimeRef.current = Date.now();

      // Start long press timer (500ms)
      longPressTimeoutRef.current = setTimeout(async () => {
        try {
          await startContinuousMove(selectedCamera, direction);
        } catch (err) {
          console.error("Continuous movement error:", err);
          setError("Failed to start continuous movement.");
        }
      }, 500);
    },
    [selectedCamera, isMoving, startContinuousMove, setError]
  );

  const handlePressEnd = useCallback(
    async (direction?: MovementDirection) => {
      if (!selectedCamera) return;

      const pressDuration = Date.now() - pressStartTimeRef.current;

      // Clear long press timer
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }

      if (isMoving) {
        // Stop continuous movement
        try {
          await stopContinuousMove(selectedCamera);
        } catch (err) {
          console.error("Stop movement error:", err);
          setError("Failed to stop movement.");
        }
      } else if (pressDuration < 500 && direction) {
        // Short press - single move
        try {
          await moveCamera(selectedCamera, direction);
        } catch (err) {
          console.error("Movement error:", err);
          setError("Failed to move camera.");
        }
      }
    },
    [selectedCamera, isMoving, stopContinuousMove, moveCamera, setError]
  );

  // Enhanced swipe handlers using react-swipeable
  const swipeHandlers = useSwipeable({
    onSwipeStart: (eventData) => {
      const { dir } = eventData;
      if (dir === "Up") handlePressStart("up");
      else if (dir === "Down") handlePressStart("down");
      else if (dir === "Left") handlePressStart("left");
      else if (dir === "Right") handlePressStart("right");
    },
    onSwipedUp: () => handlePressEnd("up"),
    onSwipedDown: () => handlePressEnd("down"),
    onSwipedLeft: () => handlePressEnd("left"),
    onSwipedRight: () => handlePressEnd("right"),
    onTouchEndOrOnMouseUp: () => handlePressEnd(),
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 30,
  });

  return {
    selectedCamera,
    loading,
    isMoving,
    handlePressStart,
    handlePressEnd,
    swipeHandlers,
  };
};
