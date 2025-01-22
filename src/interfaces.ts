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
