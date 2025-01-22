import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren,
} from "react";
import { API_BASE_URL } from "../config";
import { fetchWrapper } from "./fetch";

interface SelectedCameraContextProps {
  selectedCamera: string;
  cameraList: string[];
  loading: boolean;
  handleCameraChange: (camera: string, onSuccess?: () => void) => Promise<void>;
}

const SelectedCameraContext = createContext<
  SelectedCameraContextProps | undefined
>(undefined);
const Provider = SelectedCameraContext.Provider;
export const SelectedCameraProvider = ({ children }: PropsWithChildren) => {
  const [cameraList] = useState(["Living Room Camera", "Room Camera"]);
  const [selectedCamera, setSelectedCamera] = useState<string | null>(
    cameraList[0]
  );
  const [loading, setLoading] = useState(false);

  const handleChange = async (newCamera: string, onSuccess?: () => void) => {
    setSelectedCamera(newCamera);
    setLoading(true);

    try {
      await fetchWrapper(`${API_BASE_URL}/ptz/switch_camera`, "POST", {
        nickname: newCamera,
      });
      setLoading(false);
      onSuccess && onSuccess();
    } catch (error) {
      setLoading(false);
      console.error("Failed to switch camera", error);
    }
  };

  return (
    <Provider
      value={{
        selectedCamera: selectedCamera || cameraList[1],
        handleCameraChange: handleChange,
        cameraList,
        loading,
      }}
    >
      {children}
    </Provider>
  );
};

export const useSelectedCamera = (): SelectedCameraContextProps => {
  const context = useContext(SelectedCameraContext);
  if (!context) {
    throw new Error(
      "useSelectedCamera must be used within a SelectedCameraProvider"
    );
  }
  return context;
};
