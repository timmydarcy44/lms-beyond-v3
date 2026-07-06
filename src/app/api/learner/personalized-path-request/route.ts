import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import type { PersonalizedPathRequestPayload } from "@/lib/apprenant/edge-personalized-path-request";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = (await request.json()) as PersonalizedPathRequestPayload;
    const objective = body.objective?.trim();
    const currentStatus = body.currentStatus?.trim();
    const deadline = body.deadline?.trim();
    const supportPreference = body.supportPreference?.trim();

    if (!objective || !currentStatus || !deadline || !supportPreference) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const service = getServiceRoleClient();
    if (!service) {
      // TODO: brancher notification email conseiller EDGE quand le flux admin sera prêt
      console.warn("[personalized-path-request] service role unavailable — request logged only", {
        userId: user.id,
        objective,
      });
      return NextResponse.json({ success: true, id: "mock", mocked: true });
    }

    const prioritySkills = Array.isArray(body.prioritySkills)
      ? body.prioritySkills.map(String).filter(Boolean)
      : [];

    const { data: row, error } = await service
      .from("edge_personalized_path_requests")
      .insert({
        user_id: user.id,
        objective,
        current_status: currentStatus,
        deadline,
        support_preference: supportPreference,
        message: body.message?.trim() || null,
        priority_skills: prioritySkills,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[personalized-path-request] insert:", error);
      // Fallback si migration non appliquée en prod
      if (error.code === "42P01") {
        console.warn("[personalized-path-request] table missing — apply migration 20260706220000");
        return NextResponse.json({ success: true, id: "pending-migration", mocked: true });
      }
      return NextResponse.json({ error: "Impossible d'enregistrer la demande" }, { status: 500 });
    }

    // TODO: envoyer email notification au conseiller EDGE

    return NextResponse.json({ success: true, id: row.id });
  } catch (error) {
    console.error("[personalized-path-request] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
