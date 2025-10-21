import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/login', req.url));

  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          return (await cookies()).getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Déconnexion complète avec nettoyage des cookies
  await sb.auth.signOut();
  
  // Nettoyer explicitement les cookies de session
  res.cookies.delete('sb-access-token');
  res.cookies.delete('sb-refresh-token');
  res.cookies.delete('supabase-auth-token');
  
  // Rediriger vers la page de login avec un paramètre pour forcer le refresh
  return NextResponse.redirect(new URL('/login?logout=success', req.url));
}