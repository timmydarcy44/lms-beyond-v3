import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Helper serveur compatible App Router, sans dépendance à un type Database local
export async function supabaseServer() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // No-op : Next gère l'écriture des cookies côté auth
        set() {},
        remove() {},
      },
    }
  );

  return supabase;
}