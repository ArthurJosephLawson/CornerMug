"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  type MugSettings,
} from "@/lib/settings";
import { getBrowserStorage } from "@/lib/storage";

type SettingsContextValue = {
  settings: MugSettings;
  update: (patch: Partial<MugSettings>) => void;
};

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
});

/**
 * Loads settings once on mount and persists every update. Data attributes on
 * <body> carry global side effects (reduce-motion, volume) without re-render
 * flicker — defaults render on first paint, real values replace them after.
 */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<MugSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings(getBrowserStorage()));
  }, []);

  useEffect(() => {
    const body = document.body;
    body.dataset.reduceMotion = String(settings.reduceMotion);
    body.dataset.ambientVolume = String(settings.ambientVolume);
    body.dataset.ambientEnabled = String(settings.ambientEnabled);
    body.dataset.badgeColor = settings.badgeColor;
  }, [settings]);

  const update = useCallback((patch: Partial<MugSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next, getBrowserStorage());
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update }), [settings, update]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useMugSettings(): SettingsContextValue {
  return useContext(SettingsContext);
}
