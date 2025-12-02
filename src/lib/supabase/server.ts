import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const buildClient = async (url: string, anonKey: string) => {
  const cookieStore: CookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value;
      },
      set(name, value, options) {
        try {
          // Dans Next.js 15, les cookies ne peuvent être modifiés que dans
          // des Server Actions ou Route Handlers. Dans les Server Components,
          // on ne peut que les lire, donc on ignore silencieusement les tentatives
          // de modification (par exemple lors du rafraîchissement automatique de token).
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Ignorer l'erreur - les cookies ne peuvent pas être modifiés dans ce contexte
          // Les modifications de cookies doivent être faites dans des Server Actions ou Route Handlers
        }
      },
      remove(name, options) {
        try {
          cookieStore.delete({ name, ...options });
        } catch (error) {
          // Ignorer l'erreur - les cookies ne peuvent pas être modifiés dans ce contexte
        }
      },
    },
  });
};

export const getServerClient = async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("[supabase] NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY manquants: retour null");
    return null;
  }

  return buildClient(url, anonKey);
};

export const createSupabaseServerClient = async () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("[supabase] Les variables NEXT_PUBLIC_SUPABASE_URL/_ANON_KEY sont requises côté serveur");
  }

  return buildClient(env.supabaseUrl, env.supabaseAnonKey);
};

export const getServiceRoleClient = () => {
  // Vérifier aussi directement dans process.env au cas où env.supabaseServiceKey ne serait pas chargé
  const serviceKey = env.supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!env.supabaseUrl || !serviceKey) {
    // Retourner null au lieu de throw pour permettre un fallback
    console.warn("[supabase] SUPABASE_SERVICE_ROLE_KEY manquant - certaines fonctionnalités peuvent être limitées");
    console.warn("[supabase] env.supabaseServiceKey:", !!env.supabaseServiceKey, "length:", env.supabaseServiceKey?.length || 0);
    console.warn("[supabase] process.env.SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY, "length:", process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);
    return null;
  }
  
  // Utiliser la clé trouvée (depuis env ou process.env directement)
  const actualServiceKey = env.supabaseServiceKey || process.env.SUPABASE_SERVICE_ROLE_KEY!;

  console.log("[supabase] Creating service role client with key length:", actualServiceKey.length);
  
  // Le service role key bypass automatiquement RLS dans Supabase
  // Mais on doit s'assurer que la configuration est correcte
  const client = createClient(env.supabaseUrl, actualServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'apikey': actualServiceKey,
        'Authorization': `Bearer ${actualServiceKey}`,
      },
    },
  });

  // Forcer le bypass RLS en utilisant le service role key directement
  // Le service role key dans Supabase bypass automatiquement toutes les policies RLS
  return client;
};

/**
 * Helper pour obtenir le service role client avec fallback automatique
 * Retourne le service role client si disponible, sinon le client normal
 * 
 * IMPORTANT: Le service role client bypass RLS. Si on utilise le fallback,
 * les RLS policies doivent être correctement configurées pour permettre
 * les opérations Super Admin.
 */
export const getServiceRoleClientOrFallback = async () => {
  const serviceRoleClient = getServiceRoleClient();
  if (serviceRoleClient) {
    // Service role client bypass RLS - parfait pour Super Admin
    return serviceRoleClient;
  }
  // Fallback: utiliser le client normal avec session utilisateur
  // Les RLS policies doivent permettre les opérations Super Admin
  console.warn("[supabase] Using normal client instead of service role - RLS policies will be enforced");
  return await getServerClient();
};


