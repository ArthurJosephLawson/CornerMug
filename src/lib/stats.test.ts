import { beforeEach, describe, expect, it } from "vitest";
import {
  loadSessions,
  recordSession,
  computeStats,
  BADGE_COLORS,
} from "./stats";
import type { PomodoroSession } from "./stats";
import type { StorageLike } from "./storage";

function memStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

// Fixed "today": Wed 2026-11-11 12:00 UTC
const NOW = Date.parse("2026-11-11T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;
const dayAt = (daysAgo: number, hour = 10) =>
  new Date(NOW - daysAgo * DAY + (hour - 12) * 60 * 60 * 1000).toISOString();

describe("recordSession + loadSessions", () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = memStorage();
  });

  it("starts empty", () => {
    expect(loadSessions(storage)).toEqual([]);
  });

  it("roundtrips a recorded session", () => {
    const session: PomodoroSession = { startedAt: dayAt(0), minutes: 25, mode: "focus" };
    recordSession(session, storage);
    expect(loadSessions(storage)).toEqual([session]);
  });

  it("survives corrupt stored data", () => {
    recordSession({ startedAt: dayAt(0), minutes: 25, mode: "focus" }, storage);
    storage.setItem("cornermug-stats", "{corrupt");
    expect(loadSessions(storage)).toEqual([]);
  });
});

describe("computeStats", () => {
  it("is NaN-free with zero sessions", () => {
    const stats = computeStats([], NOW);
    expect(stats.streakDays).toBe(0);
    expect(stats.weeklyMinutes).toEqual([0, 0, 0, 0, 0, 0, 0]);
    expect(stats.weeklyTotal).toBe(0);
    expect(stats.monthlyTotal).toBe(0);
    expect(stats.allTimeTotal).toBe(0);
  });

  it("buckets weekly minutes oldest → today", () => {
    const sessions: PomodoroSession[] = [
      { startedAt: dayAt(6), minutes: 25, mode: "focus" },
      { startedAt: dayAt(0), minutes: 50, mode: "focus" },
    ];
    const stats = computeStats(sessions, NOW);
    expect(stats.weeklyMinutes[0]).toBe(25);
    expect(stats.weeklyMinutes[6]).toBe(50);
    expect(stats.weeklyTotal).toBe(75);
  });

  it("streak counts consecutive days ending today", () => {
    const sessions: PomodoroSession[] = [
      { startedAt: dayAt(2), minutes: 25, mode: "focus" },
      { startedAt: dayAt(1), minutes: 25, mode: "focus" },
      { startedAt: dayAt(0), minutes: 25, mode: "focus" },
    ];
    expect(computeStats(sessions, NOW).streakDays).toBe(3);
  });

  it("streak breaks on a gap day", () => {
    const sessions: PomodoroSession[] = [
      { startedAt: dayAt(3), minutes: 25, mode: "focus" },
      { startedAt: dayAt(1), minutes: 25, mode: "focus" },
      { startedAt: dayAt(0), minutes: 25, mode: "focus" },
    ];
    expect(computeStats(sessions, NOW).streakDays).toBe(2);
  });

  it("streak of break-only sessions is zero", () => {
    const sessions: PomodoroSession[] = [
      { startedAt: dayAt(0), minutes: 5, mode: "break" },
    ];
    expect(computeStats(sessions, NOW).streakDays).toBe(0);
  });

  it("monthly and all-time totals", () => {
    const sessions: PomodoroSession[] = [
      { startedAt: dayAt(10), minutes: 25, mode: "focus" },
      { startedAt: dayAt(45), minutes: 60, mode: "focus" },
    ];
    const stats = computeStats(sessions, NOW);
    expect(stats.monthlyTotal).toBe(25);
    expect(stats.allTimeTotal).toBe(85);
  });

  it("exposes badge color presets", () => {
    expect(BADGE_COLORS).toEqual(["rust", "sage", "amber", "wood", "espresso"]);
  });
});
