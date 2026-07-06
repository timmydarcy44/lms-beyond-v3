import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { sendProgrammeRequestEmails } from "@/lib/particulier/accompagnement-emails";

type ProgrammeBody = {
  objectif: string;
  besoin: string;
  disponibilite: string;
  message?: string;
  userName?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id || !user.email) {
      return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
    }

    const body = (await request.json()) as ProgrammeBody;
    const objectif = body.objectif?.trim();
    const besoin = body.besoin?.trim();
    const disponibilite = body.disponibilite?.trim();

    if (!objectif || !besoin || !disponibilite) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const service = getServiceRoleClient();
    if (!service) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    const userName =
      body.userName?.trim() ||
      String(user.user_metadata?.full_name ?? "").trim() ||
      user.email.split("@")[0];

    const { data: row, error } = await service
      .from("edge_accompagnement_programme_requests")
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: userName,
        objectif,
        besoin,
        disponibilite,
        message: body.message?.trim() || null,
      })
      .select("id")
      .single();

    if (error || !row) {
      console.error("[edge/accompagnement/programme-request] insert:", error);
      return NextResponse.json({ error: "Impossible d'enregistrer la demande" }, { status: 500 });
    }

    await sendProgrammeRequestEmails({
      requestId: row.id,
      userId: user.id,
      userName,
      userEmail: user.email,
      objectif,
      besoin,
      disponibilite,
      message: body.message?.trim(),
    }).catch((err) => console.error("[edge/accompagnement/programme-request] email:", err));

    return NextResponse.json({ success: true, id: row.id });
  } catch (error) {
    console.error("[edge/accompagnement/programme-request] error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
