import { NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ id: string }> };

/** Contexte Lot 5 pour le panneau dossier (verrous + staff). */
export async function GET(_req: Request, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id } = await ctx.params;
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select(
      "id, status, organization_id, session_id, trainer_user_id, trainer_assigned_at, invoice_validated_at, amount_ht_cents, amount_tva_cents, amount_ttc_cents, bpf_funder_type, contact_email, contact_name, course_title, training_course_id, modality_intra_inter, notes",
    )
    .eq("id", id)
    .maybeSingle();
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const orgId = String(dossier.organization_id ?? "").trim();
  const { data: orgRow } = orgId
    ? await service
        .from("organizations")
        .select("id, name, siret")
        .eq("id", orgId)
        .maybeSingle()
    : { data: null };
  const orgSiretDigits = String(orgRow?.siret ?? "").replace(/\D/g, "");

  const { quoteHtCentsFromCatalog } = await import("@/lib/formation-dossier/catalog-pricing");
  let catalogSuggestedHtCents: number | null = null;
  let catalogLabel: string | null = null;
  let catalogCourseId: string | null = dossier.training_course_id
    ? String(dossier.training_course_id)
    : null;

  let courseQuery = service
    .from("training_courses")
    .select("id, title, intra_price, inter_price");
  if (catalogCourseId) {
    courseQuery = courseQuery.eq("id", catalogCourseId);
  } else if (dossier.course_title) {
    courseQuery = courseQuery.ilike("title", String(dossier.course_title));
  }
  const { data: catalogCourse } =
    catalogCourseId || dossier.course_title
      ? await courseQuery.limit(1).maybeSingle()
      : { data: null };

  if (catalogCourse?.id) {
    catalogCourseId = String(catalogCourse.id);
    const modality =
      String(dossier.modality_intra_inter ?? "intra") === "inter" ? "inter" : "intra";
    catalogSuggestedHtCents = quoteHtCentsFromCatalog({
      intraPrice: catalogCourse.intra_price != null ? Number(catalogCourse.intra_price) : null,
      interPrice: catalogCourse.inter_price != null ? Number(catalogCourse.inter_price) : null,
      modality,
      participants: 1,
    });
    if (catalogSuggestedHtCents != null) {
      catalogLabel = `${(catalogSuggestedHtCents / 100).toLocaleString("fr-FR")} € HT catalogue (${modality})`;
    }
  }

  const { data: convention } = await service
    .from("formation_documents")
    .select("status, signed_at")
    .eq("dossier_id", id)
    .eq("kind", "convention")
    .maybeSingle();

  let slotCount = 0;
  let closedCount = 0;
  if (dossier.session_id) {
    const { data: slots } = await service
      .from("formation_slots")
      .select("id")
      .eq("session_id", dossier.session_id);
    slotCount = slots?.length ?? 0;
    if (slotCount) {
      const { data: closures } = await service
        .from("attendance_closures")
        .select("slot_id")
        .in(
          "slot_id",
          slots!.map((s) => String(s.id)),
        );
      closedCount = closures?.length ?? 0;
    }
  }

  const { data: invoice } = await service
    .from("org_billing_documents")
    .select("id, number, amount_ht_cents, amount_ttc_cents, status, issued_at")
    .eq("formation_dossier_id", id)
    .eq("doc_type", "invoice")
    .maybeSingle();

  const { data: staff } = await service
    .from("super_admins")
    .select("user_id")
    .eq("is_active", true);

  const staffIds = (staff ?? []).map((s) => String(s.user_id));
  const { data: profiles } = staffIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", staffIds)
    : { data: [] as Array<Record<string, unknown>> };

  const trainers = (profiles ?? []).map((p) => ({
    id: String(p.id),
    name:
      String(p.full_name ?? "").trim() ||
      [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
      String(p.email ?? p.id),
  }));

  return NextResponse.json({
    locks: {
      convention_signed: convention?.status === "signed",
      convention_signed_at: convention?.signed_at ?? null,
      trainer_assigned: Boolean(dossier.trainer_user_id),
      trainer_user_id: dossier.trainer_user_id,
      slots_total: slotCount,
      slots_closed: closedCount,
      attendance_complete: slotCount === 0 ? false : closedCount >= slotCount,
      invoice_validated: Boolean(dossier.invoice_validated_at),
    },
    invoice,
    trainers,
    amounts: {
      ht: dossier.amount_ht_cents,
      tva: dossier.amount_tva_cents,
      ttc: dossier.amount_ttc_cents,
    },
    catalog: {
      training_course_id: catalogCourseId,
      suggested_ht_cents: catalogSuggestedHtCents,
      label: catalogLabel,
    },
    organization: {
      id: orgId || null,
      name: orgRow?.name ? String(orgRow.name) : null,
      siret: orgSiretDigits || null,
      siret_ok: orgSiretDigits.length === 14,
    },
  });
}
