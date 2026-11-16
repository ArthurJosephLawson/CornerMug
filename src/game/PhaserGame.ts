import * as Phaser from "phaser";
import { createGameConfig } from "@/game/config/gameConfig";
import type MainCafeScene from "@/game/scenes/MainCafeScene";

/**
 * Creates the Phaser game inside a parent element and returns it so the
 * caller owns cleanup (destroy on unmount).
 */
export function mountGame(
  parent: HTMLElement,
  options: { roomId: string; edit: boolean },
): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent, options.roomId, options.edit));
}

/** Get the MainCafe scene instance from a mounted game. */
export function getMainScene(game: Phaser.Game): MainCafeScene | null {
  const scene = game.scene.getScene("MainCafe");
  return (scene as MainCafeScene) ?? null;
}
