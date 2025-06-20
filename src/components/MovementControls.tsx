import type React from "react";
import {
  Stack,
  IconButton,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack,
  ArrowDownward,
  ArrowForward,
  ArrowUpward,
  Home,
} from "@mui/icons-material";
import { useCameraDataManagerContext } from "../contexts/CameraDataManagerContext";
import { useAutoDismissError, useCameraControl } from "../hooks";

const MovementControls: React.FC = () => {
  const { selectedCamera } = useCameraDataManagerContext();
  const { setError } = useAutoDismissError();
  const { loading, moveCamera } = useCameraControl(selectedCamera);

  const handleMove = async (direction: string) => {
    if (!selectedCamera) return;

    try {
      await moveCamera(direction);
    } catch (err) {
      console.error("Movement error:", err);
      setError("Failed to move camera.");
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Camera Controls
        </Typography>
        <Stack spacing={1} alignItems="center">
          {/* Up arrow */}
          <IconButton
            onClick={() => handleMove("up")}
            color="primary"
            size="large"
            disabled={loading}
          >
            <ArrowUpward />
          </IconButton>

          {/* Left, Home, Right */}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton
              onClick={() => handleMove("left")}
              color="primary"
              size="large"
              disabled={loading}
            >
              <ArrowBack />
            </IconButton>

            <IconButton size="large" disabled>
              <Home />
            </IconButton>

            <IconButton
              onClick={() => handleMove("right")}
              color="primary"
              size="large"
              disabled={loading}
            >
              <ArrowForward />
            </IconButton>
          </Stack>

          {/* Down arrow */}
          <IconButton
            onClick={() => handleMove("down")}
            color="primary"
            size="large"
            disabled={loading}
          >
            <ArrowDownward />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default MovementControls;
