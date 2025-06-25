import type { SxProps } from "@mui/material";

export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  "https://ssvcam.srijansrivastava.com/api";

export const MJPEG_BASE_URL =
  process.env.REACT_APP_MJPEG_BASE_URL ||
  "https://ssvcam.srijansrivastava.com/stream";

export const WEBSOCKET_URL = API_BASE_URL.replace(/:\d+$/, ":3333").replace(
  "http",
  "ws"
);

export const APP_CONFIG = {
  BACKGROUND_REFRESH_INTERVAL: 30000, // 30 seconds
};

export const CAMERA_ENDPOINTS = {
  STATUS: "/ptz/status",
  MOVE: "/ptz/move",
  PRESETS: "/ptz/presets",
  GOTO_PRESET: "/ptz/goto_preset",
  SWITCH_CAMERA: "/ptz/switch_camera",
  MOVEMENT_SPEED: "/ptz/movement_speed",
  IMAGING: "/ptz/imaging",
  NIGHT_MODE: "/ptz/night_mode",
  CAMERAS: "/ptz/cameras",
  CONTINUOUS_MOVE: "/ptz/continuous_move",
  STOP: "/ptz/stop",
  MOVEMENT_STATUS: "/ptz/movement_status",
  REINITIALIZE: "/ptz/reinitialize",
} as const;

export const OBS_ENDPOINTS = {
  SCENES: "/obs/scenes",
  CURRENT_SCENE: "/obs/current_scene",
  SWITCH_SCENE: "/obs/switch_scene",
  TRANSFORM: "/obs/transform",
  CURRENT_TRANSFORMATION: "/obs/current_transformation",
  RECONNECT: "/obs/reconnect",
  MJPEG_STREAM: "/mjpeg",
  VIRTUAL_CAMERA: {
    START: "/obs/virtual_camera/start",
    STOP: "/obs/virtual_camera/stop",
    STATUS: "/obs/virtual_camera/status",
  },
  PROJECTOR: {
    START: "/obs/projector/start",
    CLOSE: "/obs/projector/close",
  },
} as const;

export const MJPEG_ENDPOINTS = {
  HEALTH: "/health",
  STATUS: "/status",
  START: "/start",
  STOP: "/stop",
  STREAM: "/stream",
} as const;

export const SOURCE_NAMES = {
  WAIT: "Please Wait",
  MAIN: "Mosaic",
};

export const PLAYER_CONFIG = {
  ASPECT_RATIO: 16 / 9,
  HEIGHT: 500,
  PLACEHOLDER:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz48L3N2Zz4=",
  MIN_PIP_HEIGHT: 720, // px
  MIN_ZOOM: 1,
  MAX_ZOOM: 4,
  PINCH_SENSITIVITY: 0.1,
  CONTROLS_STYLES: {
    position: "absolute",
    zIndex: 10,
    backdropFilter: "blur(4px)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: 8,
    px: 1,
    py: 0.5,
  } satisfies SxProps,
};

// Styling constants for consistency
export const OVERLAY_STYLES = {
  text: {
    primary: {
      textShadow: "3px 3px 6px rgba(0,0,0,0.9)",
      filter: "drop-shadow(0 0 12px rgba(255,255,255,0.4))",
    },

    muted: {
      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      filter: "drop-shadow(0 0 6px rgba(255,255,255,0.3))",
      fontWeight: 300,
    },
  },
  background: {
    overlay: "transparent",
    standalone: "rgba(0, 0, 0, 0.95)",
  },
} as const;
