"use client";

import { useEffect, useRef, useState } from "react";
import { recordSession } from "@/lib/stats";
import { getBrowserStorage } from "@/lib/storage";

/**
 * Local Pomodoro timer: 25 minutes focus, 5 minutes break, bare-bones HTML.
 * Completed focus sessions are recorded to the stats log (localStorage).
 * The shared (synced) timer arrives with the Supabase Realtime wiring.
 */
export default function PomodoroTimer() {
  const FOCUS_S = 25 * 60;
  const BREAK_S = 5 * 60;
  const [remaining, setRemaining] = useState(FOCUS_S);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const focusStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      return;
    }
    const interval = window.setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [running]);

  // Transition when the countdown hits zero; record completed focus sessions.
  useEffect(() => {
    if (remaining !== 0) {
      return;
    }
    if (mode === "focus") {
      const startedAt = focusStartedAtRef.current ?? Date.now();
      recordSession(
        { startedAt: new Date(startedAt).toISOString(), minutes: 25, mode: "focus" },
        getBrowserStorage(),
      );
      setMode("break");
      setRemaining(BREAK_S);
    } else {
      setMode("focus");
      setRemaining(FOCUS_S);
    }
  }, [remaining, mode]);

  function startFocus() {
    focusStartedAtRef.current = Date.now();
    setRunning(true);
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
        <button
          className="btn btn-accent"
          onClick={() => (running ? setRunning(false) : startFocus())}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          className="btn"
          onClick={() => {
            setRunning(false);
            setMode("focus");
            setRemaining(FOCUS_S);
            focusStartedAtRef.current = null;
          }}
        >
          Reset
        </button>
      </div>
    </section>
  );
}
