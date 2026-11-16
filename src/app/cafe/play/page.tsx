"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import ChatSidebar from "@/components/ChatSidebar";
import PomodoroTimer from "@/components/PomodoroTimer";
import { loadSession } from "@/lib/session";
import { isRoomId, ROOM_IDS, validateRoomConfig } from "@/lib/rooms";
import type MainCafeScene from "@/game/scenes/MainCafeScene";

/**
 * Cafe play page: requires a verified entry session (sessionStorage).
 * No session → back to the entry gate. Room comes from ?room=, edit mode
 * from ?edit=true. Bare-bones HTML only — the creator styles the UI later.
 */
export default function CafePlayPage() {
  const router = useRouter();
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
    URL.revokeObjectURL(url);
    setExportMessage("Downloaded");
  }

  return (
    <main>
      <div>
        Seated as: {username} | Room: {roomId}
        {edit ? " (EDIT MODE)" : ""} | <a href="/cafe">← rooms</a>
      </div>
      <div>
        <GameCanvas roomId={roomId} edit={edit} onSceneReady={setScene} />
        <ChatSidebar />
        <PomodoroTimer />
      </div>
      <div>
        <input
          ref={speechRef}
          value={speech}
          onChange={(e) => setSpeech(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              say();
            }
          }}
          placeholder="Press T to talk"
        />
        <button onClick={say}>Say</button>
      </div>
      {edit ? (
        <div>
          <h2>Edit mode</h2>
          <div>
            <input
              value={propKey}
              onChange={(e) => setPropKey(e.target.value)}
              placeholder="prop key (e.g. desk)"
            />
            <button onClick={addProp}>Add prop</button>
            <button onClick={copyJson}>Copy room JSON</button>
            <button onClick={downloadJson}>Download room JSON</button>
          </div>
          {exportErrors.length > 0 ? (
            <ul>
              {exportErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}
          {exportMessage !== "" ? <div>{exportMessage}</div> : null}
          <p>Drag props / seats / the SPAWN marker to place them, then export.</p>
        </div>
      ) : (
        <p>
          WASD / arrows to move. Click a red seat marker within reach to sit. Move
          to stand up. Press T to talk.
        </p>
      )}
    </main>
  );
}
