"use client";

import { useEffect, useRef, useState } from "react";
import type * as Phaser from "phaser";

/**
 * Bare-bones Phaser canvas mount. Phaser is loaded lazily inside the
 * effect so SSR prerender never evaluates the library (it needs `window`).
 * No HUD, no styling — the creator designs the UI later.
 */
export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let game: Phaser.Game | null = null;

    async function start() {
      const { mountGame } = await import("@/game/PhaserGame");
      if (cancelled || !containerRef.current) return;
      game = mountGame(containerRef.current);
      gameRef.current = game;
      setReady(true);
    }
    void start();

    return () => {
      cancelled = true;
      game?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100vh" }}
      data-ready={ready ? "true" : "false"}
    />
  );
}
