import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { createFormationDossier } from "@/lib/formation-dossier/create-dossier";
import {
  FORMATION_DOSSIER_SOURCES,
  type FormationDossierSource,
  type FormationDossierStatus,
} from "@/lib/formation-dossier/constants";
import {
  isBpfIncomplete,
  isDossierOverdue,
  ownerInitials,
  type FormationDossierBoardCard,
} from "@/lib/formation-dossier/board";

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const orgId = req.nextUrl.searchParams.get("organization_id")?.trim() || "";
  const dealId = req.nextUrl.searchParams.get("deal_id")?.trim() || "";
  const enriched = req.nextUrl.searchParams.get("enriched") === "1";

  let query = service
    .from("formation_dossiers")
    .select("*")
    .order("updated_at", { ascending: false });

  if (orgId) query = query.eq("organization_id", orgId);
  if (dealId) query = query.eq("deal_id", dealId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const dossiers = data ?? [];
  if (!enriched) {
    return NextResponse.json({ dossiers });
  }

  const orgIds = Array.from(new Set(dossiers.map((d) => String(d.organization_id))));
  const ownerIds = Array.from(
    new Set(dossiers.map((d) => d.owner_user_id).filter(Boolean).map(String)),
  );
  const sessionIds = Array.from(
    new Set(dossiers.map((d) => d.session_id).filter(Boolean).map(String)),
  );

  const [{ data: orgs }, { data: owners }, { data: slots }] = await Promise.all([
    orgIds.length
      ? service.from("organizations").select("id, name").in("id", orgIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    ownerIds.length
      ? service.from("profiles").select("id, full_name, first_name, last_name, email").in("id", ownerIds)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    sessionIds.length
      ? service
          .from("formation_slots")
          .select("session_id, slot_date")
          .in("session_id", sessionIds)
          .order("slot_date", { ascending: true })
      : Promise.resolve({ data: [] as Array<{ session_id: string; slot_date: string }> }),
  ]);

  const orgName = new Map((orgs ?? []).map((o) => [String(o.id), String(o.name)]));
  const ownerLabel = new Map(
    (owners ?? []).map((o) => {
      const label =
        String(o.full_name ?? "").trim() ||
        [o.first_name, o.last_name].filter(Boolean).join(" ").trim() ||
        String(o.email ?? "");
      return [String(o.id), label];
    }),
  );
  const nextSlotBySession = new Map<string, string>();
  const today = new Date().toISOString().slice(0, 10);
  for (const slot of slots ?? []) {
    const sid = String(slot.session_id);
    if (nextSlotBySession.has(sid)) continue;
    if (String(slot.slot_date) >= today) {
      nextSlotBySession.set(sid, String(slot.slot_date));
    }
  }
  // fallback: earliest slot if none upcoming
  for (const slot of slots ?? []) {
    const sid = String(slot.session_id);
    if (!nextSlotBySession.has(sid)) {
      nextSlotBySession.set(sid, String(slot.slot_date));
    }
  }

  const cards: FormationDossierBoardCard[] = dossiers.map((d) => {
    const ownerId = d.owner_user_id ? String(d.owner_user_id) : null;
    const label = ownerId ? ownerLabel.get(ownerId) ?? null : null;
    const pending = Array.isArray(d.pending_confirm_fields) ? d.pending_confirm_fields.length : 0;
    return {
      id: String(d.id),
      organization_id: String(d.organization_id),
      organization_name: orgName.get(String(d.organization_id)) ?? "Entreprise",
      course_title: d.course_title ? String(d.course_title) : null,
      status: String(d.status) as FormationDossierStatus,
      amount_ht_cents: d.amount_ht_cents != null ? Number(d.amount_ht_cents) : null,
      owner_user_id: ownerId,
      owner_label: label,
      owner_initials: ownerInitials(label),
      next_slot_date: d.session_id ? nextSlotBySession.get(String(d.session_id)) ?? null : null,
      deal_regressed: Boolean(d.deal_regressed),
      bpf_incomplete: isBpfIncomplete(d),
      overdue: isDossierOverdue(d),
      pending_confirm_count: pending,
      source: String(d.source),
      updated_at: String(d.updated_at),
    };
  });

  return NextResponse.json({ dossiers: cards });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const organizationId = String(body?.organization_id ?? "").trim();
  if (!organizationId) {
    return NextResponse.json({ error: "organization_id requis" }, { status: 400 });
  }

  const sourceRaw = String(body?.source ?? "manual").trim();
  const source = (FORMATION_DOSSIER_SOURCES.includes(sourceRaw as FormationDossierSource)
    ? sourceRaw
    : "manual") as FormationDossierSource;

  let actorUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    actorUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  try {
    const dossier = await createFormationDossier(service, {
      organizationId,
      dealId: body?.deal_id ? String(body.deal_id) : null,
      source: source === "deal_won" ? "manual" : source,
      trainingCourseId: body?.training_course_id ? String(body.training_course_id) : null,
      courseTitle: body?.course_title ? String(body.course_title) : null,
      amountHtCents:
        body?.amount_ht_cents != null ? Math.round(Number(body.amount_ht_cents)) : null,
      amountTvaCents:
        body?.amount_tva_cents != null ? Math.round(Number(body.amount_tva_cents)) : null,
      amountTtcCents:
        body?.amount_ttc_cents != null ? Math.round(Number(body.amount_ttc_cents)) : null,
      contactName: body?.contact_name ? String(body.contact_name) : null,
      contactEmail: body?.contact_email ? String(body.contact_email) : null,
      contactPhone: body?.contact_phone ? String(body.contact_phone) : null,
      modalityIntraInter:
        body?.modality_intra_inter === "intra" || body?.modality_intra_inter === "inter"
          ? body.modality_intra_inter
          : null,
      modalityPresence:
        body?.modality_presence === "presentiel" ||
        body?.modality_presence === "distanciel" ||
        body?.modality_presence === "hybride"
          ? body.modality_presence
          : null,
      fundingType:
        body?.funding_type === "direct" ||
        body?.funding_type === "opco" ||
        body?.funding_type === "subrogation"
          ? body.funding_type
          : null,
      notes: body?.notes ? String(body.notes) : null,
      ownerUserId: actorUserId,
      createdBy: actorUserId,
      idempotentDealWon: false,
    });
    return NextResponse.json({ dossier }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Création impossible" },
      { status: 400 },
    );
  }
}
