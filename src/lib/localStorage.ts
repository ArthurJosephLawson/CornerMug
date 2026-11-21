import type { AvatarSlug } from '@/types/database.types';

const PREFIX = 'cornermug.';

export const STORAGE_KEYS = {
  session: 'session',
  settings: 'settings',
  lastRoom: 'last-room',
  stats: 'stats',
} as const;

export interface StoredSession {
  userId: string;
  email: string;
  username: string;
  userKey: string;
  avatarSlug: AvatarSlug;
}

export interface SettingsState {
  ambientAudio: boolean;
  uiChimes: boolean;
  showOnlineStatus: boolean;
  showActiveRoom: boolean;
  darkMode: boolean;
}

export const DEFAULT_SETTINGS: SettingsState = {
  ambientAudio: false,
  uiChimes: false,
  showOnlineStatus: true,
  showActiveRoom: true,
  darkMode: false,
};

export function readJSON<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(`${PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(`${PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing; fail silently.
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(`${PREFIX}${key}`);
  } catch {
    // Ignore storage failures.
  }
}

export function readSession(): StoredSession | null {
  return readJSON<StoredSession>(STORAGE_KEYS.session);
}

export function writeSession(session: StoredSession): void {
  writeJSON(STORAGE_KEYS.session, session);
}

export function clearSession(): void {
  removeKey(STORAGE_KEYS.session);
}

export function readSettings(): SettingsState {
  const stored = readJSON<Partial<SettingsState>>(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
}

export function writeSettings(settings: SettingsState): void {
  writeJSON(STORAGE_KEYS.settings, settings);
}
