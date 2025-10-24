export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  
  // Récupérer le paramètre 'next' pour la redirection
  const next = url.searchParams.get("next") || "/";
  
  // Construire l'URL de redirection
  const redirectUrl = new URL(next, url.origin);
  
  // Supabase gère la session via les cookies helpers automatiquement
  // On redirige simplement vers la page demandée
  return NextResponse.redirect(redirectUrl);
}
