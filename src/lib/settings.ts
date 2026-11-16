import { readJson, writeJson, type StorageLike } from "./storage";

/**
 * User preferences persisted to localStorage ("cornermug-settings").
 * Corrupt or missing data always falls back to defaults — never throws.
 */

export type BadgeColor = "rust" | "sage" | "amber" | "wood" | "espresso";

export type MugSettings = {
  ambientEnabled: boolean;
  ambientVolume: number;
  reduceMotion: boolean;
  badgeColor: BadgeColor;
};

export const DEFAULT_SETTINGS: MugSettings = {
  ambientEnabled: true,
  ambientVolume: 0.5,
  reduceMotion: false,
  badgeColor: "rust",
};

const SETTINGS_KEY = "cornermug-settings";

function mergeDefaults(partial: Partial<MugSettings> | null): MugSettings {
  if (partial === null) {
    return { ...DEFAULT_SETTINGS };
  }
  return {
    ambientEnabled:
      typeof partial.ambientEnabled === "boolean"
        ? partial.ambientEnabled
        : DEFAULT_SETTINGS.ambientEnabled,
    ambientVolume:
      typeof partial.ambientVolume === "number" &&
      Number.isFinite(partial.ambientVolume) &&
      partial.ambientVolume >= 0 &&
      partial.ambientVolume <= 1
        ? partial.ambientVolume
        : DEFAULT_SETTINGS.ambientVolume,
    reduceMotion:
      typeof partial.reduceMotion === "boolean"
        ? partial.reduceMotion
        : DEFAULT_SETTINGS.reduceMotion,
    badgeColor: isBadgeColor(partial.badgeColor)
      ? partial.badgeColor
      : DEFAULT_SETTINGS.badgeColor,
  };
}

export function isBadgeColor(value: unknown): value is BadgeColor {
  return (
    value === "rust" ||
    value === "sage" ||
    value === "amber" ||
    value === "wood" ||
    value === "espresso"
  );
}

export function loadSettings(storage: StorageLike | null): MugSettings {
  return mergeDefaults(readJson<Partial<MugSettings>>(storage, SETTINGS_KEY));
}

export function saveSettings(settings: MugSettings, storage: StorageLike | null): void {
  writeJson(storage, SETTINGS_KEY, settings);
}
