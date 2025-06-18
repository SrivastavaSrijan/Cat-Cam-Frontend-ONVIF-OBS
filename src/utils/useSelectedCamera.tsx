import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type PropsWithChildren,
} from "react";
import { API_BASE_URL, CAMERA_ENDPOINTS } from "../config";
import { fetchWrapper } from "./fetch";

interface CameraInfo {
  nickname: string;
  host: string;
  port: number;
  status: "online" | "offline";
  error?: string;
}

interface SelectedCameraContextType {
  selectedCamera: string | null;
  cameraList: string[]; // Only online cameras
  allCameras: CameraInfo[]; // All cameras with status
  onlineCameraCount: number;
  totalCameraCount: number;
  handleCameraChange: (camera: string) => void;
  isLoading: boolean;
}

const SelectedCameraContext = createContext<
  SelectedCameraContextType | undefined
>(undefined);
const Provider = SelectedCameraContext.Provider;
export const SelectedCameraProvider = ({ children }: PropsWithChildren) => {
  const [selectedCamera, setSelectedCameraState] = useState<string | null>(
    null
  );
  const [cameraList, setCameraList] = useState<string[]>([]);
  const [allCameras, setAllCameras] = useState<CameraInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleCameraChange = useCallback((camera: string) => {
    console.log("Camera changed to:", camera);
    setSelectedCameraState(camera);
  }, []);

  // Fetch camera list on mount with retry logic
  useEffect(() => {
    const fetchCameras = async (retryCount = 0) => {
      setIsLoading(true);

      await fetchWrapper(
        `${API_BASE_URL}${CAMERA_ENDPOINTS.CAMERAS}`,
        "GET",
        undefined,
        (data: { cameras: CameraInfo[] }) => {
          const cameras = data.cameras || [];
          const onlineCameras = cameras
            .filter((camera) => camera.status === "online")
            .map((camera) => camera.nickname);

          setAllCameras(cameras);
          setCameraList(onlineCameras);
          setIsLoading(false);

          console.log(
            `Found ${cameras.length} total cameras, ${onlineCameras.length} online:`,
            cameras
          );
        },
        (error) => {
          console.error("Failed to fetch cameras:", error);
          setIsLoading(false);

          // Retry up to 3 times with exponential backoff
          if (retryCount < 3) {
            const delay = 2 ** retryCount * 1000; // 1s, 2s, 4s
            console.log(`Retrying camera fetch in ${delay}ms...`);
            setTimeout(() => fetchCameras(retryCount + 1), delay);
          } else {
            setAllCameras([]);
            setCameraList([]);
            console.error("Failed to fetch cameras after 3 retries");
          }
        }
      );
    };

    fetchCameras();
  }, []);

  const contextValue: SelectedCameraContextType = {
    selectedCamera,
    cameraList,
    allCameras,
    onlineCameraCount: cameraList.length,
    totalCameraCount: allCameras.length,
    handleCameraChange,
    isLoading,
  };

  return <Provider value={contextValue}>{children}</Provider>;
};

export const useSelectedCamera = (): SelectedCameraContextType => {
  const context = useContext(SelectedCameraContext);
  if (!context) {
    throw new Error(
      "useSelectedCamera must be used within a SelectedCameraProvider"
    );
  }
  return context;
};
