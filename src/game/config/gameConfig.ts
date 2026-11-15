import * as Phaser from "phaser";
import BootScene from "@/game/scenes/BootScene";
import CafeScene from "@/game/scenes/CafeScene";

/**
 * Phaser 3 game configuration for Corner Mug.
 * Pixel-art rendering is spec-pinned. No assets load in Phase 1 — the
 * creator's custom sprites come from /sprites/... in later phases.
 */
export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, CafeScene],
  };
}
