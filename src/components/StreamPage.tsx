import type React from "react";
import { useState } from "react";
import { Box } from "@mui/material";
import MjpegPlayer from "./MjpegPlayer";
import CameraOverlay from "./CameraOverlay";

const StreamPage: React.FC = () => {
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);

  const handleOpenCameraOverlay = () => {
    setShowCameraOverlay(true);
  };

  const handleCloseCameraOverlay = () => {
    setShowCameraOverlay(false);
  };

  return (
    <Box>
      <MjpegPlayer
        title="Security Camera Stream"
        width="100%"
        height={500}
        autoPlay={true}
        controls={true}
        onCameraOverlay={handleOpenCameraOverlay}
      />

      <CameraOverlay
        open={showCameraOverlay}
        onClose={handleCloseCameraOverlay}
        orientation="auto" // This will auto-detect orientation
      />
    </Box>
  );
};

export default StreamPage;
