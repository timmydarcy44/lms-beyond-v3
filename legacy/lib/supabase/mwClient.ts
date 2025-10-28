// lib/supabase/mwClient.ts
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';

export function createSupabaseMwClient(req: NextRequest) {
  const response = new Response(null, { headers: new Headers() });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (key) => req.cookies.get(key)?.value,
        set: (key, value, options) => {
          const cookie = `${key}=${value}; Path=${options.path ?? '/'}; SameSite=${options.sameSite ?? 'Lax'};${
            options.httpOnly ? ' HttpOnly;' : ''
          }${options.secure ?? true ? ' Secure;' : ''}${options.maxAge ? ` Max-Age=${options.maxAge};` : ''}`;
          response.headers.append('Set-Cookie', cookie);
        },
        remove: (key, options) => {
          const cookie = `${key}=; Path=${options.path ?? '/'}; Max-Age=0; SameSite=${options.sameSite ?? 'Lax'}; Secure;`;
          response.headers.append('Set-Cookie', cookie);
        },
      },
    }
  );

  return { supabase, response };
}



