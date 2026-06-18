import { NextResponse } from "next/server";
import { fetchLatestSoftSkillsResult } from "@/lib/soft-skills/resolve-soft-skills-result";
import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const data = await fetchLatestSoftSkillsResult(supabase, user.id);

    return NextResponse.json({ exists: !!data, result: data || null });
  } catch (error) {
    console.error("[soft-skills/results]", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
