import type React from "react";
import {
  Select,
  MenuItem,
  Stack,
  Typography,
  FormControl,
  Card,
  CardContent,
} from "@mui/material";
import { Circle as CircleIcon } from "@mui/icons-material";
import { useCameraDataManagerContext } from "../contexts/CameraDataManagerContext";
import { useOBSControl } from "../hooks";

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

  const { switchStreamView } = useOBSControl();

  // Load cameras when component first renders
  if (allCameras.length === 0 && !isLoadingCameras) {
    loadCameraList();
  }

  const handleSelectChange = (event: { target: { value: unknown } }) => {
    const camera = event.target.value as string;
    const cameraData = allCameras.find((c) => c.nickname === camera);
    if (cameraData?.status === "online") {
      selectCamera(camera);
      switchStreamView("highlight", cameraData.nickname);
    }
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
              {allCameras.map((camera) => (
                <MenuItem
                  key={camera.nickname}
                  value={camera.nickname}
                  disabled={camera.status === "offline"}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
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
