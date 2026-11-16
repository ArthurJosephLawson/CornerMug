"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import ChatSidebar from "@/components/ChatSidebar";
import PomodoroTimer from "@/components/PomodoroTimer";
import { loadSession } from "@/lib/session";
import { isRoomId, ROOM_IDS, validateRoomConfig } from "@/lib/rooms";
import { useMugSettings } from "@/components/SettingsProvider";
import type MainCafeScene from "@/game/scenes/MainCafeScene";

/**
 * Cafe play page: requires a verified entry session (sessionStorage).
 * No session → back to the entry gate. Room comes from ?room=, edit mode
 * from ?edit=true. The Phaser canvas is an untouched island inside the
 * styled shell — game code and art drop in without UI changes.
 */
export default function CafePlayPage() {
  const router = useRouter();
  const { settings } = useMugSettings();
  const [username, setUsername] = useState<string | null>(null);
  const [scene, setScene] = useState<MainCafeScene | null>(null);
  const [speech, setSpeech] = useState("");
  const [roomId, setRoomId] = useState<string>("interior_1");
  const [edit, setEdit] = useState(false);
  const [propKey, setPropKey] = useState("");
  const [exportErrors, setExportErrors] = useState<string[]>([]);
  const [exportMessage, setExportMessage] = useState("");
  const speechRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const session = loadSession();
    if (session === null) {
      router.replace("/");
      return;
    }
    setUsername(session.username);

    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get("room") ?? "interior_1";
    setRoomId(isRoomId(roomParam) ? roomParam : ROOM_IDS[0]);
    setEdit(params.get("edit") === "true");
  }, [router]);

  // T focuses the speech input (unless already typing somewhere).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (
        e.key.toLowerCase() === "t" &&
        document.activeElement === document.body &&
        speechRef.current
      ) {
        speechRef.current.focus();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (username === null) {
    return null;
  }

  function say() {
    if (scene && speech.trim() !== "") {
      scene.showSpeech(speech);
      setSpeech("");
    }
  }

  function addProp() {
    if (!scene || propKey.trim() === "") {
      return;
    }
    scene.addProp(propKey.trim(), scene.room.spawn.x, scene.room.spawn.y);
    setPropKey("");
  }

  function exportJson(): string {
    if (!scene) {
      return "";
    }
    const json = scene.getRoomConfigJson();
    const errors = validateRoomConfig(JSON.parse(json));
    setExportErrors(errors);
    return json;
  }

  function copyJson() {
    const json = exportJson();
    if (json !== "") {
      void navigator.clipboard.writeText(json);
      setExportMessage("Copied — paste into src/config/rooms/interior_N.json");
    }
  }

  function downloadJson() {
    const json = exportJson();
    if (json === "") {
      return;
    }
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${roomId}.json`;
    a.click();
    // Defer revocation — same-tick revoke can cancel the download in Firefox.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setExportMessage("Downloaded");
  }

  return (
    <main className="page-enter">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <span className={`badge badge-preview badge-${settings.badgeColor}`}>
          {username}
        </span>
        <span className="muted">
          Room: {roomId}
          {edit ? " (edit mode)" : ""}
        </span>
        <div style={{ flex: 1 }} />
        <a className="btn btn-quiet" href="/cafe">
          ← rooms
        </a>
        <a className="btn btn-quiet" href="/help">
          help
        </a>
        <a className="btn btn-quiet" href="/settings">
          settings
        </a>
      </div>

      <div className="play-layout">
        <div className="game-island">
          <div className="canvas-frame">
            <GameCanvas roomId={roomId} edit={edit} onSceneReady={setScene} />
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="entry-form" style={{ justifyContent: "flex-start", marginTop: 0 }}>
              <input
                ref={speechRef}
                value={speech}
                onChange={(e) => setSpeech(e.target.value)}
                onFocus={() => scene?.setKeyboardEnabled(false)}
                onBlur={() => scene?.setKeyboardEnabled(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    say();
                  }
                }}
                placeholder="Press T to talk"
                style={{ flex: 1, minWidth: 200 }}
              />
              <button className="btn btn-accent" onClick={say}>
                Say
              </button>
            </div>
            <p className="muted" style={{ margin: "8px 0 0" }}>
              <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or arrows to
              move · click a red seat marker within reach to sit · move to
              stand up · press <kbd>T</kbd> to talk
            </p>
          </div>
        </div>

        <div className="side-column">
          <ChatSidebar tableId={scene?.getActiveTableId() ?? "cafe"} />
          <PomodoroTimer />
        </div>
      </div>

      {edit ? (
        <section className="card" style={{ marginTop: 14 }}>
          <h2>Edit mode — layout tool</h2>
          <div className="entry-form" style={{ justifyContent: "flex-start", marginTop: 0 }}>
            <input
              value={propKey}
              onChange={(e) => setPropKey(e.target.value)}
              onFocus={() => scene?.setKeyboardEnabled(false)}
              onBlur={() => scene?.setKeyboardEnabled(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  addProp();
                }
              }}
              placeholder="prop key (e.g. desk)"
            />
            <button className="btn" onClick={addProp}>
              Add prop
            </button>
            <button className="btn" onClick={copyJson}>
              Copy room JSON
            </button>
            <button className="btn" onClick={downloadJson}>
              Download room JSON
            </button>
          </div>
          {exportErrors.length > 0 ? (
            <ul className="entry-error" style={{ listStyle: "none", padding: 0 }}>
              {exportErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
          {exportMessage !== "" ? <p className="muted">{exportMessage}</p> : null}
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Drag props / seats / the SPAWN marker to place them, then export and
            paste into <code>src/config/rooms/interior_N.json</code>.
          </p>
        </section>
      ) : null}
    </main>
  );
}
