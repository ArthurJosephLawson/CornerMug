import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/context/AuthContext';
import { showToast } from '@/hooks/useToast';
import { recordFocusSession } from '@/services/statsService';

export type PomodoroMode = 'focus' | 'break';

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

const FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
const STORAGE_KEY = 'cornermug.pomodoro';

interface StoredTimer {
  mode: PomodoroMode;
  remainingSeconds: number;
  /** Epoch ms when the current phase ends, or null while paused. */
  endsAt: number | null;
  completedFocusSessions: number;
}

function durationFor(mode: PomodoroMode): number {
  return (mode === 'focus' ? FOCUS_MINUTES : BREAK_MINUTES) * 60;
}

function readStoredTimer(): StoredTimer | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredTimer>;
    if (parsed.mode !== 'focus' && parsed.mode !== 'break') return null;
    const endsAt = typeof parsed.endsAt === 'number' ? parsed.endsAt : null;
    const remaining = Number(parsed.remainingSeconds);
    return {
      mode: parsed.mode,
      remainingSeconds: Number.isFinite(remaining)
        ? Math.max(0, Math.min(remaining, durationFor(parsed.mode)))
        : durationFor(parsed.mode),
      endsAt,
      completedFocusSessions: Math.max(0, Number(parsed.completedFocusSessions ?? 0)),
    };
  } catch {
    return null;
  }
}

function writeStoredTimer(timer: StoredTimer): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
  } catch {
    // Session storage can be unavailable; the timer still runs in memory.
  }
}

function initialTimer(): StoredTimer {
  const stored = readStoredTimer();
  if (!stored) {
    return {
      mode: 'focus',
      remainingSeconds: durationFor('focus'),
      endsAt: null,
      completedFocusSessions: 0,
    };
  }
  if (stored.endsAt !== null) {
    // Reloaded mid-phase: resume from the wall clock instead of restarting.
    return {
      ...stored,
      remainingSeconds: Math.max(0, Math.ceil((stored.endsAt - Date.now()) / 1000)),
    };
  }
  return stored;
}

const PomodoroContext = createContext<PomodoroTimerState | null>(null);

/**
 * App-level focus timer. State lives in sessionStorage, so signing in/out or
 * walking between rooms never resets it, while closing the tab clears it.
 * Focus completions are recorded here, independent of the current route.
 */
export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [timer, setTimer] = useState<StoredTimer>(initialTimer);
  const recordedSessionsRef = useRef(timer.completedFocusSessions);
  const profileId = profile?.id ?? '';

  useEffect(() => {
    writeStoredTimer(timer);
  }, [timer]);

  useEffect(() => {
    if (timer.endsAt === null) return;

    const tick = () => {
      setTimer((current) => {
        if (current.endsAt === null) return current;
        const remaining = Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000));
        if (remaining > 0) {
          if (remaining === current.remainingSeconds) return current;
          return { ...current, remainingSeconds: remaining };
        }

        const wasFocus = current.mode === 'focus';
        const nextMode: PomodoroMode = wasFocus ? 'break' : 'focus';
        return {
          mode: nextMode,
          remainingSeconds: durationFor(nextMode),
          endsAt: null,
          completedFocusSessions: current.completedFocusSessions + (wasFocus ? 1 : 0),
        };
      });
    };

    tick();
    const interval = window.setInterval(tick, 500);
    return () => window.clearInterval(interval);
  }, [timer.endsAt]);

  useEffect(() => {
    if (timer.completedFocusSessions <= recordedSessionsRef.current) return;
    recordedSessionsRef.current = timer.completedFocusSessions;
    if (!profileId) return;
    void recordFocusSession(profileId, FOCUS_MINUTES)
      .then(() => showToast(`Focus session saved: ${FOCUS_MINUTES} minutes.`, 'success'))
      .catch(() => showToast('Focus finished, but study stats could not be saved yet.', 'error'));
  }, [timer.completedFocusSessions, profileId]);

  const start = useCallback(() => {
    setTimer((current) => {
      if (current.endsAt !== null) return current;
      const seconds = current.remainingSeconds > 0 ? current.remainingSeconds : durationFor(current.mode);
      return {
        ...current,
        remainingSeconds: seconds,
        endsAt: Date.now() + seconds * 1000,
      };
    });
  }, []);

  const pause = useCallback(() => {
    setTimer((current) => {
      if (current.endsAt === null) return current;
      return {
        ...current,
        remainingSeconds: Math.max(0, Math.ceil((current.endsAt - Date.now()) / 1000)),
        endsAt: null,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setTimer((current) => ({
      ...current,
      remainingSeconds: durationFor(current.mode),
      endsAt: null,
    }));
  }, []);

  const skip = useCallback(() => {
    setTimer((current) => {
      const nextMode: PomodoroMode = current.mode === 'focus' ? 'break' : 'focus';
      return {
        ...current,
        mode: nextMode,
        remainingSeconds: durationFor(nextMode),
        endsAt: null,
      };
    });
  }, []);

  const value = useMemo<PomodoroTimerState>(
    () => ({
      mode: timer.mode,
      secondsLeft: timer.remainingSeconds,
      running: timer.endsAt !== null,
      completedFocusSessions: timer.completedFocusSessions,
      start,
      pause,
      reset,
      skip,
    }),
    [timer.mode, timer.remainingSeconds, timer.endsAt, timer.completedFocusSessions, start, pause, reset, skip],
  );

  return <PomodoroContext.Provider value={value}>{children}</PomodoroContext.Provider>;
}

export function usePomodoro(): PomodoroTimerState {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error('usePomodoro must be used inside PomodoroProvider');
  return context;
}
