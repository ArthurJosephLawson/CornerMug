import * as Phaser from "phaser";

/**
 * Empty boot stub. In Phase 2 this scene preloads /sprites/... assets.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create(): void {
    this.scene.start("Cafe");
  }
}
