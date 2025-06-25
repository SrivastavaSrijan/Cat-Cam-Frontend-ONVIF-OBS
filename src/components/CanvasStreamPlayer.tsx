import type React from "react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useGesture } from "@use-gesture/react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import {
  ZoomIn,
  ZoomOut,
  RestartAlt,
  PictureInPictureAlt,
  Fullscreen,
  FullscreenExit,
  CameraAlt,
} from "@mui/icons-material";
import { useEventListener } from "../hooks/useEventListener";

/* ------------------------------------------------------------------ */
/* Types                                                             */
/* ------------------------------------------------------------------ */
export interface CanvasStreamPlayerRef {
  setSrc(src: string): void;
  getCanvas(): HTMLCanvasElement | null;
  togglePiP(): Promise<void>;
  toggleFullscreen(): Promise<void>;
  refreshStream?: () => Promise<void>;
}

export interface CanvasStreamPlayerProps {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  gesturesEnabled?: boolean;
  minZoom?: number;
  maxZoom?: number;
  showControls?: boolean;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  style?: React.CSSProperties;
  className?: string;
  onPipChange?: (inPip: boolean) => void;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onRefresh?: () => Promise<void>;
  onCameraOverlay?: () => void;
  showCameraControls?: boolean;
  error?: string | null;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const getDisplayedDims = (
  containerW: number,
  containerH: number,
  imgW: number,
  imgH: number
) => {
  if (!imgW || !imgH) return { dw: containerW, dh: containerH }; // fallback
  const containerAR = containerW / containerH;
  const imgAR = imgW / imgH;

  if (containerAR > imgAR) {
    // container wider ⇒ height clamps, width letter-boxes
    const dh = containerH;
    const dw = dh * imgAR;
    return { dw, dh };
  }
  const dw = containerW;
  const dh = dw / imgAR;
  return { dw, dh };
};

// Minimum canvas height we want to feed into PiP so the window isn't tiny
const MIN_PIP_HEIGHT = 720; // px
/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
const CanvasStreamPlayer = forwardRef<
  CanvasStreamPlayerRef,
  CanvasStreamPlayerProps
>(
  (
    {
      src,
      alt = "stream",
      width = "100%",
      height = 500,
      gesturesEnabled = true,
      minZoom = 1,
      maxZoom = 4,
      showControls = true,
      onError,
      style,
      className,
      onPipChange,
      onFullscreenChange,
      onRefresh,
      onCameraOverlay,
      showCameraControls = false,
      error,
    },
    ref
  ) => {
    /* -------------------------- Refs & State ------------------------- */
    const wrapperRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef = useRef<number>();
    const [transform, setTransform] = useState({ scale: minZoom, x: 0, y: 0 });
    const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
    const [inPip, setInPip] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    /* -------------------------- Imperative API ----------------------- */
    useImperativeHandle(
      ref,
      () => ({
        setSrc(newSrc) {
          if (imgRef.current) imgRef.current.src = newSrc;
        },
        getCanvas() {
          return canvasRef.current;
        },
        togglePiP,
        toggleFullscreen,
        refreshStream: onRefresh,
      }),
      [onRefresh]
    );

    /* -------------------------- Utils -------------------------------- */
    const getPanLimits = useCallback(
      (scale: number) => {
        const wrap = wrapperRef.current;
        if (!wrap) return { maxX: 0, maxY: 0 };

        const { width: cw, height: ch } = wrap.getBoundingClientRect();
        const { dw, dh } = getDisplayedDims(cw, ch, imgNatural.w, imgNatural.h);

        const contentW = dw * scale;
        const contentH = dh * scale;

        return {
          maxX: Math.max(0, (contentW - cw) / 2),
          maxY: Math.max(0, (contentH - ch) / 2),
        };
      },
      [imgNatural]
    );

    const transformRef = useRef(transform);
    const apply = useCallback(
      (next: { scale?: number; x?: number; y?: number }) => {
        setTransform((cur) => {
          const scale = clamp(next.scale ?? cur.scale, minZoom, maxZoom);
          const { maxX, maxY } = getPanLimits(scale);
          const styles = {
            scale,
            x: clamp(next.x ?? cur.x, -maxX, maxX),
            y: clamp(next.y ?? cur.y, -maxY, maxY),
          };
          transformRef.current = styles;
          return styles;
        });
      },
      [getPanLimits, maxZoom, minZoom]
    );

    /* -------------------------- Gesture handlers --------------------- */
    useGesture(
      {
        onPinch: ({ da: [d], origin: [ox, oy], memo }) => {
          if (!gesturesEnabled) return;
          const start = memo ?? transform.scale;
          const nextScale = clamp(start * d, minZoom, maxZoom);

          // keep pinch origin pinned
          const wrapper = wrapperRef.current;
          if (!wrapper) return;
          const rect = wrapper.getBoundingClientRect();
          const relX = ox - (rect.left + rect.width / 2);
          const relY = oy - (rect.top + rect.height / 2);
          const scaleRatio = nextScale / transform.scale;

          const nextX = transform.x - relX * (scaleRatio - 1);
          const nextY = transform.y - relY * (scaleRatio - 1);

          apply({ scale: nextScale, x: nextX, y: nextY });
          return start;
        },
        onDrag: ({ movement: [mx, my], memo, first, last }) => {
          if (!gesturesEnabled) return;

          // Only prevent drag when the content fully fits in both axes
          const wrap = wrapperRef.current;
          if (!wrap) return;
          const { width: cw, height: ch } = wrap.getBoundingClientRect();
          const { dw, dh } = getDisplayedDims(
            cw,
            ch,
            imgNatural.w,
            imgNatural.h
          );

          const contentW = dw * transform.scale;
          const contentH = dh * transform.scale;
          if (contentW <= cw && contentH <= ch) return;

          const start = first ? { sx: transform.x, sy: transform.y } : memo;
          apply({ x: start.sx + mx, y: start.sy + my });
          return start;
        },
        onWheel: ({ event }) => {
          if (!gesturesEnabled) return;
          event.preventDefault();
          const wrapper = wrapperRef.current;
          if (!wrapper) return;
          const rect = wrapper.getBoundingClientRect();
          const cx = event.clientX;
          const cy = event.clientY;
          const delta = event.deltaY < 0 ? 1.2 : 0.8;
          const nextScale = clamp(transform.scale * delta, minZoom, maxZoom);

          const relX = cx - (rect.left + rect.width / 2);
          const relY = cy - (rect.top + rect.height / 2);
          const scaleRatio = nextScale / transform.scale;

          const nextX = transform.x - relX * (scaleRatio - 1);
          const nextY = transform.y - relY * (scaleRatio - 1);

          apply({ scale: nextScale, x: nextX, y: nextY });
        },
        onDoubleClick: ({ event }) => {
          if (!gesturesEnabled) return;
          const zoomedIn = transform.scale > minZoom;
          zoomedIn
            ? apply({ scale: minZoom, x: 0, y: 0 })
            : apply({ scale: 2 });
        },
      },
      { target: wrapperRef, eventOptions: { passive: false } }
    );

    /* -------------------------- Buttons ------------------------------ */
    const zoomIn = () => {
      apply({ scale: transform.scale * 1.25 });
    };
    const zoomOut = () => {
      apply({ scale: transform.scale * 0.8 });
    };
    const reset = () => apply({ scale: minZoom, x: 0, y: 0 });

    /* -------------------------- PIP ---------------------------------- */
    const togglePiP = async () => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img) return;

      if (inPip && document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      // draw once to get aspect
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      let targetW = img.naturalWidth || 640;
      let targetH = img.naturalHeight || 360;

      // Upscale if the frame is too small – bigger input ⇒ bigger PiP window
      if (targetH < MIN_PIP_HEIGHT) {
        const ratio = MIN_PIP_HEIGHT / targetH;
        targetH = MIN_PIP_HEIGHT;
        targetW = Math.round(targetW * ratio);
      }

      canvas.width = targetW;
      canvas.height = targetH;
      if (wrapperRef.current) {
        // --- 2a: Draw letterboxed image to canvas using same logic as getDisplayedDims
        const { width: cw, height: ch } =
          wrapperRef.current.getBoundingClientRect();
        const { dw, dh } = getDisplayedDims(cw, ch, imgNatural.w, imgNatural.h);
        const scaleToCanvas = canvas.width / dw;

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scaleToCanvas, scaleToCanvas);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }

      const stream = canvas.captureStream(30);
      const vid = document.createElement("video");
      vid.srcObject = stream;
      vid.muted = true;
      await vid.play();
      await vid.requestPictureInPicture();

      const loop = () => {
        const pipElement = document.pictureInPictureElement;
        const wrapper = wrapperRef.current;
        if (!pipElement || !wrapper) {
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
          return;
        }

        // --- 2b: Draw with pan/zoom using letterboxed logic
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const t = transformRef.current;
        const { width: cw, height: ch } = wrapper.getBoundingClientRect();
        const { dw, dh } = getDisplayedDims(cw, ch, imgNatural.w, imgNatural.h);
        const scaleToCanvas = canvas.width / dw;

        const panX = t.x * scaleToCanvas;
        const panY = t.y * scaleToCanvas;

        ctx.translate(canvas.width / 2 + panX, canvas.height / 2 + panY);
        ctx.scale(t.scale * scaleToCanvas, t.scale * scaleToCanvas);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();

        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    };

    /* -------------------------- Fullscreen --------------------------- */
    const toggleFullscreen = async () => {
      if (!wrapperRef.current) return;

      try {
        if (!isFullscreen) {
          // Entering fullscreen
          if (wrapperRef.current.requestFullscreen) {
            await wrapperRef.current.requestFullscreen();
          }
          // Try to lock orientation to landscape on mobile (optional)
          // @ts-ignore - orientation lock API not fully supported in TypeScript
          if (window.screen?.orientation?.lock) {
            try {
              // @ts-ignore - orientation lock API not fully supported in TypeScript
              await window.screen.orientation.lock("landscape");
            } catch (orientationError) {
              console.log(
                "Orientation lock not supported or failed:",
                orientationError
              );
              // Don't treat this as an error - orientation lock is optional
            }
          }
        } else {
          // Exiting fullscreen
          if (document.exitFullscreen) {
            await document.exitFullscreen();
          }
          // Unlock orientation when exiting fullscreen
          // @ts-ignore - orientation lock API not fully supported in TypeScript
          if (window.screen?.orientation?.unlock) {
            try {
              window.screen.orientation.unlock();
            } catch (orientationError) {
              console.log("Orientation unlock failed:", orientationError);
              // Don't treat this as an error
            }
          }
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    };

    const handleFullscreenChange = useCallback(() => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          // @ts-ignore - for webkit browsers
          document.webkitFullscreenElement ||
          // @ts-ignore - for mozilla browsers
          document.mozFullScreenElement ||
          // @ts-ignore - for IE/Edge
          document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      onFullscreenChange?.(isCurrentlyFullscreen);
    }, [onFullscreenChange]);

    useEventListener("fullscreenchange", handleFullscreenChange, document);
    useEventListener(
      "webkitfullscreenchange",
      handleFullscreenChange,
      document
    );
    useEventListener("mozfullscreenchange", handleFullscreenChange, document);
    useEventListener("MSFullscreenChange", handleFullscreenChange, document);

    const handlePipChange = useCallback(() => {
      const pip = !!document.pictureInPictureElement;
      setInPip(pip);
      onPipChange?.(pip);
    }, [onPipChange]);

    useEventListener("enterpictureinpicture", handlePipChange, document);
    useEventListener("leavepictureinpicture", handlePipChange, document);

    /* -------------------------- Image load --------------------------- */
    useEffect(() => {
      const img = imgRef.current;
      if (!img) return;
      const handle = () =>
        setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      if (img.complete) handle();
      img.addEventListener("load", handle);
      return () => img.removeEventListener("load", handle);
    }, []);

    /* ------------------------------------------------------------------ */
    /* Re-clamp x/y whenever the wrapper is resized                       */
    /* ------------------------------------------------------------------ */
    useEffect(() => {
      const wrap = wrapperRef.current;
      if (!wrap) return;

      // Whenever size changes, just re-apply the current transform —
      // `apply({})` re-clamps x & y against the new pan limits.
      const ro = new ResizeObserver(() => apply({}));
      ro.observe(wrap);

      return () => ro.disconnect();
    }, [apply]);

    /* -------------------------- Render ------------------------------- */
    const { scale, x, y } = transform;
    const isZoomed = scale > minZoom;

    return (
      <Box
        ref={wrapperRef}
        sx={{
          position: "relative",
          width,
          height,
          overflow: "hidden",
          backgroundColor: "black",
          touchAction: gesturesEnabled ? "none" : "auto",
          userSelect: "none",
          cursor: gesturesEnabled ? (isZoomed ? "grab" : "zoom-in") : "default",
          "&:active": {
            cursor: gesturesEnabled && isZoomed ? "grabbing" : undefined,
          },
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        }}
        className={className}
      >
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <img
          ref={imgRef}
          src={src}
          alt={alt}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transform: `translate3d(${x}px, ${y}px,0) scale(${scale})`,
            transformOrigin: "center center",
            pointerEvents: "none",
            imageRendering: "auto",
            display: "block",
          }}
          onError={onError}
          crossOrigin="anonymous"
        />

        {/* Error overlay */}
        {error && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Typography variant="body2" color="white" textAlign="center">
                {error}
              </Typography>
              {onRefresh && (
                <Tooltip title="Refresh Stream">
                  <IconButton onClick={onRefresh} size="large">
                    <RestartAlt />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Box>
        )}

        {/* Zoom controls */}
        {showControls && gesturesEnabled && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              borderRadius: 1,
              zIndex: 10,
            }}
          >
            <Tooltip title="Zoom In">
              <IconButton
                size="medium"
                onClick={zoomIn}
                disabled={scale >= maxZoom}
              >
                <ZoomIn />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton
                size="medium"
                onClick={zoomOut}
                disabled={scale <= minZoom}
              >
                <ZoomOut />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <IconButton size="medium" onClick={reset} disabled={!isZoomed}>
                <RestartAlt />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Main controls (bottom right) */}
        {showControls && (
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              display: "flex",
              gap: 1,
              borderRadius: 1,
              zIndex: 10,
            }}
          >
            {"pictureInPictureEnabled" in document && (
              <Tooltip
                title={inPip ? "Exit Picture‑in‑Picture" : "Picture‑in‑Picture"}
              >
                <IconButton size="large" onClick={togglePiP}>
                  <PictureInPictureAlt />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton size="large" onClick={toggleFullscreen}>
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Tooltip>
            {showCameraControls && onCameraOverlay && (
              <Tooltip title="Camera Controls">
                <IconButton size="large" onClick={onCameraOverlay}>
                  <CameraAlt />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}

        {/* Zoom level indicator */}
        {showControls && isZoomed && (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: 16,
              borderRadius: 1,
              px: 2,
              py: 1,
              zIndex: 10,
            }}
          >
            <Typography variant="caption" color="white">
              {Math.round(scale * 100)}%
            </Typography>
          </Box>
        )}
      </Box>
    );
  }
);

export default CanvasStreamPlayer;
