import type React from "react";
import { createContext, useContext, type PropsWithChildren } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useNotification, type NotificationState } from "../hooks";

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationState["type"]) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showWarning: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const {
    notification,
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    clearNotification,
  } = useNotification();

  const contextValue: NotificationContextType = {
    showNotification,
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={4000}
        onClose={clearNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          severity={notification?.type || "info"}
          onClose={clearNotification}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotificationContext must be used within a NotificationProvider"
    );
  }
  return context;
};
