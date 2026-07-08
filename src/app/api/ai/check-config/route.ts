import { NextRequest, NextResponse } from "next/server";

import { getServerClient } from "@/lib/supabase/server";
import { checkAIConfig } from "@/lib/utils/check-ai-config";

/**
 * Vérifie si l'IA est configurée (sans exposer de détail sur les clés).
 * Réservé aux utilisateurs authentifiés.
 */
export async function GET(_request: NextRequest) {
  const supabase = await getServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const config = checkAIConfig();
  return NextResponse.json({
    isConfigured: config.isConfigured,
    provider: config.provider,
  });
}
