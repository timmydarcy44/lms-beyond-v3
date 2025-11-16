import { createBrowserClient, type SupabaseClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export const createSupabaseBrowserClient = (): SupabaseClient | null => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "Supabase environment variables are missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
      );
    }
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[supabase-client] Using Supabase URL:", env.supabaseUrl);
  }

  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
};


