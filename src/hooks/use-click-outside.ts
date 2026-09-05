import { useEffect, useRef } from "react";

type RefObject<T> = React.RefObject<T | null>;
type Ref<T> = React.Ref<T | null>;

export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  options?: {
    enabled?: boolean;
    excludeRef?: RefObject<HTMLElement>;
  }
): RefObject<T> {
  const ref = useRef<T>(null);
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (options?.enabled === false) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) return;

      if (options?.excludeRef?.current?.contains(target)) return;

      handlerRef.current();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [options?.enabled, options?.excludeRef]);

  return ref;
}

export function useClickOutsideMultiple(
  handler: () => void,
  refs: React.RefObject<HTMLElement | null>[],
  options?: { enabled?: boolean }
): void {
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (options?.enabled === false) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isInside = refs.some((ref) => ref.current?.contains(target));
      if (!isInside) {
        handlerRef.current();
      }
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, options?.enabled]);
}
