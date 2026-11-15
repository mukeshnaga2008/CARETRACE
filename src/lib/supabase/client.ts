import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates an isomorphic browser-side Supabase client.
 * Falls back gracefully when running in synthetic demonstration mode.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://demo.caretrace.internal";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "demo-anon-key";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
