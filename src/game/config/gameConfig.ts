import * as Phaser from "phaser";
import { WORLD_SIZE } from "@/lib/rooms";
import MainCafeScene from "@/game/scenes/MainCafeScene";

/**
 * Phaser 3 game configuration for Corner Mug.
 * World space is fixed 640x360; the room fills the screen (Scale.FIT,
 * static camera). Pixel-art rendering is spec-pinned.
 */
export function createGameConfig(
  parent: HTMLElement,
  roomId: string,
  edit: boolean,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    pixelArt: true,
    roundPixels: true,
    width: WORLD_SIZE.width,
    height: WORLD_SIZE.height,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { debug: false },
    },
    scene: [new MainCafeScene(roomId, edit)],
  };
}
