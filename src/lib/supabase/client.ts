import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase-client voor de browser. Gebruikt uitsluitend de publieke anon key;
 * Row Level Security in de database bepaalt wat iemand mag lezen en schrijven.
 * De service_role key hoort nooit in deze app.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!client) {
    client = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce", storageKey: "fightlab-auth" },
    });
  }
  return client;
}
