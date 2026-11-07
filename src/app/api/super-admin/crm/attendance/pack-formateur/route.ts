import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";
import { resolveTrainerEmail } from "@/lib/formation-assessments/synth";
import { sendPackFormateurEmail } from "@/lib/formation-documents/pack-formateur";

/** Envoi manuel immédiat du pack formateur (test / relance jour J). */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const slotId = String(body?.slot_id ?? "").trim();
  if (!slotId) return NextResponse.json({ error: "slot_id requis" }, { status: 400 });

  const ctx = await loadSlotContext(service, slotId);
  if (!ctx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  const dossierId = ctx.dossiers[0]?.id;
  if (!dossierId) {
    return NextResponse.json({ error: "Aucun dossier lié à ce créneau" }, { status: 400 });
  }

  const trainerEmail = await resolveTrainerEmail(service, dossierId);
  if (!trainerEmail) {
    return NextResponse.json(
      { error: "Aucun e-mail formateur sur le dossier.", code: "no_trainer" },
      { status: 400 },
    );
  }

  const result = await sendPackFormateurEmail(service, {
    dossierId,
    toEmail: trainerEmail,
    slotId,
    payload: {
      course_title: ctx.session.title || ctx.dossiers[0]?.course_title || null,
      location: ctx.session.location_label,
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || "Envoi impossible" }, { status: 400 });
  }

  return NextResponse.json({ ok: true, to: trainerEmail });
}
