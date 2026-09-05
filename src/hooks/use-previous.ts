import { useRef, useEffect, useState } from "react";

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export function useDeepCompareEffect(
  effect: React.EffectCallback,
  deps: unknown[]
): void {
  const prevDepsRef = useRef<unknown[]>(deps);
  const { current: prevDeps } = prevDepsRef;

  const hasChanged = deps.length !== prevDeps.length ||
    deps.some((dep, i) => !Object.is(dep, prevDeps[i]));

  useEffect(() => {
    if (hasChanged) {
      prevDepsRef.current = deps;
      return effect();
    }
  }, [hasChanged]);
}

export function useDeepCompareMemo<T>(factory: () => T, deps: unknown[]): T {
  const ref = useRef<{ deps: unknown[]; value: T }>({ deps, value: undefined as T });
  const { current } = ref;

  const hasChanged = deps.length !== current.deps.length ||
    deps.some((dep, i) => !Object.is(dep, current.deps[i]));

  if (hasChanged) {
    current.deps = deps;
    current.value = factory();
  }

  return current.value;
}

export function useIsFirstRender(): boolean {
  const isFirstRef = useRef(true);

  useEffect(() => {
    isFirstRef.current = false;
  }, []);

  return isFirstRef.current;
}

export function useIsMounted(): boolean {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  return isMounted;
}

export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

export function useMount(callback: () => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    callbackRef.current();
  }, []);
}

export function useUnmount(callback: () => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => callbackRef.current();
  }, []);
}

export function useUpdateEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    return effect();
  }, deps);
}

export function useRerender(): () => void {
  const [, setCount] = useState(0);
  return () => setCount((c) => c + 1);
}
