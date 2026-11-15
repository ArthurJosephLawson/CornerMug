import * as Phaser from "phaser";
import { createGameConfig } from "@/game/config/gameConfig";

/**
 * Creates the Phaser game inside a parent element and returns it so the
 * caller owns cleanup (destroy on unmount).
 */
export function mountGame(parent: HTMLElement): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent));
}
