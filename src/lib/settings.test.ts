import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "./settings";
import type { StorageLike } from "./storage";

function memStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("loadSettings", () => {
  let storage: StorageLike;

  beforeEach(() => {
    storage = memStorage();
  });

  it("returns defaults when nothing stored", () => {
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when storage is unavailable", () => {
    expect(loadSettings(null)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when stored JSON is corrupt", () => {
    storage.setItem("cornermug-settings", "{not json");
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it("returns defaults when stored JSON is not an object", () => {
    storage.setItem("cornermug-settings", JSON.stringify(42));
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
  });

  it("roundtrips a saved settings object", () => {
    const mine = { ...DEFAULT_SETTINGS, ambientVolume: 0.4, badgeColor: "sage" as const };
    saveSettings(mine, storage);
    expect(loadSettings(storage)).toEqual(mine);
  });

  it("fills missing keys with defaults", () => {
    storage.setItem("cornermug-settings", JSON.stringify({ ambientVolume: 0.8 }));
    const loaded = loadSettings(storage);
    expect(loaded.ambientVolume).toBe(0.8);
    expect(loaded.ambientEnabled).toBe(DEFAULT_SETTINGS.ambientEnabled);
  });
});
