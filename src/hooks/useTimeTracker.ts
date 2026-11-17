import { useCallback, useEffect, useState } from 'react';

/** Counts whole seconds while `active` is true. */
export function useTimeTracker(active: boolean) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [active]);

  const reset = useCallback(() => setElapsedSeconds(0), []);

  return { elapsedSeconds, reset };
}