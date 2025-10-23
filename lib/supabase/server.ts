import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function supabaseServer() {
  // Next 15: cookies() peut être asynchrone selon le contexte
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set() {},
        remove() {},
      },
    }
  );
}