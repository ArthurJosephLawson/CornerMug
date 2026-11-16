"use client";

import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import { useMugSettings } from "@/components/SettingsProvider";
import { BADGE_COLORS } from "@/lib/stats";
import { loadSession } from "@/lib/session";

/**
 * Menu / options page: ambient audio, display, name badge color, account info.
 * Everything persists to localStorage via the SettingsProvider.
 */
export default function SettingsPage() {
  const { settings, update } = useMugSettings();
  const session = loadSession();

  return (
    <>
      <SiteNav />
      <main className="page-enter">
        <h1>Settings</h1>
        <p className="muted">Everything here stays on your device.</p>

        <section className="card">
          <h2>Ambient cafe sounds</h2>
          <div className="setting-row">
            <span>Play ambient sounds</span>
            <input
              type="checkbox"
              checked={settings.ambientEnabled}
              onChange={(e) => update({ ambientEnabled: e.target.checked })}
            />
          </div>
          <div className="setting-row">
            <span>Volume</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.ambientVolume}
              onChange={(e) => update({ ambientVolume: Number(e.target.value) })}
            />
            <span className="muted" style={{ width: 40 }}>
              {Math.round(settings.ambientVolume * 100)}%
            </span>
          </div>
          <p className="muted">Ambient loops arrive with the audio phase.</p>
        </section>

        <section className="card">
          <h2>Display</h2>
          <div className="setting-row">
            <span>Reduce motion (fade/slide effects off)</span>
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(e) => update({ reduceMotion: e.target.checked })}
            />
          </div>
        </section>

        <section className="card">
          <h2>Name badge color</h2>
          <p className="muted">The color of your name tag around the cafe.</p>
          <div className="swatch-row">
            {BADGE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`swatch badge-${color}${settings.badgeColor === color ? " selected" : ""}`}
                title={color}
                aria-label={`badge color ${color}`}
                onClick={() => update({ badgeColor: color })}
              />
            ))}
          </div>
          <p style={{ marginTop: 14 }}>
            Preview: <span className={`badge badge-preview badge-${settings.badgeColor}`}>arthur</span>
          </p>
        </section>

        <section className="card">
          <h2>Account</h2>
          {session ? (
            <div>
              <div className="setting-row">
                <span>Username</span>
                <strong>{session.username}</strong>
              </div>
              <div className="setting-row">
                <span>Gmail</span>
                <strong>{session.gmail}</strong>
              </div>
              <p className="muted">No accounts, no passwords — just your gmail check.</p>
            </div>
          ) : (
            <p className="muted">
              Not seated yet —{" "}
              <Link href="/">enter the cafe first</Link>.
            </p>
          )}
        </section>

        <p>
          <Link className="btn" href="/cafe">
            ← Back to the cafe
          </Link>
        </p>
      </main>
    </>
  );
}
