import type { SessionData } from "@/types/entry";

/**
 * Lightweight session persistence for the zero-account entry gate.
 * The session is verified server-side by POST /api/verify-entry and then
 * stored lightly in sessionStorage — no accounts, no passwords.
 */
export const SESSION_KEY = "cornermug-session";

export function saveSession(session: SessionData): void {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession(): SessionData | null {
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}
