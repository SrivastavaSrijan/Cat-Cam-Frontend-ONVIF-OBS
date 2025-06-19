import { useState, useCallback } from "react";

export interface NotificationState {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState | null>(
    null
  );

  const showNotification = useCallback(
    (message: string, type: NotificationState["type"] = "info") => {
      setNotification({ message, type });
    },
    []
  );

  const showSuccess = useCallback(
    (message: string) => {
      showNotification(message, "success");
    },
    [showNotification]
  );

  const showError = useCallback(
    (message: string) => {
      showNotification(message, "error");
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string) => {
      showNotification(message, "info");
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string) => {
      showNotification(message, "warning");
    },
    [showNotification]
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification,
  };
};
