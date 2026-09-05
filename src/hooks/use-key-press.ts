import { useEffect, useRef, useCallback, useState } from "react";

export interface UseKeyPressOptions {
  target?: EventTarget | null;
  enabled?: boolean;
  useCapture?: boolean;
}

export function useKeyPress(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options?: UseKeyPressOptions
): void {
  const handlerRef = useRef(handler);
  const { target = typeof document !== "undefined" ? document : null, enabled = true, useCapture = true } = options ?? {};

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !target) return;

    const listener = (event: KeyboardEvent) => {
      if (event.key === key) {
        handlerRef.current(event);
      }
    };

    target.addEventListener("keydown", listener, useCapture);
    return () => target.removeEventListener("keydown", listener, useCapture);
  }, [key, target, enabled, useCapture]);
}

export function useKeyDown(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options?: UseKeyPressOptions
): void {
  useKeyPress(key, handler, options);
}

export function useKeyUp(
  key: string,
  handler: (event: KeyboardEvent) => void,
  options?: UseKeyPressOptions
): void {
  const handlerRef = useRef(handler);
  const { target = typeof document !== "undefined" ? document : null, enabled = true, useCapture = true } = options ?? {};

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !target) return;

    const listener = (event: KeyboardEvent) => {
      if (event.key === key) {
        handlerRef.current(event);
      }
    };

    target.addEventListener("keyup", listener, useCapture);
    return () => target.removeEventListener("keyup", listener, useCapture);
  }, [key, target, enabled, useCapture]);
}

export function useHotkeys(
  hotkeys: Array<{ key: string; handler: (event: KeyboardEvent) => void; modifiers?: string[] }>,
  options?: UseKeyPressOptions
): void {
  const hotkeysRef = useRef(hotkeys);
  const { target = typeof document !== "undefined" ? document : null, enabled = true, useCapture = true } = options ?? {};

  useEffect(() => {
    hotkeysRef.current = hotkeys;
  }, [hotkeys]);

  useEffect(() => {
    if (!enabled || !target) return;

    const listener = (event: KeyboardEvent) => {
      for (const hotkey of hotkeysRef.current) {
        const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase();
        if (!keyMatch) continue;

        const modifiersMatch = hotkey.modifiers?.every((mod) => {
          switch (mod.toLowerCase()) {
            case "ctrl":
            case "control":
              return event.ctrlKey;
            case "shift":
              return event.shiftKey;
            case "alt":
              return event.altKey;
            case "meta":
            case "cmd":
            case "command":
              return event.metaKey;
            default:
              return true;
          }
        });

        if (hotkey.modifiers ? modifiersMatch : true) {
          event.preventDefault();
          hotkey.handler(event);
          return;
        }
      }
    };

    target.addEventListener("keydown", listener, useCapture);
    return () => target.removeEventListener("keydown", listener, useCapture);
  }, [target, enabled, useCapture]);
}

export function useKeyboardCombination(
  combination: string,
  handler: (event: KeyboardEvent) => void,
  options?: UseKeyPressOptions
): void {
  const parts = combination.toLowerCase().split("+").map((s) => s.trim());
  const key = parts[parts.length - 1]!;
  const modifiers = parts.slice(0, -1);

  useHotkeys([{ key, handler, modifiers }], options);
}

export function useIsComposing(): boolean {
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleCompositionStart = () => setIsComposing(true);
    const handleCompositionEnd = () => setIsComposing(false);

    document.addEventListener("compositionstart", handleCompositionStart);
    document.addEventListener("compositionend", handleCompositionEnd);

    return () => {
      document.removeEventListener("compositionstart", handleCompositionStart);
      document.removeEventListener("compositionend", handleCompositionEnd);
    };
  }, []);

  return isComposing;
}
