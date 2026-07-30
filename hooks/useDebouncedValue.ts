"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value` delayed by `delayMs` so rapid input (e.g. search typing)
 * does not trigger a fetch on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timerId);
  }, [value, delayMs]);

  return debouncedValue;
}
