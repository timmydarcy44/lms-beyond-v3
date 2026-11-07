import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";
import { computePunctuality } from "@/lib/formation-attendance/punctuality";

/** Émargement sur appareil formateur ou ajout manuel après fermeture. */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const slotId = String(body?.slot_id ?? "").trim();
  const profileId = String(body?.profile_id ?? "").trim();
  const source = body?.source === "ajout_manuel" ? "ajout_manuel" : "appareil_formateur";
  const arrivedAt = body?.arrived_at ? String(body.arrived_at) : new Date().toISOString();
  const leftAt = body?.left_at ? String(body.left_at) : null;

  if (!slotId || !profileId) {
    return NextResponse.json({ error: "slot_id et profile_id requis" }, { status: 400 });
  }

  const ctx = await loadSlotContext(service, slotId);
  if (!ctx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });
  const participant = ctx.participants.find((p) => p.profile_id === profileId);
  if (!participant) return NextResponse.json({ error: "Participant non inscrit" }, { status: 404 });
  if (!participant.convention_ok) {
    return NextResponse.json({ error: "Convention non signée pour ce dossier" }, { status: 403 });
  }

  let trainerUserId: string | null = null;
  try {
    const userClient = await getServerClient();
    const { data: auth } = userClient ? await userClient.auth.getUser() : { data: { user: null } };
    trainerUserId = auth.user?.id ?? null;
  } catch {
    /* ignore */
  }

  const { data: existing } = await service
    .from("attendance_signatures")
    .select("id")
    .eq("slot_id", slotId)
    .eq("profile_id", profileId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ error: "Déjà émargé", code: "already_signed" }, { status: 409 });
  }

  const { data: launch } = await service
    .from("attendance_slot_launches")
    .select("id, opened_at")
    .eq("slot_id", slotId)
    .is("revoked_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const punctuality = computePunctuality({
    startsAt: ctx.slot.starts_at,
    openedAt: launch?.opened_at ?? null,
    signedAt: arrivedAt,
  });
  const alerts: string[] = [];
  if (!punctuality.onTime) alerts.push("late");

  const { data: signature, error } = await service
    .from("attendance_signatures")
    .insert({
      slot_id: slotId,
      profile_id: profileId,
      launch_id: launch?.id ?? null,
      source,
      identification_method: "formateur",
      validation_mode: "assistee",
      arrived_at: arrivedAt,
      left_at: leftAt,
      person_seen: true,
      status: "ok",
      minutes_late: punctuality.minutesLate,
      punctuality_ref_at: punctuality.punctualityRefAt.toISOString(),
      minutes_after_scheduled_start: punctuality.minutesAfterScheduledStart,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
      alerts,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await service.from("formation_events").insert({
    dossier_id: participant.dossier_id,
    event_type: "attendance_manual",
    actor_user_id: trainerUserId,
    payload: { slot_id: slotId, profile_id: profileId, source },
  });

  return NextResponse.json({ signature }, { status: 201 });
}
