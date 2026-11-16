"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { loadRoomConfig, ROOM_IDS } from "@/lib/rooms";
import { loadSession } from "@/lib/session";

/**
 * Room picker: the three cafe interiors as cards with thumbnail previews.
 * Missing _thumb.png files show a labeled fallback box (no art generated).
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
    return (
      <>
        <SiteNav />
        <main />
      </>
    );
  }

  return (
    <>
      <SiteNav />
      <main className="page-enter">
        <h1>Pick a room</h1>
        <p className="muted">Three cozy interiors. Switch any time.</p>
        <div className="picker-grid">
          {ROOM_IDS.map((id) => {
            const room = loadRoomConfig(id);
            return (
              <Link key={id} href={`/cafe/play?room=${id}`} className="card hoverable room-card">
                <div className="thumb">
                  {thumbErrors[id] ? (
                    <div className="thumb-fallback">art on its way</div>
                  ) : (
                    <img
                      src={`/sprites/${id}_thumb.png`}
                      alt={`${room.name} preview`}
                      onError={() => setThumbErrors((prev) => ({ ...prev, [id]: true }))}
                    />
                  )}
                </div>
                <div className="label">{room.name}</div>
                <div className="muted">pull up a chair →</div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
