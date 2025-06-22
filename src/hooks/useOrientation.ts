import { useState, useEffect } from "react";

// Add orientation detection hook
export const useOrientation = (
  forcedOrientation?: "portrait" | "landscape" | "auto"
) => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    "portrait"
  );

  useEffect(() => {
    if (forcedOrientation && forcedOrientation !== "auto") {
      setOrientation(forcedOrientation);
      return;
    }

    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      const screenOrientation = window.screen?.orientation?.type;
      const isScreenLandscape = screenOrientation?.includes("landscape");

      const finalOrientation =
        isScreenLandscape !== undefined
          ? isScreenLandscape
            ? "landscape"
            : "portrait"
          : isLandscape
          ? "landscape"
          : "portrait";

      setOrientation(finalOrientation);
    };

    handleOrientationChange();
    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, [forcedOrientation]);

  return orientation;
};
