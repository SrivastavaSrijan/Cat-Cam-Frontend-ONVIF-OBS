import React, { useState } from "react";
import Nipple from "react-nipple";
import {
  Box,
  Typography,
  Alert,
  debounce,
  CircularProgress,
  Stack,
} from "@mui/material";
import "react-nipple/lib/styles.css"; // Import nipple styles
import { fetchWrapper } from "../utils/fetch";
import { API_BASE_URL } from "../config";
import { useSelectedCamera } from "../utils/useSelectedCamera";
import { JoystickData } from "../interfaces";

interface MovementControlsProps {}

const debouncedMove = debounce(
  async (
    camera: string,
    movement: string,
    onSuccess: () => void,
    onError: () => void
  ) => {
    if (!movement || !camera) return;
    await fetchWrapper(
      `${API_BASE_URL}/ptz/move?nickname=${camera}`,
      "POST",
      {
        camera,
        direction: movement,
      },
      onSuccess
    );
  },
  300
);
const MovementControls: React.FC<MovementControlsProps> = () => {
  const [movement, setMovement] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { selectedCamera } = useSelectedCamera();

  const handleNippleMove = (evt: any, data: JoystickData) => {
    if (data && data.direction && data.direction.angle) {
      const { angle } = data.direction;
      let direction: string | null = null;

      switch (angle) {
        case "up":
          direction = "up";
          break;
        case "down":
          direction = "down";
          break;
        case "left":
          direction = "left";
          break;
        case "right":
          direction = "right";
          break;
        case "up-left":
          direction = "upleft";
          break;
        case "up-right":
          direction = "upright";
          break;
        case "down-left":
          direction = "downleft";
          break;
        case "down-right":
          direction = "downright";
          break;
        default:
          break;
      }

      if (direction) {
        setError(null);
        setMovement(direction);
        debouncedMove(
          selectedCamera || "",
          direction,
          () => {
            setMovement(null);
          },
          () => setError("Failed to move the camera")
        );
      }
    }
  };

  return (
    <Stack alignItems="center">
      <Stack
        justifyContent="space-between"
        direction="row"
        gap={2}
        alignItems="center"
      >
        <Typography variant="h6">Movement Controls</Typography>
        <CircularProgress
          sx={{ visibility: movement ? "initial" : "hidden" }}
          color="primary"
          size={16}
        />
      </Stack>
      {error && <Alert severity="error">{error}</Alert>}
      <Box
        sx={{
          width: 150,
          height: 150,
          backgroundColor: "#282c34",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mt: 2,
        }}
      >
        <Nipple
          options={{
            mode: "semi",
            color: "#90caf9",
            size: 100,
            restJoystick: true,
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
          onMove={handleNippleMove}
        />
      </Box>
    </Stack>
  );
};

export default MovementControls;
