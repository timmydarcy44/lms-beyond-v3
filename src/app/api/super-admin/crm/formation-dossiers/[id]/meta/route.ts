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
      "id, status, session_id, trainer_user_id, trainer_assigned_at, invoice_validated_at, amount_ht_cents, amount_tva_cents, amount_ttc_cents, bpf_funder_type, contact_email, contact_name, course_title",
    )
    .eq("id", id)
    .maybeSingle();
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

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
  });
}
