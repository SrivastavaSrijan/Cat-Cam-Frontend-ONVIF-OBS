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
import { useAppContext } from "../contexts/AppContext";
import { useOBSControl } from "../hooks";

const CameraSelector: React.FC = () => {
  const {
    selectedCamera,
    allCameras,
    selectCamera,
    loadCameraList,
    isLoadingCameras,
  } = useAppContext();

  const { applyTransformation } = useOBSControl();

  // Load cameras when component first renders
  if (allCameras.length === 0 && !isLoadingCameras) {
    loadCameraList();
  }

  const handleSelectChange = (event: { target: { value: unknown } }) => {
    const camera = event.target.value as string;
    const cameraData = allCameras.find((c) => c.nickname === camera);
    if (cameraData?.status === "online") {
      selectCamera(camera);
      applyTransformation("highlight", cameraData.nickname);
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
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
