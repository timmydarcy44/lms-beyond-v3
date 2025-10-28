/**
 * 🔒 AUTH CORE — NE PAS MODIFIER.
 * Toute modification ici doit être validée par code review.
 * Implémentation figée: getAll/setAll pour cookies, retourne toujours res.
 * Changer le retour ou l'ordre des checks = boucles de redirection.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY_ = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  // on crée d'emblée la réponse que l'on va MUTER puis retourner
  const res = NextResponse.next({ request: { headers: req.headers } });

  const supabase = createServerClient(URL_, KEY_, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  const isAuthPage = pathname.startsWith("/login");
  const isProtected = [
    "/dashboard",
    "/courses",
    "/groups",
    "/resources",
    "/tests",
    "/settings",
  ].some((p) => pathname.startsWith(p));

  // protégé → pas logué → vers /login?next=...
  if (isProtected && !user) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // déjà logué → ne pas rester sur /login
  if (isAuthPage && user) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.delete("next");
    return NextResponse.redirect(url);
  }

  // ⚠️ Toujours retourner "res" pour conserver les cookies setAll()
  return res;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/courses/:path*",
    "/groups/:path*",
    "/resources/:path*",
    "/tests/:path*",
    "/settings/:path*",
  ],
};