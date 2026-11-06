import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client.
 * Used in Client Components ("use client") for interactive operations.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

