import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { AUTH_ROUTES } from "@/lib/auth/routes";

export async function POST() {
  const supabase = await getServerClient();
  if (supabase) {
    await supabase.auth.signOut({ scope: "global" });
  } else {
    console.warn("[logout] Supabase indisponible, aucune session à fermer");
  }

  // Utiliser redirect() de Next.js au lieu de NextResponse.redirect pour éviter les problèmes d'URL
  const response = NextResponse.redirect(new URL(AUTH_ROUTES.login, process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));
  // Supprimer les cookies de session
  response.cookies.delete("sb-access-token");
  response.cookies.delete("sb-refresh-token");
  return response;
}

// Ajouter aussi GET pour permettre les liens de déconnexion
export async function GET() {
  return POST();
}


