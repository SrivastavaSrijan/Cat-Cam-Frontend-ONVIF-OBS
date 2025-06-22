import type React from "react";
import { Stack, IconButton, Card, CardContent, Avatar } from "@mui/material";
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
import SkeletonLoader from "./SkeletonLoader";

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
        {!selectedCamera ? (
          <SkeletonLoader variant="movement-controls" />
        ) : (
          <Stack spacing={1} alignItems="center">
            {/* Up arrow */}
            <IconButton
              onClick={() => handleMove("up")}
              color="primary"
              size="large"
              disabled={loading}
            >
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <ArrowUpward fontSize="inherit" />
              </Avatar>
            </IconButton>

            {/* Left, Home, Right */}
            <Stack direction="row" spacing={1} alignItems="center">
              <IconButton
                onClick={() => handleMove("left")}
                color="primary"
                size="large"
                disabled={loading}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <ArrowBack fontSize="inherit" />
                </Avatar>
              </IconButton>

              <IconButton size="large" disabled>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <Home fontSize="inherit" />
                </Avatar>
              </IconButton>

              <IconButton
                onClick={() => handleMove("right")}
                color="primary"
                size="large"
                disabled={loading}
              >
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <ArrowForward fontSize="inherit" />
                </Avatar>
              </IconButton>
            </Stack>

            {/* Down arrow */}
            <IconButton
              onClick={() => handleMove("down")}
              color="primary"
              size="large"
              disabled={loading}
            >
              <Avatar sx={{ bgcolor: "primary.main" }}>
                <ArrowDownward fontSize="inherit" />
              </Avatar>
            </IconButton>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default MovementControls;
