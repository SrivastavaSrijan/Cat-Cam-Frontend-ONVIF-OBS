import React from "react";
import { Select, MenuItem, Box } from "@mui/material";
import { useSelectedCamera } from "../utils/useSelectedCamera";

interface CameraSelectorProps {}

const CameraSelector: React.FC<CameraSelectorProps> = () => {
  const { selectedCamera, handleCameraChange, cameraList } =
    useSelectedCamera();
  return (
    <Box sx={{ my: 2 }}>
      <Select
        value={selectedCamera}
        onChange={(e) => handleCameraChange(e.target?.value ?? "Room Camera")}
        fullWidth
        variant="outlined"
      >
        {cameraList.map((camera, index) => (
          <MenuItem key={index} value={camera}>
            {camera}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
};

export default CameraSelector;
