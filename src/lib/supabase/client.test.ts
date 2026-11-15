import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSupabaseClient } from "./client";

describe("createSupabaseClient", () => {
  const savedUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const savedKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    if (savedUrl !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = savedUrl;
    }
    if (savedKey !== undefined) {
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = savedKey;
    }
  });

  it("throws a named error when env vars are missing", () => {
    expect(() => createSupabaseClient()).toThrowError(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment",
    );
  });
});
