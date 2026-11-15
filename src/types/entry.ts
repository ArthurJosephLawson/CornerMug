/**
 * Shared types for the Corner Mug entry gate (Gmail + Username).
 * Consumed by the /api/verify-entry route and the entry UI.
 */

export type EntryRequest = {
  gmail: string;
  username: string;
};

export type SessionData = {
  gmail: string;
  username: string;
  token: string;
  joinedAt: string;
};

export type EntryResponse =
  | { ok: true; session: SessionData }
  | { ok: false; errors: string[] };
