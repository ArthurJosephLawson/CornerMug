import { useCallback, useEffect, useRef, useState } from 'react';

export type PomodoroMode = 'focus' | 'break';

export interface UsePomodoroOptions {
  focusMinutes?: number;
  breakMinutes?: number;
  onFocusComplete?: (minutes: number) => void;
}

export interface PomodoroTimerState {
  mode: PomodoroMode;
  secondsLeft: number;
  running: boolean;
  completedFocusSessions: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

export function usePomodoroTimer(options: UsePomodoroOptions = {}): PomodoroTimerState {
  const focusMinutes = options.focusMinutes ?? 25;
  const breakMinutes = options.breakMinutes ?? 5;

  const [mode, setMode] = useState<PomodoroMode>('focus');
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [completedFocusSessions, setCompletedFocusSessions] = useState(0);
  const onFocusCompleteRef = useRef(options.onFocusComplete);

  useEffect(() => {
    onFocusCompleteRef.current = options.onFocusComplete;
  }, [options.onFocusComplete]);

  const durationFor = useCallback(
    (nextMode: PomodoroMode) => (nextMode === 'focus' ? focusMinutes : breakMinutes) * 60,
    [focusMinutes, breakMinutes],
  );

  const switchMode = useCallback(
    (nextMode: PomodoroMode) => {
      setMode(nextMode);
      setSecondsLeft(durationFor(nextMode));
      setRunning(false);
    },
    [durationFor],
  );

  const skip = useCallback(() => {
    switchMode(mode === 'focus' ? 'break' : 'focus');
  }, [mode, switchMode]);

  const reset = useCallback(() => {
    setRunning(false);
    setSecondsLeft(durationFor(mode));
  }, [durationFor, mode]);

  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (!running || secondsLeft > 0) return;
    if (mode === 'focus') {
      setCompletedFocusSessions((count) => count + 1);
      onFocusCompleteRef.current?.(focusMinutes);
    }
    switchMode(mode === 'focus' ? 'break' : 'focus');
  }, [running, secondsLeft, mode, focusMinutes, switchMode]);

  return {
    mode,
    secondsLeft,
    running,
    completedFocusSessions,
    start: () => setRunning(true),
    pause: () => setRunning(false),
    reset,
    skip,
  };
}