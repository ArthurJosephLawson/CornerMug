import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Route-handler Supabase client. Same env contract as the browser client.
 */
export function createSupabaseServerClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment",
    );
  }

  return createClient(url, anonKey);
}
