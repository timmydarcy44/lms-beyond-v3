import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import {
  archiveSuiviLmsForDossier,
  resolveDossierLmsCourseId,
} from "@/lib/formation-documents/suivi-lms";

type Ctx = { params: Promise<{ id: string }> };

async function actorId(): Promise<string | null> {
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    return auth.user?.id ?? null;
  } catch {
    return null;
  }
}

/** État du suivi LMS (distanciel) pour le dossier. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const resolved = await resolveDossierLmsCourseId(service, id);

  const { count: learnerDocs } = await service
    .from("formation_documents")
    .select("id", { count: "exact", head: true })
    .eq("dossier_id", id)
    .eq("kind", "suivi_lms")
    .not("participant_id", "is", null);

  const { data: sessionDoc } = await service
    .from("formation_documents")
    .select("id, generated_at, meta")
    .eq("dossier_id", id)
    .eq("kind", "suivi_lms_session")
    .is("participant_id", null)
    .maybeSingle();

  const { count: participants } = await service
    .from("formation_participants")
    .select("id", { count: "exact", head: true })
    .eq("dossier_id", id);

  return NextResponse.json({
    has_distanciel: resolved.hasDistanciel,
    lms_course_id: resolved.lmsCourseId,
    course_title: resolved.courseTitle,
    modality_presence: resolved.modalityPresence,
    pedagogical_modality: resolved.pedagogicalModality,
    participants: participants ?? 0,
    archived_learners: learnerDocs ?? 0,
    session_document_id: sessionDoc?.id ?? null,
    last_generated_at: sessionDoc?.generated_at ?? null,
  });
}

/** Génère et archive les relevés PDF (par apprenant + synthèse session). */
export async function POST(_req: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const actorUserId = await actorId();
  const result = await archiveSuiviLmsForDossier(service, {
    dossierId: id,
    actorUserId,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code },
      { status: result.code === "lms_course_missing" ? 400 : 500 },
    );
  }

  return NextResponse.json(result);
}
