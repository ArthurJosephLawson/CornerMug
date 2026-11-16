"use client";

import { useEffect, useRef, useState } from "react";
import { recordSession } from "@/lib/stats";
import { getBrowserStorage } from "@/lib/storage";

/**
 * Local Pomodoro timer: 25 minutes focus, 5 minutes break, bare-bones HTML.
 * Completed focus sessions are recorded to the stats log (localStorage).
 * The shared (synced) timer arrives with the Supabase Realtime wiring.
 *
 * The countdown is deadline-based (epoch-ms target vs Date.now()), so it
 * stays accurate when the tab is backgrounded and setInterval throttles.
 */
export default function PomodoroTimer() {
  const FOCUS_S = 25 * 60;
  const BREAK_S = 5 * 60;
  const [remaining, setRemaining] = useState(FOCUS_S);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const deadlineRef = useRef<number | null>(null);
  const focusStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running || deadlineRef.current === null) {
      return;
    }
    const deadline = deadlineRef.current;
    const tick = () => {
      setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [running]);

  // Transition when the countdown hits zero; record completed focus sessions.
  useEffect(() => {
    if (!running || remaining !== 0 || deadlineRef.current === null) {
      return;
    }
    deadlineRef.current = null;
    setRunning(false);
    if (mode === "focus") {
      const startedAt = focusStartedAtRef.current ?? Date.now() - FOCUS_S * 1000;
      recordSession(
        { startedAt: new Date(startedAt).toISOString(), minutes: FOCUS_S / 60, mode: "focus" },
        getBrowserStorage(),
      );
      focusStartedAtRef.current = null;
      setMode("break");
      setRemaining(BREAK_S);
    } else {
      setMode("focus");
      setRemaining(FOCUS_S);
    }
  }, [running, remaining, mode]);

  function toggle() {
    if (running) {
      // Pause: freeze the remaining seconds; the deadline is discarded.
      deadlineRef.current = null;
      setRunning(false);
    } else if (remaining > 0) {
      // Resume: re-arm the deadline from the frozen remaining time.
      deadlineRef.current = Date.now() + remaining * 1000;
      setRunning(true);
    } else {
      // Fresh start.
      focusStartedAtRef.current = Date.now();
      deadlineRef.current = Date.now() + FOCUS_S * 1000;
      setRunning(true);
    }
  }

  function reset() {
    deadlineRef.current = null;
    setRunning(false);
    setMode("focus");
    setRemaining(FOCUS_S);
    focusStartedAtRef.current = null;
  }

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <section className="card">
      <h2>Pomodoro</h2>
      <div className="muted">{mode === "focus" ? "focus" : "break"}</div>
      <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--espresso)" }}>
        {mm}:{ss}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-accent" onClick={toggle}>
          {running ? "Pause" : remaining < FOCUS_S && remaining > 0 ? "Resume" : "Start"}
        </button>
        <button className="btn" onClick={reset}>
          Reset
        </button>
      </div>
    </section>
  );
}
