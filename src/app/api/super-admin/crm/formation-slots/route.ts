import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

/** Crée une session intra liée au dossier + un créneau (si absents). */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const dossierId = String(body?.dossier_id ?? "").trim();
  if (!dossierId) return NextResponse.json({ error: "dossier_id requis" }, { status: 400 });

  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, session_id, course_title, modality_presence, modality_intra_inter")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  let sessionId = dossier.session_id ? String(dossier.session_id) : null;
  if (!sessionId) {
    const { data: session, error } = await service
      .from("formation_sessions")
      .insert({
        title: dossier.course_title || "Session formation",
        modality_presence: dossier.modality_presence || "presentiel",
        status: "ready",
      })
      .select("id")
      .single();
    if (error || !session) {
      return NextResponse.json({ error: error?.message || "Session impossible" }, { status: 400 });
    }
    sessionId = String(session.id);
    await service.from("formation_dossiers").update({ session_id: sessionId }).eq("id", dossierId);
  }

  const slotDate = String(body?.slot_date ?? new Date().toISOString().slice(0, 10));
  const dayPart = body?.day_part === "apres_midi" ? "apres_midi" : "matin";
  const startsAt =
    body?.starts_at != null
      ? String(body.starts_at)
      : `${slotDate}T${dayPart === "matin" ? "09:00:00" : "13:30:00"}`;
  const endsAt =
    body?.ends_at != null
      ? String(body.ends_at)
      : `${slotDate}T${dayPart === "matin" ? "12:30:00" : "17:00:00"}`;

  const { data: existing } = await service
    .from("formation_slots")
    .select("*")
    .eq("session_id", sessionId)
    .eq("slot_date", slotDate)
    .eq("day_part", dayPart)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ session_id: sessionId, slot: existing });
  }

  const open = new Date(startsAt);
  const close = new Date(open.getTime() + 30 * 60_000);

  const { data: slot, error: slotErr } = await service
    .from("formation_slots")
    .insert({
      session_id: sessionId,
      slot_date: slotDate,
      day_part: dayPart,
      starts_at: startsAt,
      ends_at: endsAt,
      face_to_face_minutes: 210,
      attendance_opens_at: open.toISOString(),
      attendance_closes_at: close.toISOString(),
      attendance_close_offset_minutes: 30,
    })
    .select("*")
    .single();

  if (slotErr || !slot) {
    return NextResponse.json({ error: slotErr?.message || "Créneau impossible" }, { status: 400 });
  }

  // Si une date de session est fixée : (re)planifier positionnement J-3 + synthèse formateur.
  try {
    const { data: dossierFull } = await service
      .from("formation_dossiers")
      .select("id, status, course_title, trainer_user_id")
      .eq("id", dossierId)
      .maybeSingle();
    if (
      dossierFull &&
      ["mise_en_place", "session", "convention"].includes(String(dossierFull.status))
    ) {
      const { data: firstSlot } = await service
        .from("formation_slots")
        .select("slot_date")
        .eq("session_id", sessionId)
        .order("slot_date", { ascending: true })
        .limit(1)
        .maybeSingle();
      const { data: parts } = await service
        .from("formation_participants")
        .select("id, profile_id")
        .eq("dossier_id", dossierId);
      const profileIds = (parts ?? []).map((p) => String(p.profile_id));
      const { data: profiles } = profileIds.length
        ? await service
            .from("profiles")
            .select("id, email, reference_email, full_name, first_name, last_name")
            .in("id", profileIds)
        : { data: [] as Array<Record<string, unknown>> };
      const byId = new Map((profiles ?? []).map((p) => [String(p.id), p]));
      const { schedulePositionnementMails } = await import("@/lib/formation-documents/schedule");
      const { resolveTrainerEmail } = await import("@/lib/formation-assessments/synth");
      const trainerEmail = await resolveTrainerEmail(service, dossierId);
      await schedulePositionnementMails(service, {
        dossierId,
        firstSlotDate: String(firstSlot?.slot_date || slot.slot_date),
        courseTitle: dossierFull.course_title ? String(dossierFull.course_title) : null,
        trainerEmail,
        participants: (parts ?? [])
          .map((p) => {
            const profile = byId.get(String(p.profile_id));
            const email = String(profile?.reference_email || profile?.email || "")
              .trim()
              .toLowerCase();
            const name =
              String(profile?.full_name ?? "").trim() ||
              [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
              email;
            return {
              participantId: String(p.id),
              profileId: String(p.profile_id),
              email,
              name,
            };
          })
          .filter((p) => p.email.includes("@")),
      });
    }
  } catch (e) {
    console.warn("[formation-slots] schedule positionnement:", e);
  }

  return NextResponse.json({ session_id: sessionId, slot }, { status: 201 });
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const sessionId = req.nextUrl.searchParams.get("session_id")?.trim() || "";
  const dossierId = req.nextUrl.searchParams.get("dossier_id")?.trim() || "";

  let sid = sessionId;
  if (!sid && dossierId) {
    const { data: d } = await service
      .from("formation_dossiers")
      .select("session_id")
      .eq("id", dossierId)
      .maybeSingle();
    sid = d?.session_id ? String(d.session_id) : "";
  }
  if (!sid) return NextResponse.json({ slots: [] });

  const { data, error } = await service
    .from("formation_slots")
    .select("*")
    .eq("session_id", sid)
    .order("slot_date", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ session_id: sid, slots: data ?? [] });
}
