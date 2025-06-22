import type React from "react";
import { IconButton, Avatar } from "@mui/material";
import type { MovementDirection } from "../types/api";

interface MovementButtonProps {
  direction: MovementDirection;
  icon: React.ReactNode;
  onPressStart: (direction: MovementDirection) => void;
  onPressEnd: (direction?: MovementDirection) => void;
  disabled: boolean;
  isMoving: boolean;
  size?: "small" | "medium" | "large";
}

export const MovementButton: React.FC<MovementButtonProps> = ({
  direction,
  icon,
  onPressStart,
  onPressEnd,
  disabled,
  isMoving,
  size = "large",
}) => {
  return (
    <IconButton
      onMouseDown={() => onPressStart(direction)}
      onMouseUp={() => onPressEnd(direction)}
      onMouseLeave={() => onPressEnd()}
      onTouchStart={() => onPressStart(direction)}
      onTouchEnd={() => onPressEnd(direction)}
      color="primary"
      size={size}
      disabled={disabled}
      sx={{
        transform: isMoving ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.2s ease-in-out",
      }}
    >
      <Avatar
        sx={{
          bgcolor: isMoving ? "warning.main" : "primary.main",
          transition: "background-color 0.2s ease-in-out",
        }}
      >
        {icon}
      </Avatar>
    </IconButton>
  );
};
