import { useState, useCallback, useRef, useEffect } from "react";

export function useToggle(
  initialValue = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);

  return [value, toggle, setValue];
}

export function useCounter(
  initialValue = 0,
  options?: { min?: number; max?: number; step?: number }
): {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
} {
  const [count, setCount] = useState(initialValue);
  const min = options?.min ?? -Infinity;
  const max = options?.max ?? Infinity;
  const step = options?.step ?? 1;

  const increment = useCallback(() => {
    setCount((c) => Math.min(c + step, max));
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount((c) => Math.max(c - step, min));
  }, [step, min]);

  const reset = useCallback(() => setCount(initialValue), [initialValue]);

  const set = useCallback(
    (value: number) => setCount(Math.max(min, Math.min(max, value))),
    [min, max]
  );

  return { count, increment, decrement, reset, set };
}

export function useBoolean(
  initialValue = false
): {
  value: boolean;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
} {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    setTrue: useCallback(() => setValue(true), []),
    setFalse: useCallback(() => setValue(false), []),
    toggle: useCallback(() => setValue((v) => !v), []),
  };
}

export function useMap<K, V>(
  initialEntries?: [K, V][]
): {
  map: Map<K, V>;
  set: (key: K, value: V) => void;
  setAll: (entries: [K, V][]) => void;
  get: (key: K) => V | undefined;
  has: (key: K) => boolean;
  delete: (key: K) => void;
  clear: () => void;
  entries: [K, V][];
  keys: K[];
  values: V[];
  size: number;
} {
  const [map, setMap] = useState(new Map<K, V>(initialEntries));

  const set = useCallback((key: K, value: V) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.set(key, value);
      return next;
    });
  }, []);

  const setAll = useCallback((entries: [K, V][]) => {
    setMap(new Map(entries));
  }, []);

  const get = useCallback((key: K) => map.get(key), [map]);

  const has = useCallback((key: K) => map.has(key), [map]);

  const deleteEntry = useCallback((key: K) => {
    setMap((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const clear = useCallback(() => setMap(new Map()), []);

  return {
    map,
    set,
    setAll,
    get,
    has,
    delete: deleteEntry,
    clear,
    entries: Array.from(map.entries()),
    keys: Array.from(map.keys()),
    values: Array.from(map.values()),
    size: map.size,
  };
}

export function useSet<T>(initialValues?: T[]): {
  set: Set<T>;
  add: (value: T) => void;
  remove: (value: T) => void;
  toggle: (value: T) => void;
  has: (value: T) => boolean;
  clear: () => void;
  values: T[];
  size: number;
} {
  const [set, setSet] = useState(new Set<T>(initialValues));

  const add = useCallback((value: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.add(value);
      return next;
    });
  }, []);

  const remove = useCallback((value: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      next.delete(value);
      return next;
    });
  }, []);

  const toggle = useCallback((value: T) => {
    setSet((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }, []);

  const has = useCallback((value: T) => set.has(value), [set]);
  const clear = useCallback(() => setSet(new Set()), []);

  return {
    set,
    add,
    remove,
    toggle,
    has,
    clear,
    values: Array.from(set),
    size: set.size,
  };
}

export function useArray<T>(initialArray: T[] = []): {
  array: T[];
  push: (...items: T[]) => void;
  pop: () => T | undefined;
  shift: () => T | undefined;
  unshift: (...items: T[]) => void;
  remove: (index: number) => void;
  removeById: (id: T) => void;
  insertAt: (index: number, ...items: T[]) => void;
  clear: () => void;
  updateAt: (index: number, item: T) => void;
  find: (predicate: (item: T) => boolean) => T | undefined;
  filter: (predicate: (item: T) => boolean) => T[];
  map: <U>(mapper: (item: T, index: number) => U) => U[];
  sort: (compareFn?: (a: T, b: T) => number) => void;
  reverse: () => void;
  size: number;
} {
  const [array, setArray] = useState<T[]>(initialArray);

  const push = useCallback((...items: T[]) => {
    setArray((prev) => [...prev, ...items]);
  }, []);

  const pop = useCallback(() => {
    let removed: T | undefined;
    setArray((prev) => {
      const next = [...prev];
      removed = next.pop();
      return next;
    });
    return removed;
  }, []);

  const shift = useCallback(() => {
    let removed: T | undefined;
    setArray((prev) => {
      const next = [...prev];
      removed = next.shift();
      return next;
    });
    return removed;
  }, []);

  const unshift = useCallback((...items: T[]) => {
    setArray((prev) => [...items, ...prev]);
  }, []);

  const remove = useCallback((index: number) => {
    setArray((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const removeById = useCallback((id: T) => {
    setArray((prev) => prev.filter((item) => item !== id));
  }, []);

  const insertAt = useCallback((index: number, ...items: T[]) => {
    setArray((prev) => [...prev.slice(0, index), ...items, ...prev.slice(index)]);
  }, []);

  const clear = useCallback(() => setArray([]), []);

  const updateAt = useCallback((index: number, item: T) => {
    setArray((prev) => prev.map((v, i) => (i === index ? item : v)));
  }, []);

  const find = useCallback((predicate: (item: T) => boolean) => array.find(predicate), [array]);
  const filter = useCallback((predicate: (item: T) => boolean) => array.filter(predicate), [array]);
  const map = useCallback(
    <U>(mapper: (item: T, index: number) => U) => array.map(mapper),
    [array]
  );
  const sort = useCallback((compareFn?: (a: T, b: T) => number) => {
    setArray((prev) => [...prev].sort(compareFn));
  }, []);
  const reverse = useCallback(() => {
    setArray((prev) => [...prev].reverse());
  }, []);

  return {
    array,
    push,
    pop,
    shift,
    unshift,
    remove,
    removeById,
    insertAt,
    clear,
    updateAt,
    find,
    filter,
    map,
    sort,
    reverse,
    size: array.length,
  };
}
