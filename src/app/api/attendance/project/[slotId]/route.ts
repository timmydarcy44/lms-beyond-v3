import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import {
  currentRoomCode,
  deriveSlotKey,
  newSlotNonce,
  secondsUntilRefresh,
} from "@/lib/formation-attendance/token";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";
import { canManageSlotAttendance } from "@/lib/formation-attendance/authorize";
import { resolveTrainerNameForSession } from "@/lib/formation-attendance/trainer";

type Ctx = { params: Promise<{ slotId: string }> };

/**
 * Lecture publique de l'écran projeté (éphémère) — code + QR tant que le lancement est ouvert.
 * Pas de K_slot exposé.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { slotId: raw } = await ctx.params;
  const slotId = String(raw ?? "").trim();
  if (!slotId) return NextResponse.json({ error: "Créneau invalide" }, { status: 400 });

  const slotCtx = await loadSlotContext(service, slotId);
  if (!slotCtx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  const { data: launch } = await service
    .from("attendance_slot_launches")
    .select("id, mode, nonce, opened_at, revoked_at")
    .eq("slot_id", slotId)
    .is("revoked_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const eligible = slotCtx.participants.filter((p) => p.convention_ok);
  const { data: signatures } = await service
    .from("attendance_signatures")
    .select("profile_id, server_timestamp, status, minutes_late")
    .eq("slot_id", slotId);

  const present = (signatures ?? []).filter((s) => s.status !== "invalidee").length;
  const trainerName = await resolveTrainerNameForSession(service, slotCtx.session.id);
  const origin = new URL(req.url).origin;

  const title = slotCtx.session.title || slotCtx.dossiers[0]?.course_title || "Formation";
  const clients = slotCtx.dossiers.map((d) => d.organization_name).join(" · ");

  if (!launch?.nonce) {
    return NextResponse.json({
      open: false,
      context: {
        title,
        clients,
        day_part: slotCtx.slot.day_part,
        slot_date: slotCtx.slot.slot_date,
        location: slotCtx.session.location_label,
        trainer_name: trainerName,
      },
      enrolled: eligible.length,
      present: 0,
      roster: eligible.map((p) => ({
        name: p.name,
        signed: false,
        signed_at: null as string | null,
        minutes_late: 0,
      })),
      live: null,
    });
  }

  const slotKey = deriveSlotKey(slotId, String(launch.nonce));
  const live = currentRoomCode(slotKey);

  return NextResponse.json({
    open: true,
    context: {
      title,
      clients,
      day_part: slotCtx.slot.day_part,
      slot_date: slotCtx.slot.slot_date,
      location: slotCtx.session.location_label,
      trainer_name: trainerName,
    },
    enrolled: eligible.length,
    present,
    roster: eligible.map((p) => {
      const sig = (signatures ?? []).find((s) => String(s.profile_id) === p.profile_id);
      return {
        name: p.name,
        signed: Boolean(sig),
        signed_at: sig?.server_timestamp ?? null,
        minutes_late: sig?.minutes_late != null ? Number(sig.minutes_late) : 0,
      };
    }),
    live: {
      launch_id: launch.id,
      mode: launch.mode,
      code: live.code,
      refresh_in_s: secondsUntilRefresh(),
      expires_in_ms: live.expiresInMs,
      public_url: `${origin}/e/s/${launch.id}`,
    },
  });
}

/** Lance l'émargement depuis la page éphémère (formateur assigné ou super-admin). */
export async function POST(req: NextRequest, ctx: Ctx) {
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { slotId: raw } = await ctx.params;
  const slotId = String(raw ?? "").trim();
  if (!slotId) return NextResponse.json({ error: "Créneau invalide" }, { status: 400 });

  const authz = await canManageSlotAttendance(slotId);
  if (!authz.ok) {
    return NextResponse.json(
      {
        error: "Connectez-vous avec le compte formateur pour lancer l'émargement.",
        code: "auth_required",
      },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const mode = body?.mode === "code_oral" ? "code_oral" : "qr";

  const slotCtx = await loadSlotContext(service, slotId);
  if (!slotCtx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  await service
    .from("attendance_slot_launches")
    .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("slot_id", slotId)
    .is("revoked_at", null);

  const nonce = newSlotNonce();
  const openAt = slotCtx.slot.starts_at ? Date.parse(slotCtx.slot.starts_at) : Date.now();
  const closesAt = Number.isFinite(openAt)
    ? new Date(openAt + slotCtx.slot.attendance_close_offset_minutes * 60_000).toISOString()
    : null;

  const { data: launch, error } = await service
    .from("attendance_slot_launches")
    .insert({
      slot_id: slotId,
      session_id: slotCtx.session.id,
      mode,
      nonce,
      opened_by: authz.userId,
      closes_at: closesAt,
    })
    .select("id")
    .single();

  if (error || !launch) {
    return NextResponse.json({ error: error?.message || "Lancement impossible" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  return NextResponse.json({
    ok: true,
    launch_id: launch.id,
    public_url: `${origin}/e/s/${launch.id}`,
    project_url: `${origin}/e/p/${slotId}`,
  });
}
