import { useEffect, useRef } from "react";

type EventMap = WindowEventMap &
  HTMLElementEventMap &
  DocumentEventMap & {
    webkitfullscreenchange: Event;
    mozfullscreenchange: Event;
    MSFullscreenChange: Event;
    enterpictureinpicture: Event;
    leavepictureinpicture: Event;
  };

export function useEventListener<
  T extends HTMLElement | Document | Window = Window,
  K extends keyof EventMap = keyof WindowEventMap
>(
  eventName: K,
  handler: (event: EventMap[K]) => void,
  element?: React.RefObject<T | null> | T | null,
  options?: boolean | AddEventListenerOptions,
  enabled = true
) {
  // Create a ref that stores the handler
  const savedHandler = useRef(handler);

  // Update ref.current value if handler changes
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // Skip if disabled
    if (!enabled) {
      return;
    }

    // Define the target element
    const targetElement = element
      ? "current" in element
        ? element.current
        : element
      : window;

    if (!targetElement?.addEventListener) {
      return;
    }

    // Create event listener that calls handler function stored in ref
    const eventListener = (event: Event) =>
      savedHandler.current(event as EventMap[K]);

    targetElement.addEventListener(eventName, eventListener, options);

    // Remove event listener on cleanup
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options, enabled]);
}
