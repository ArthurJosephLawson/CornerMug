import { readJson, writeJson, type StorageLike } from "./storage";
import type { BadgeColor } from "./settings";

/**
 * Pomodoro study stats persisted to localStorage ("cornermug-stats").
 * Corrupt or missing data always falls back to empty history — never throws.
 */

export type PomodoroSession = {
  /** ISO timestamp of when the focus session started */
  startedAt: string;
  minutes: number;
  mode: "focus" | "break";
};

export type MugStats = {
  /** Consecutive days ending today with at least one focus session */
  streakDays: number;
  /** Minutes per day for the last 7 days, oldest → today */
  weeklyMinutes: number[];
  weeklyTotal: number;
  /** Minutes in the last 30 days */
  monthlyTotal: number;
  allTimeTotal: number;
};

export const BADGE_COLORS: BadgeColor[] = ["rust", "sage", "amber", "wood", "espresso"];

const STATS_KEY = "cornermug-stats";
const DAY_MS = 24 * 60 * 60 * 1000;

/** Local day index for a timestamp — day boundaries follow the user's timezone. */
function localDayIndex(ms: number): number {
  const d = new Date(ms);
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60 * 1000) / DAY_MS);
}

export function loadSessions(storage: StorageLike | null): PomodoroSession[] {
  const parsed = readJson<PomodoroSession[]>(storage, STATS_KEY);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(
    (s) =>
      s !== null &&
      typeof s === "object" &&
      typeof s.startedAt === "string" &&
      Number.isFinite(Date.parse(s.startedAt)) &&
      typeof s.minutes === "number" &&
      (s.mode === "focus" || s.mode === "break"),
  );
}

export function recordSession(session: PomodoroSession, storage: StorageLike | null): void {
  const sessions = loadSessions(storage);
  sessions.push(session);
  writeJson(storage, STATS_KEY, sessions);
}

export function computeStats(sessions: PomodoroSession[], nowMs: number): MugStats {
  const today = localDayIndex(nowMs);

  const weeklyMinutes = new Array<number>(7).fill(0);
  let weeklyTotal = 0;
  let monthlyTotal = 0;
  let allTimeTotal = 0;
  const focusDays = new Set<number>();

  for (const s of sessions) {
    if (s.mode !== "focus" || !(s.minutes > 0)) {
      continue;
    }
    const day = localDayIndex(Date.parse(s.startedAt));
    const minutes = s.minutes;
    allTimeTotal += minutes;
    focusDays.add(day);

    const ageDays = today - day;
    if (ageDays >= 0 && ageDays < 7) {
      weeklyMinutes[6 - ageDays] += minutes;
      weeklyTotal += minutes;
    }
    if (ageDays >= 0 && ageDays < 30) {
      monthlyTotal += minutes;
    }
  }

  // Consecutive focus days walking back from today.
  let streakDays = 0;
  while (focusDays.has(today - streakDays)) {
    streakDays += 1;
  }

  return {
    streakDays,
    weeklyMinutes,
    weeklyTotal,
    monthlyTotal,
    allTimeTotal,
  };
}
