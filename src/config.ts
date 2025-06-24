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
  WAIT: "Please Wait!",
  MAIN: "Mosaic",
};
