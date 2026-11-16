"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadRoomConfig, ROOM_IDS } from "@/lib/rooms";
import { loadSession } from "@/lib/session";

/**
 * Room picker: the three cafe interiors with thumbnail previews.
 * Missing _thumb.png files show a labeled fallback box (no art generated).
 * Bare-bones HTML — the creator styles the UI later.
 */
export default function CafePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [thumbErrors, setThumbErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const session = loadSession();
    if (session === null) {
      router.replace("/");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return (
    <main>
      <h1>Pick a room</h1>
      {ROOM_IDS.map((id) => {
        const room = loadRoomConfig(id);
        return (
          <div key={id}>
            <button onClick={() => router.push(`/cafe/play?room=${id}`)}>
              {room.name}
            </button>
            {thumbErrors[id] ? (
              <div
                style={{ width: 160, height: 90, border: "1px solid #5C4033", background: "#B9A88C" }}
              >
                <small>NO {id}_thumb</small>
              </div>
            ) : (
              <img
                src={`/sprites/${id}_thumb.png`}
                alt={`${room.name} preview`}
                width={160}
                height={90}
                onError={() => setThumbErrors((prev) => ({ ...prev, [id]: true }))}
              />
            )}
          </div>
        );
      })}
    </main>
  );
}
