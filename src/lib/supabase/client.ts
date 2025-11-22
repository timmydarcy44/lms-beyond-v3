import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const createSupabaseBrowserClient = (): SupabaseClient | null => {
  // Vérifier directement process.env pour les variables NEXT_PUBLIC_* côté client
  const url = env.supabaseUrl || (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_URL : undefined);
  const anonKey = env.supabaseAnonKey || (typeof window !== 'undefined' ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined);

  if (!url || !anonKey) {
    console.error(
      "[supabase-client] Supabase environment variables are missing.",
      "URL:", !!url,
      "AnonKey:", !!anonKey,
      "env.supabaseUrl:", !!env.supabaseUrl,
      "env.supabaseAnonKey:", !!env.supabaseAnonKey
    );
    return null;
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[supabase-client] Using Supabase URL:", url);
    console.debug("[supabase-client] AnonKey length:", anonKey.length);
  }

  // Configuration simplifiée - retirer flowType pkce qui peut causer des problèmes
  return createBrowserClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};


