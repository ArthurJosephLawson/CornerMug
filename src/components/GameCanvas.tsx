"use client";

import { useEffect, useRef } from "react";
import type MainCafeScene from "@/game/scenes/MainCafeScene";

/**
 * Bare-bones Phaser canvas mount. Phaser is loaded lazily inside the
 * effect so SSR prerender never evaluates the library (it needs `window`).
 * No HUD, no styling — the creator designs the UI later.
 */
export default function GameCanvas({
  roomId,
  edit,
  onSceneReady,
}: {
  roomId: string;
  edit: boolean;
  onSceneReady?: (scene: MainCafeScene) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let game: import("phaser").Game | null = null;

    async function start() {
      const { mountGame } = await import("@/game/PhaserGame");
      if (cancelled || !containerRef.current) return;
      game = mountGame(containerRef.current, { roomId, edit });
      const onSceneReadyLocal = (scene: MainCafeScene) => {
        if (!cancelled && onSceneReady) {
          onSceneReady(scene);
        }
      };
      // The scene emits this from create() — the API is safe to call.
      game.events.on("maincafe-scene-ready", onSceneReadyLocal);
    }
    void start();

    return () => {
      cancelled = true;
      game?.destroy(true);
      game = null;
    };
    // Room/edit changes remount the whole game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, edit]);

  return <div ref={containerRef} style={{ width: "100%", aspectRatio: "16 / 9" }} />;
}
