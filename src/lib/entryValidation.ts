import type { EntryRequest } from "@/types/entry";

/**
 * Pure entry-gate validation. DNS/MX verification lives in gmailDns.ts so
 * tests can run without network access.
 *
 * Gmail rules enforced here (format-level only):
 * - domain must be exactly gmail.com (case-insensitive)
 * - local part: letters/digits/single dots, starts/ends alphanumeric,
 *   no consecutive dots
 * - plus aliases are rejected so session identity stays stable
 */
const GMAIL_FORMAT = /^[a-z0-9](?:[a-z0-9]|\.(?!\.))*[a-z0-9]@gmail\.com$/i;

export function isValidGmailFormat(gmail: string): boolean {
  if (!gmail.includes("@")) return false;
  const [local, domain] = gmail.split("@");
  if (!local || !domain) return false;
  if (gmail.split("@").length !== 2) return false;
  if (gmail !== gmail.toLowerCase()) return false;
  return GMAIL_FORMAT.test(gmail);
}

export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{3,16}$/.test(username);
}

export function validateEntryRequest(body: EntryRequest): string[] {
  const errors: string[] = [];
  if (!isValidGmailFormat(body.gmail)) {
    errors.push("Please provide a valid @gmail.com address.");
  }
  if (!isValidUsername(body.username)) {
    errors.push("Username must be 3-16 characters (letters, numbers, underscores).");
  }
  return errors;
}
