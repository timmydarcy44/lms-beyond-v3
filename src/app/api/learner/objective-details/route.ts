import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { maybeTriggerCrossProfileCompletion } from "@/lib/learner/cross-profile-completion";
import {
  normalizeParticulierObjectiveType,
  OBJECTIVE_DETAIL_FIELDS,
} from "@/lib/particulier/objective-detail-fields";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const objectiveType = normalizeParticulierObjectiveType(
      body.objective_type ?? body.type_profil,
    );
    const rawDetails = body.details && typeof body.details === "object" ? body.details : {};
    const fields = OBJECTIVE_DETAIL_FIELDS[objectiveType];
    const details: Record<string, string> = {};
    for (const field of fields) {
      const value = String((rawDetails as Record<string, unknown>)[field.key] ?? "").trim();
      if (value) details[field.key] = value;
    }

    if (Object.keys(details).length < Math.min(2, fields.length)) {
      return NextResponse.json({ error: "Renseignez au moins deux champs." }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        objective_details: details,
        type_profil: objectiveType,
      })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    const trigger = await maybeTriggerCrossProfileCompletion(user.id);

    return NextResponse.json({
      ok: true,
      trigger,
      redirect: "/dashboard/apprenant/profil-comportemental",
    });
  } catch (error) {
    console.error("[api/learner/objective-details] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
