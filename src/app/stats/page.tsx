"use client";

import { useEffect, useState } from "react";
import SiteNav from "@/components/SiteNav";
import BarChart from "@/components/BarChart";
import { computeStats, loadSessions } from "@/lib/stats";
import { getBrowserStorage } from "@/lib/storage";

/**
 * Activity & stats dashboard: weekly minutes chart, streak, totals.
 * Data comes from the local Pomodoro session log (localStorage); real
 * synced stats arrive with the Supabase phase.
 */
export default function StatsPage() {
  const [range, setRange] = useState<"week" | "month">("week");
  const [stats, setStats] = useState<ReturnType<typeof computeStats> | null>(null);

  useEffect(() => {
    setStats(computeStats(loadSessions(getBrowserStorage()), Date.now()));
  }, []);

  if (stats === null) {
    return (
      <>
        <SiteNav />
        <main />
      </>
    );
  }

  const dayLabels: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    dayLabels.push(d.toLocaleDateString(undefined, { weekday: "short" }));
  }

  return (
    <>
      <SiteNav />
      <main className="page-enter">
        <h1>Your activity</h1>
        <p className="muted">From your Pomodoro sessions — kept on your device.</p>

        {stats.allTimeTotal === 0 ? (
          <section className="card">
            <h2>No sessions yet</h2>
            <p className="muted">
              Start a Pomodoro in the cafe — completed focus sessions show up here as
              streaks, charts, and totals.
            </p>
          </section>
        ) : null}

        <div className="stat-row">
          <div className="stat-tile">
            <div className="value">{stats.streakDays}</div>
            <div className="label">day streak</div>
          </div>
          <div className="stat-tile">
            <div className="value">{stats.weeklyTotal}m</div>
            <div className="label">this week</div>
          </div>
          <div className="stat-tile">
            <div className="value">{stats.monthlyTotal}m</div>
            <div className="label">this month</div>
          </div>
          <div className="stat-tile">
            <div className="value">{Math.floor(stats.allTimeTotal / 60)}h {stats.allTimeTotal % 60}m</div>
            <div className="label">all time</div>
          </div>
        </div>

        <section className="card">
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              className={`btn${range === "week" ? " btn-accent" : ""}`}
              onClick={() => setRange("week")}
            >
              Week
            </button>
            <button
              className={`btn${range === "month" ? " btn-accent" : ""}`}
              onClick={() => setRange("month")}
            >
              Month
            </button>
          </div>

          {range === "week" ? (
            <>
              <h2>Focus minutes — last 7 days</h2>
              <BarChart values={stats.weeklyMinutes} labels={dayLabels} accent="var(--sage)" />
            </>
          ) : (
            <>
              <h2>Monthly productivity</h2>
              <BarChart
                values={[stats.monthlyTotal, Math.max(0, stats.monthlyTotal - stats.weeklyTotal)]}
                labels={["this week", "rest of month"]}
                accent="var(--amber)"
              />
              <p className="muted">
                Detailed day-by-day monthly history arrives with server-side stats.
              </p>
            </>
          )}
        </section>
      </main>
    </>
  );
}
