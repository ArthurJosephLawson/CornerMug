/**
 * Graceful fallback for missing creator art.
 *
 * When an expected PNG in sprites/png/ has not been drawn yet, the scene
 * renders a clean, labeled colored rectangle at the asset's world size
 * instead. The game always runs and tests cleanly at every stage.
 *
 * The pure lookup (missingAssets) is unit-tested; applyFallbacks is the
 * Phaser-side consumer and is exercised in the browser.
 */

import type Phaser from "phaser";

export type AssetSpec = {
  /** Texture key, e.g. "interior_1", "male_left", "desk" */
  key: string;
  /** URL the engine would have loaded, e.g. /sprites/desk.png */
  url: string;
  /** World display size */
  width: number;
  height: number;
  /** Fallback rectangle fill color (0xRRGGBB) */
  color: number;
  /** Short label drawn on the rectangle */
  label: string;
};

export const FALLBACK_COLORS = {
  bg: 0xb9a88c,
  char: 0x5c4033,
  prop: 0x7a8b6f,
  seat: 0xa8574e,
  npc: 0xd9a05b,
} as const;

/** Key used for the generated canvas texture of a missing asset. */
export function fallbackTextureKey(key: string): string {
  return `__fallback_${key}`;
}

function stripExtension(key: string): string {
  return key.replace(/\.png$/i, "");
}

/** Pure: which specs have no loaded texture yet (keys compared without .png). */
export function missingAssets(
  specs: AssetSpec[],
  existingTextures: Set<string>,
): AssetSpec[] {
  return specs.filter((spec) => {
    const bare = stripExtension(spec.key);
    return !existingTextures.has(bare) && !existingTextures.has(spec.key);
  });
}

/**
 * Create labeled colored-rectangle canvas textures for every missing spec.
 * Called from the scene after its normal load; does not touch existing art.
 */
export function applyFallbacks(scene: Phaser.Scene, specs: AssetSpec[]): void {
  const existing = new Set(scene.textures.getTextureKeys());
  const missing = missingAssets(specs, existing);

  for (const spec of missing) {
    const texKey = fallbackTextureKey(spec.key);
    if (scene.textures.exists(texKey)) {
      continue;
    }

    const canvasTex = scene.textures.createCanvas(texKey, spec.width, spec.height);
    if (!canvasTex) {
      continue;
    }

    const ctx = canvasTex.getContext();
    const w = spec.width;
    const h = spec.height;

    // Darker base so the translucent fill reads as a placeholder, not art.
    ctx.fillStyle = "#1a1410";
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = `#${spec.color.toString(16).padStart(6, "0")}`;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;

    // 1px border
    ctx.strokeStyle = "rgba(245, 239, 230, 0.9)";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // Label: key name, centered, monospace
    const fontSize = spec.width >= 48 ? 8 : 7;
    ctx.font = `${fontSize}px monospace`;
    ctx.fillStyle = "#FAF3E3";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`NO ${spec.label}`, w / 2, h / 2);

    canvasTex.refresh();
  }
}
