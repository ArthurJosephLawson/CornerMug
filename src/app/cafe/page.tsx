"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import { loadSession } from "@/lib/session";
import { isRoomId, ROOM_IDS } from "@/lib/rooms";
import type MainCafeScene from "@/game/scenes/MainCafeScene";

/**
 * Cafe play page: requires a verified entry session (sessionStorage).
 * No session → back to the entry gate. Room comes from ?room=, edit mode
 * from ?edit=true. Bare-bones HTML only.
 */
export default function CafePage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [scene, setScene] = useState<MainCafeScene | null>(null);
  const [speech, setSpeech] = useState("");
  const [roomId, setRoomId] = useState<string>("interior_1");
  const [edit, setEdit] = useState(false);
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

  return (
    <main>
      <div>
        Seated as: {username} | Room: {roomId}
        {edit ? " (EDIT MODE)" : ""}
      </div>
      <GameCanvas roomId={roomId} edit={edit} onSceneReady={setScene} />
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
      <p>WASD / arrows to move. Click a red seat marker within reach to sit. Move to stand up.</p>
    </main>
  );
}
