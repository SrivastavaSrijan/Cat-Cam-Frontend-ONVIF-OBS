import type React from "react";
import { useState } from "react";
import Player from "./Player";
import ControllerOverlay from "./ControllerOverlay";

interface PlayerWithControllerProps {
  title?: string;
  width?: number | string;
  height?: number | string;
  autoPlay?: boolean;
  controls?: boolean;
  onCameraOverlay?: () => void;
}

const PlayerWithController: React.FC<PlayerWithControllerProps> = ({
  title = "SSV Cam",
  height = 200,
  autoPlay = true,
  controls = true,
  onCameraOverlay,
  ...props
}) => {
  const [overlayOpen, setOverlayOpen] = useState(false);

  const handleOverlayOpen = () => {
    setOverlayOpen(true);
    onCameraOverlay?.();
  };

  const handleOverlayClose = () => {
    setOverlayOpen(false);
  };

  return (
    <Player
      title={title}
      height={height}
      autoPlay={autoPlay}
      controls={controls}
      onCameraOverlay={handleOverlayOpen}
      overlayOpen={overlayOpen}
      onOverlayClose={handleOverlayClose}
      OverlayComponent={ControllerOverlay}
      isOverlayMode={true} // Always use overlay mode for this component
      {...props}
    />
  );
};

export default PlayerWithController;
