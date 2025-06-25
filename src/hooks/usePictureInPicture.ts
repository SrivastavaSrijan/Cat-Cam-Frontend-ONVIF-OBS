import { useState, useCallback, useRef, useEffect } from "react";

interface UsePictureInPictureOptions {
  /** Whether PIP is enabled */
  enabled?: boolean;
  /** Callback when PIP mode changes */
  onPipChange?: (isInPip: boolean) => void;
}

interface UsePictureInPictureReturn {
  /** Whether currently in PIP mode */
  isInPip: boolean;
  /** Whether PIP is supported by the browser */
  isPipSupported: boolean;
  /** Enter PIP mode */
  enterPip: () => Promise<void>;
  /** Exit PIP mode */
  exitPip: () => Promise<void>;
  /** Toggle PIP mode */
  togglePip: () => Promise<void>;
  /** Ref to attach to video/canvas element */
  pipElementRef: React.RefObject<HTMLVideoElement | HTMLCanvasElement>;
}

export const usePictureInPicture = ({
  enabled = true,
  onPipChange,
}: UsePictureInPictureOptions = {}): UsePictureInPictureReturn => {
  const [isInPip, setIsInPip] = useState(false);
  const pipElementRef = useRef<HTMLVideoElement | HTMLCanvasElement>(null);

  // Check if PIP is supported
  const isPipSupported = "pictureInPictureEnabled" in document;

  const enterPip = useCallback(async () => {
    if (!enabled || !isPipSupported || !pipElementRef.current) {
      throw new Error("Picture-in-Picture not supported or not enabled");
    }

    try {
      const element = pipElementRef.current;
      if ("requestPictureInPicture" in element) {
        await (element as HTMLVideoElement).requestPictureInPicture();
      }
    } catch (error) {
      console.error("Failed to enter Picture-in-Picture mode:", error);
      throw error;
    }
  }, [enabled, isPipSupported]);

  const exitPip = useCallback(async () => {
    if (!document.pictureInPictureElement) return;

    try {
      await document.exitPictureInPicture();
    } catch (error) {
      console.error("Failed to exit Picture-in-Picture mode:", error);
      throw error;
    }
  }, []);

  const togglePip = useCallback(async () => {
    if (isInPip) {
      await exitPip();
    } else {
      await enterPip();
    }
  }, [isInPip, enterPip, exitPip]);

  // Listen for PIP events
  useEffect(() => {
    const element = pipElementRef.current;
    if (!element || !isPipSupported) return;

    const handleEnterPip = () => {
      setIsInPip(true);
      onPipChange?.(true);
    };

    const handleLeavePip = () => {
      setIsInPip(false);
      onPipChange?.(false);
    };

    element.addEventListener("enterpictureinpicture", handleEnterPip);
    element.addEventListener("leavepictureinpicture", handleLeavePip);

    return () => {
      element.removeEventListener("enterpictureinpicture", handleEnterPip);
      element.removeEventListener("leavepictureinpicture", handleLeavePip);
    };
  }, [isPipSupported, onPipChange]);

  // Check current PIP state
  useEffect(() => {
    const checkPipState = () => {
      const inPip = document.pictureInPictureElement === pipElementRef.current;
      if (inPip !== isInPip) {
        setIsInPip(inPip);
        onPipChange?.(inPip);
      }
    };

    // Check initially and on visibility change
    checkPipState();
    document.addEventListener("visibilitychange", checkPipState);

    return () => {
      document.removeEventListener("visibilitychange", checkPipState);
    };
  }, [isInPip, onPipChange]);

  return {
    isInPip,
    isPipSupported,
    enterPip,
    exitPip,
    togglePip,
    pipElementRef,
  };
};
