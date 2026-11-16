"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Local Pomodoro timer: 25 minutes focus, 5 minutes break, bare-bones HTML.
 * The shared (synced) timer arrives with the Supabase Realtime wiring.
 */
export default function PomodoroTimer() {
  const FOCUS_S = 25 * 60;
  const BREAK_S = 5 * 60;
  const [remaining, setRemaining] = useState(FOCUS_S);
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) {
      return;
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setMode((m) => (m === "focus" ? "break" : "focus"));
          return mode === "focus" ? BREAK_S : FOCUS_S;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
  }, [running, mode]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");

  return (
    <section>
      <h2>Pomodoro</h2>
      <div>
        {mode}: {mm}:{ss}
      </div>
      <button onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Start"}</button>
      <button
        onClick={() => {
          setRunning(false);
          setMode("focus");
          setRemaining(FOCUS_S);
        }}
      >
        Reset
      </button>
    </section>
  );
}
