import type React from "react";
import { Stack, IconButton, Card, CardContent } from "@mui/material";
import {
  ArrowBack,
  ArrowDownward,
  ArrowForward,
  ArrowUpward,
  Home,
} from "@mui/icons-material";
import { useAppContext } from "../contexts/AppContext";
import { useAutoDismissError } from "../hooks";
import type { MovementDirection } from "../types/api";

const MovementControls: React.FC = () => {
  const { selectedCamera, moveCamera, getCameraData } = useAppContext();
  const { setError } = useAutoDismissError();

  const cameraData = selectedCamera ? getCameraData(selectedCamera) : null;
  const loading = cameraData?.isLoading || false;

  const handleMove = async (direction: MovementDirection) => {
    if (!selectedCamera) return;

    try {
      await moveCamera(selectedCamera, direction);
    } catch (err) {
      console.error("Movement error:", err);
      setError("Failed to move camera.");
    }
  };

  return (
    <Card>
      <CardContent>
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
