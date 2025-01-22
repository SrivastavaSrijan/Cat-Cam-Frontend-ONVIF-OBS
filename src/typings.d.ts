declare module "react-nipple" {
  import { CSSProperties } from "react";

  interface NippleOptions {
    zone?: HTMLElement;
    color?: string;
    size?: number;
    threshold?: number;
    fadeTime?: number;
    multitouch?: boolean;
    maxNumberOfNipples?: number;
    mode?: "static" | "dynamic" | "semi";
    restJoystick?: boolean;
    restOpacity?: number;
    catchDistance?: number;
    lockX?: boolean;
    lockY?: boolean;
    dataOnly?: boolean;
    position?: { top: string | number; left: string | number };
    shape?: "circle" | "square";
    dynamicPage?: boolean;
    follow?: boolean;
  }

  interface NippleProps {
    options?: NippleOptions;
    style?: CSSProperties;
    onStart?: (evt: any, data: JoystickData) => void;
    onEnd?: (evt: any, data: JoystickData) => void;
    onMove?: (evt: any, data: JoystickData) => void;
    onPressure?: (evt: any, data: JoystickData) => void;
  }

  const Nipple: React.FC<NippleProps>;

  export default Nipple;
}
