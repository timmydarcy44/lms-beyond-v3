import { NextResponse } from "next/server";
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

    const { data, error } = await supabase
      .from("soft_skills_results")
      .select("*")
      .eq("learner_id", user.id)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[soft-skills/results]", error);
      return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
    }

    return NextResponse.json({ exists: !!data, result: data || null });
  } catch (error) {
    console.error("[soft-skills/results]", error);
    return NextResponse.json({ error: "Erreur inattendue" }, { status: 500 });
  }
}
