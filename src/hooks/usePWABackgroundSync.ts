import { useCallback, useState } from "react";
import { useInterval } from "react-use";
import { useEventListener } from "./useEventListener";
import { useStream } from "./useStream";
import { useAppContext } from "../contexts/AppContext";
import { APP_CONFIG } from "../config";

// Clean page visibility hook using our existing useEventListener
const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);

  useEventListener(
    "visibilitychange",
    () => {
      setIsVisible(!document.hidden);
    },
    document
  );

  return isVisible;
};

/**
 * Hook to manage PWA background sync behavior
 * Handles stream management and camera data refresh when app goes to background/foreground
 */
export const usePWABackgroundSync = () => {
  const isVisible = usePageVisibility();
  const { startStream, getStatus } = useStream();
  const { setStreamURL, isStreaming, setIsStreaming, loadCameraList } =
    useAppContext();

  // Function to start stream and set URL
  const startStreamAndSetURL = useCallback(async () => {
    try {
      console.log("[Background] Starting MJPEG stream...");
      await startStream();
      const response = await getStatus();
      if (response?.stream_url) {
        setStreamURL(response.stream_url);
        setIsStreaming(true);
        console.log("[Background] MJPEG stream started successfully");
      }
    } catch (error) {
      console.error("[Background] Failed to start stream:", error);
    }
  }, [startStream, getStatus, setStreamURL, setIsStreaming]);

  // Background tasks
  const executeBackgroundTasks = useCallback(async () => {
    console.log("[Background] Executing background tasks...");

    const tasks = [];

    // Task 1: Refresh camera list
    tasks.push(
      (async () => {
        try {
          await loadCameraList();
        } catch (error) {
          console.error("[Background] Camera list refresh failed:", error);
        }
      })()
    );

    // Task 2: Start stream if not running
    if (!isStreaming) {
      tasks.push(
        (async () => {
          try {
            await startStreamAndSetURL();
          } catch (error) {
            console.error("[Background] Stream start failed:", error);
          }
        })()
      );
    }

    // Execute all tasks in parallel
    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  }, [loadCameraList, isStreaming, startStreamAndSetURL]);

  // Handle visibility changes - when app goes to background/foreground
  useEventListener(
    "visibilitychange",
    async () => {
      if (!document.hidden) {
        console.log("[Background] App returned to foreground");
        try {
          await loadCameraList();
        } catch (error) {
          console.error("[Background] Foreground refresh failed:", error);
        }
      } else {
        console.log("[Background] App went to background");
        await executeBackgroundTasks();
      }
    },
    document
  );

  useInterval(executeBackgroundTasks, APP_CONFIG.BACKGROUND_REFRESH_INTERVAL);

  return { isVisible };
};
