import { describe, expect, it } from "vitest";
import { FALLBACK_COLORS, missingAssets } from "./fallback";
import type { AssetSpec } from "./fallback";

const spec = (key: string, w = 32, h = 48): AssetSpec => ({
  key,
  url: `/sprites/${key}.png`,
  width: w,
  height: h,
  color: FALLBACK_COLORS.prop,
  label: key,
});

describe("missingAssets", () => {
  it("returns all specs when no textures exist", () => {
    const specs = [spec("desk"), spec("laptop")];
    expect(missingAssets(specs, new Set())).toEqual(specs);
  });

  it("returns nothing when all textures exist", () => {
    const specs = [spec("desk"), spec("laptop")];
    const existing = new Set(["desk", "laptop"]);
    expect(missingAssets(specs, existing)).toEqual([]);
  });

  it("returns only the missing ones (mixed)", () => {
    const desk = spec("desk");
    const laptop = spec("laptop");
    const existing = new Set(["desk"]);
    expect(missingAssets([desk, laptop], existing)).toEqual([laptop]);
  });

  it("ignores the png extension when matching keys", () => {
    const existing = new Set(["desk"]);
    expect(missingAssets([spec("desk.png")], existing)).toEqual([]);
  });
});
