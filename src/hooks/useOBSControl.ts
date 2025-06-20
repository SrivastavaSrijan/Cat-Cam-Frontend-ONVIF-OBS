import { useState, useCallback } from "react";
import { useApi } from "./useApi";
import { useNotification } from "./useNotification";
import { useLoading } from "./useLoading";
import { useCameraDataManagerContext } from "../contexts/CameraDataManagerContext";
import type { StreamView } from "./useCameraDataManager";

export const useOBSControl = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { loading, withLoading } = useLoading();
  const { showError, showSuccess } = useNotification();
  const api = useApi();

  const { selectStreamView } = useCameraDataManagerContext();

  const switchStreamView = useCallback(
    async (view: StreamView["layout_mode"], activeCamera?: string) => {
      try {
        if (view === "highlight" && activeCamera) {
          await withLoading(() => api.obsTransform("highlight", activeCamera));
          showSuccess(`Switched to highlight view for ${activeCamera}`);
          selectStreamView({
            layout_mode: "highlight",
            highlighted_source: activeCamera,
          });
        } else if (view === "grid") {
          await withLoading(() => api.obsTransform("grid"));
          selectStreamView({
            layout_mode: "grid",
          });
          showSuccess("Switched to mosaic view");
        }
      } catch (error) {
        showError(
          "OBS connection lost. Use the floating action button to reconnect."
        );
      }
    },
    [withLoading, showSuccess, selectStreamView, api, showError]
  );

  const switchScene = useCallback(
    async (sceneName: string) => {
      try {
        await withLoading(() => api.obsSwitchScene(sceneName));
        showSuccess(`Switched to scene: ${sceneName}`);
      } catch (error) {
        showError(`Failed to switch to scene: ${sceneName}`);
      }
    },
    [withLoading, api, showSuccess, showError]
  );

  const reconnect = useCallback(async () => {
    try {
      await withLoading(() => api.obsReconnect());
      showSuccess("Successfully reconnected to OBS");
    } catch (error) {
      showError("Failed to reconnect to OBS");
    }
  }, [withLoading, api, showSuccess, showError]);

  const refreshStreams = useCallback(async () => {
    try {
      setIsRefreshing(true);
      // Switch to "Please Wait" scene
      await api.obsSwitchScene("Please Wait");

      // Wait 5 seconds then switch back to Mosaic
      setTimeout(async () => {
        try {
          await api.obsSwitchScene("grid");
          showSuccess("RTSP streams refreshed successfully");
        } catch (error) {
          showError("Failed to complete stream refresh");
        } finally {
          setIsRefreshing(false);
        }
      }, 5000);
    } catch (error) {
      showError("Failed to refresh streams");
    }
  }, [api, showSuccess, showError]);

  return {
    isRefreshing,
    loading,
    switchStreamView,
    switchScene,
    reconnect,
    refreshStreams,
  };
};
