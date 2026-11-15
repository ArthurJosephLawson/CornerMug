"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GameCanvas from "@/components/GameCanvas";
import { loadSession } from "@/lib/session";

/**
 * Cafe page: requires a verified entry session (sessionStorage).
 * No session → back to the entry gate.
 */
export default function CafePage() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession();
    if (session === null) {
      router.replace("/");
    } else {
      setUsername(session.username);
    }
  }, [router]);

  if (username === null) {
    return null;
  }

  return (
    <main>
      <div>Seated as: {username}</div>
      <GameCanvas />
    </main>
  );
}
