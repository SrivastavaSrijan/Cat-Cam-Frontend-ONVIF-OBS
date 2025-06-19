import type React from "react";
import {
  Select,
  MenuItem,
  Stack,
  Typography,
  FormControl,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  Videocam,
  VideocamOff,
  Circle as CircleIcon,
} from "@mui/icons-material";
import { useCameraDataManagerContext } from "../contexts/CameraDataManagerContext";

const CameraSelector: React.FC = () => {
  const {
    selectedCamera,
    allCameras,
    onlineCameraCount,
    totalCameraCount,
    selectCamera,
    loadCameraList,
    isLoadingCameras,
  } = useCameraDataManagerContext();

  // Load cameras when component first renders
  if (allCameras.length === 0 && !isLoadingCameras) {
    loadCameraList();
  }

  const handleSelectChange = (event: { target: { value: unknown } }) => {
    const camera = event.target.value as string;
    const cameraData = allCameras.find((c) => c.nickname === camera);
    if (cameraData?.status === "online") {
      selectCamera(camera);
    }
  };

  const getCameraIcon = (status: string) => {
    return status === "online" ? (
      <Videocam color="success" />
    ) : (
      <VideocamOff color="error" />
    );
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="subtitle2" color="text.secondary">
              Select Camera
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CircleIcon
                fontSize="small"
                color={onlineCameraCount > 0 ? "success" : "error"}
              />
              <Typography variant="caption" color="text.secondary">
                {onlineCameraCount}/{totalCameraCount} online
              </Typography>
            </Stack>
          </Stack>

          <FormControl fullWidth>
            <Select
              size="small"
              value={selectedCamera || ""}
              onChange={handleSelectChange}
              displayEmpty
            >
              <MenuItem value="" disabled>
                <Typography color="text.secondary">
                  Choose a camera...
                </Typography>
              </MenuItem>
              {allCameras.map((camera) => (
                <MenuItem
                  key={camera.nickname}
                  value={camera.nickname}
                  disabled={camera.status === "offline"}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    {getCameraIcon(camera.status)}
                    <Typography fontSize="small">{camera.nickname}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CameraSelector;
