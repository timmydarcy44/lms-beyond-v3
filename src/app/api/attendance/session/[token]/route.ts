import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isAttendanceWindowOpen, loadSlotContext } from "@/lib/formation-attendance/slot-context";
import { resolveTrainerNameForSession } from "@/lib/formation-attendance/trainer";

type Ctx = { params: Promise<{ token: string }> };

/** Contexte public d'une page éphémère /e/s/[launchId] — sans secret HOTP. */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { token } = await ctx.params;
  const launchId = String(token ?? "").trim();
  if (!launchId) return NextResponse.json({ error: "Lien invalide" }, { status: 400 });

  const { data: launch } = await service
    .from("attendance_slot_launches")
    .select("id, slot_id, mode, revoked_at, closes_at")
    .eq("id", launchId)
    .maybeSingle();

  if (!launch || launch.revoked_at) {
    return NextResponse.json(
      { error: "Cette session d'émargement est fermée.", code: "closed" },
      { status: 410 },
    );
  }

  const ctxSlot = await loadSlotContext(service, String(launch.slot_id));
  if (!ctxSlot) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  if (!isAttendanceWindowOpen(ctxSlot.slot)) {
    return NextResponse.json(
      { error: "Émargement fermé pour ce créneau.", code: "closed" },
      { status: 400 },
    );
  }

  const trainerName = await resolveTrainerNameForSession(service, ctxSlot.session.id);

  return NextResponse.json({
    ok: true,
    launch_id: launch.id,
    slot_id: launch.slot_id,
    mode: launch.mode,
    context: {
      title: ctxSlot.session.title || ctxSlot.dossiers[0]?.course_title || "Formation",
      clients: ctxSlot.dossiers.map((d) => d.organization_name).join(" · "),
      day_part: ctxSlot.slot.day_part,
      slot_date: ctxSlot.slot.slot_date,
      location: ctxSlot.session.location_label,
      trainer_name: trainerName,
    },
  });
}
