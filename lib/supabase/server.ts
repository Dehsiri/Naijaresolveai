import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Check whether valid Supabase environment variables are configured.
 * Prevents crashes before the user pastes their Supabase URL & Key into .env.local.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      url.startsWith("http") &&
      !url.includes("your-project-id.supabase.co")
  );
}

/**
 * Server-side Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads and writes auth session cookies automatically via Next.js `cookies()`.
 */
export function createClient() {
  const cookieStore = cookies();
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }[]
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as never)
          );
        } catch {
          // `setAll` called from a Server Component can be safely ignored
          // when middleware refreshes user sessions.
        }
      },
    },
  });
}

