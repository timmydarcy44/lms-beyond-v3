import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

const createServerSupabaseClient = async (url: string, anonKey: string) => {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          /* cookie mutations not allowed in some contexts (e.g. Server Components) */
        }
      },
      remove(name, options) {
        try {
          cookieStore.delete({ name, ...options });
        } catch {
          /* ignore */
        }
      },
    },
  });
};

export const getServerClient = async () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY manquants: getServerClient() retourne null",
      );
    }
    return null;
  }

  return createServerSupabaseClient(env.supabaseUrl, env.supabaseAnonKey);
};

export const createSupabaseServerClient = async () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error(
      "[supabase] Les variables NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY sont requises côté serveur",
    );
  }

  return createServerSupabaseClient(env.supabaseUrl, env.supabaseAnonKey);
};

export const getServiceRoleClient = () => {
  const serviceKey = env.supabaseServiceKey;
  if (!env.supabaseUrl || !serviceKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[supabase] SUPABASE_SERVICE_ROLE_KEY manquant - certaines fonctionnalités peuvent être limitées",
      );
    }
    return null;
  }

  return createClient(env.supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: "public",
    },
    global: {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  });
};

export const getServiceRoleClientOrFallback = async () => {
  const serviceRoleClient = getServiceRoleClient();
  if (serviceRoleClient) {
    return serviceRoleClient;
  }
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[supabase] Fallback vers getServerClient() (service role non disponible)",
    );
  }
  return await getServerClient();
};

