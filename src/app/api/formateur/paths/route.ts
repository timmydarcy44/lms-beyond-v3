import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getFormateurPaths } from "@/lib/queries/formateur";

/**
 * Liste les parcours (`public.paths`) accessibles au formateur connecté.
 * Même logique que `getFormateurPaths` (multi-org + super admin catalogue complet).
 */
export async function GET() {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const paths = await getFormateurPaths();
    return NextResponse.json({ paths });
  } catch (error) {
    console.error("[api/formateur/paths] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
