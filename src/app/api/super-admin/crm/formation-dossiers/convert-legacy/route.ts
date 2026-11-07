import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { createFormationDossier, resolveOrganizationIdForDeal } from "@/lib/formation-dossier/create-dossier";

/** Convertit une session Qualiopi legacy (non archivée) en dossier formation. */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const sessionId = String(body?.session_id ?? "").trim();
  if (!sessionId) return NextResponse.json({ error: "session_id requis" }, { status: 400 });

  const { data: session, error } = await service
    .from("crm_qualiopi_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !session) {
    return NextResponse.json({ error: "Session Qualiopi introuvable" }, { status: 404 });
  }
  if (session.archived_at) {
    return NextResponse.json({ error: "Session archivée (coquille) — non convertible" }, { status: 400 });
  }

  const { data: existing } = await service
    .from("formation_dossiers")
    .select("id")
    .eq("legacy_qualiopi_session_id", sessionId)
    .maybeSingle();
  if (existing?.id) {
    return NextResponse.json({ dossierId: existing.id, already: true });
  }

  const { data: deal } = await service
    .from("crm_pipeline_deals")
    .select(
      "id, organization_id, company_id, company_name, siret, email, phone, contact_first_name, contact_last_name, amount_cents, quoted_course_ids",
    )
    .eq("id", session.deal_id)
    .maybeSingle();
  if (!deal) return NextResponse.json({ error: "Deal lié introuvable" }, { status: 404 });

  const organizationId = await resolveOrganizationIdForDeal(service, deal);
  if (!organizationId) {
    return NextResponse.json({ error: "Organisation introuvable pour ce deal" }, { status: 400 });
  }

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  const courseId = session.course_id ? String(session.course_id) : null;
  const dossier = await createFormationDossier(service, {
    organizationId,
    dealId: String(deal.id),
    source: "manual",
    trainingCourseId: courseId,
    courseTitle: String(session.course_name ?? "").trim() || null,
    amountHtCents: deal.amount_cents != null ? Number(deal.amount_cents) : null,
    contactName: [deal.contact_first_name, deal.contact_last_name]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .join(" "),
    contactEmail: deal.email ? String(deal.email) : null,
    contactPhone: deal.phone ? String(deal.phone) : null,
    ownerUserId: actorUserId,
    createdBy: actorUserId,
    notes: `Converti depuis session Qualiopi ${sessionId}`,
    idempotentDealWon: false,
  });

  await service
    .from("formation_dossiers")
    .update({ legacy_qualiopi_session_id: sessionId })
    .eq("id", dossier.id);

  await service.from("formation_events").insert({
    dossier_id: dossier.id,
    event_type: "converted_from_legacy",
    actor_user_id: actorUserId,
    payload: { legacy_session_id: sessionId },
  });

  return NextResponse.json({ dossierId: dossier.id, already: false }, { status: 201 });
}
