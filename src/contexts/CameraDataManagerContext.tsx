import { createContext, useContext, type PropsWithChildren } from "react";
import {
  useCameraDataManager,
  type CameraData,
} from "../hooks/useCameraDataManager";

type CameraDataManagerContextType = ReturnType<typeof useCameraDataManager>;

const CameraDataManagerContext = createContext<
  CameraDataManagerContextType | undefined
>(undefined);

export const CameraDataManagerProvider = ({ children }: PropsWithChildren) => {
  const dataManager = useCameraDataManager();

  return (
    <CameraDataManagerContext.Provider value={dataManager}>
      {children}
    </CameraDataManagerContext.Provider>
  );
};

export const useCameraDataManagerContext = (): CameraDataManagerContextType => {
  const context = useContext(CameraDataManagerContext);
  if (!context) {
    throw new Error(
      "useCameraDataManagerContext must be used within a CameraDataManagerProvider"
    );
  }
  return context;
};

export type { CameraData };
