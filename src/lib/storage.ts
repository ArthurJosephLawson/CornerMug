/** Minimal storage surface so tests can inject an in-memory fake. */
export type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** localStorage when usable, null otherwise (SSR, private mode, blocked). */
export function getBrowserStorage(): StorageLike | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }
    const s = window.localStorage;
    const probe = "__cornermug_probe__";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** JSON.parse that never throws; null on corrupt/missing values. */
export function readJson<T>(storage: StorageLike | null, key: string): T | null {
  if (storage === null) {
    return null;
  }
  const raw = storage.getItem(key);
  if (raw === null) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object") {
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

/** JSON.stringify + set that never throws (quota exceeded etc.). */
export function writeJson(storage: StorageLike | null, key: string, value: unknown): void {
  if (storage === null) {
    return;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore: storage unavailable or full */
  }
}
