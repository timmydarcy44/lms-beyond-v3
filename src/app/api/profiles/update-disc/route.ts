import { NextResponse } from "next/server";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const profileId = String(body?.profileId || "").trim();

    if (!profileId) {
      return NextResponse.json({ error: "profileId requis." }, { status: 400 });
    }

    const discScores = body?.disc_scores || body?.discScores;
    const scoreD = Number(body?.score_d ?? discScores?.D ?? 0);
    const scoreI = Number(body?.score_i ?? discScores?.I ?? 0);
    const scoreS = Number(body?.score_s ?? discScores?.S ?? 0);
    const scoreC = Number(body?.score_c ?? discScores?.C ?? 0);

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase indisponible." }, { status: 500 });
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({
        disc_profile: body?.disc_profile || null,
        disc_score: Number.isFinite(body?.disc_score) ? Number(body?.disc_score) : null,
        disc_scores: discScores ?? null,
        disc_status: body?.disc_status || "completed",
        score_d: Number.isFinite(scoreD) ? scoreD : null,
        score_i: Number.isFinite(scoreI) ? scoreI : null,
        score_s: Number.isFinite(scoreS) ? scoreS : null,
        score_c: Number.isFinite(scoreC) ? scoreC : null,
      })
      .eq("id", profileId)
      .select("id,email")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, profile: updated });
  } catch (error) {
    console.error("[profiles/update-disc]", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
