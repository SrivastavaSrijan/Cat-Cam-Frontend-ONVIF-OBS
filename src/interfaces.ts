export interface JoystickData {
  identifier: number;
  position: {
    x: number;
    y: number;
  };
  force: number;
  distance: number;
  pressure: number;
  angle: {
    radian: number;
    degree: number;
  };
  direction: {
    angle: string;
    x: string;
    y: string;
  };
  lockX: boolean;
  lockY: boolean;
  instance: {
    el: HTMLElement;
    on: Function;
    off: Function;
    show: Function;
    hide: Function;
    [key: string]: any;
  };
}

export interface GetSceneResponse {
  scenes: {
    name: string;
    obs_scene: string;
  }[];
}

// New interfaces for enhanced functionality
export interface PTZPosition {
  PanTilt: {
    x: number;
    y: number;
    space?: string;
  };
  Zoom: {
    x: number;
    space?: string;
  };
}

export interface MovementLimits {
  x_max: number;
  x_min: number;
  y_max: number;
  y_min: number;
  max_velocity: number;
}

export interface CameraStatus {
  PTZPosition: PTZPosition;
  limits: MovementLimits;
}

export interface CameraInfo {
  nickname: string;
  host: string;
  port: number;
  status: "online" | "offline" | "unknown";
  error?: string;
  limits?: MovementLimits;
  current_position?: PTZPosition;
  online?: boolean;
}

export interface ImagingSettings {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  ir_cut_filter?: string;
  video_source_token?: string;
}

export interface Preset {
  Name: string;
  Token: string;
  PTZPosition?: PTZPosition;
}

export interface MovementSpeed {
  panTilt: number;
  zoom: number;
}

export interface CameraListResponse {
  cameras: CameraInfo[];
}

export interface PresetListResponse {
  presets: Preset[];
}

export type MovementDirection = 
  | "up" 
  | "down" 
  | "left" 
  | "right" 
  | "upleft" 
  | "upright" 
  | "downleft" 
  | "downright"
  | "zoom_in"
  | "zoom_out";
