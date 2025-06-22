import type React from "react";
import { Stack, IconButton, Card, CardContent, Avatar } from "@mui/material";
import {
  ArrowBack,
  ArrowDownward,
  ArrowForward,
  ArrowUpward,
  Home,
} from "@mui/icons-material";
import { useMovementControls } from "../hooks";
import { MovementButton } from "./MovementButton";
import SkeletonLoader from "./SkeletonLoader";

const MovementControls: React.FC = () => {
  const {
    selectedCamera,
    loading,
    isMoving,
    handlePressStart,
    handlePressEnd,
    swipeHandlers,
  } = useMovementControls();

  return (
    <Card>
      <CardContent>
        {!selectedCamera ? (
          <SkeletonLoader variant="movement-controls" />
        ) : (
          <Stack alignItems="center" {...swipeHandlers}>
            {/* Up arrow */}
            <MovementButton
              direction="up"
              icon={<ArrowUpward />}
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
              disabled={loading}
              isMoving={isMoving}
            />

            {/* Left, Home, Right */}
            <Stack direction="row" alignItems="center">
              <MovementButton
                direction="left"
                icon={<ArrowBack />}
                onPressStart={handlePressStart}
                onPressEnd={handlePressEnd}
                disabled={loading}
                isMoving={isMoving}
              />

              <IconButton size="large" disabled>
                <Avatar sx={{ bgcolor: "primary.main" }}>
                  <Home />
                </Avatar>
              </IconButton>

              <MovementButton
                direction="right"
                icon={<ArrowForward />}
                onPressStart={handlePressStart}
                onPressEnd={handlePressEnd}
                disabled={loading}
                isMoving={isMoving}
              />
            </Stack>

            {/* Down arrow */}
            <MovementButton
              direction="down"
              icon={<ArrowDownward />}
              onPressStart={handlePressStart}
              onPressEnd={handlePressEnd}
              disabled={loading}
              isMoving={isMoving}
            />
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default MovementControls;
