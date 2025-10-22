import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Client Supabase côté serveur (App Router)
 * Compatible avec Next où cookies() renvoie une Promesse.
 */
export async function supabaseServer() {
  // ⬇️ cookies() est asynchrone dans ta config → on l'attend
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Fonctions synchrones, alimentées par cookieStore résolu ci-dessus
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-op ici : en RSC/handlers, l'écriture est gérée ailleurs si besoin
        set() {},
        remove() {},
      },
    }
  );

  return supabase;
}