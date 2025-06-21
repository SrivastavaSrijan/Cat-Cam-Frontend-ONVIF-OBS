import { createContext, useContext, type PropsWithChildren } from "react";
import { useAppData, type CameraData } from "../hooks/useApp";

type AppContextType = ReturnType<typeof useAppData>;

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: PropsWithChildren) => {
  const dataManager = useAppData();

  return (
    <AppContext.Provider value={dataManager}>{children}</AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within a AppProvider");
  }
  return context;
};

export type { CameraData };
