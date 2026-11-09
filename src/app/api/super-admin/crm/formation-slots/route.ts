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

  const locationLabel =
    body?.location_label != null ? String(body.location_label).trim() || null : null;
  const modalityPresence =
    body?.modality_presence === "presentiel" ||
    body?.modality_presence === "distanciel" ||
    body?.modality_presence === "hybride"
      ? String(body.modality_presence)
      : null;

  let sessionId = dossier.session_id ? String(dossier.session_id) : null;
  if (!sessionId) {
    const { data: session, error } = await service
      .from("formation_sessions")
      .insert({
        title: dossier.course_title || "Session formation",
        modality_presence: modalityPresence || dossier.modality_presence || "presentiel",
        location_label: locationLabel,
        status: "ready",
      })
      .select("id")
      .single();
    if (error || !session) {
      return NextResponse.json({ error: error?.message || "Session impossible" }, { status: 400 });
    }
    sessionId = String(session.id);
    await service.from("formation_dossiers").update({ session_id: sessionId }).eq("id", dossierId);
  } else if (locationLabel || modalityPresence) {
    const sessionPatch: Record<string, unknown> = {};
    if (locationLabel) sessionPatch.location_label = locationLabel;
    if (modalityPresence) sessionPatch.modality_presence = modalityPresence;
    await service.from("formation_sessions").update(sessionPatch).eq("id", sessionId);
  }

  const slotDate = String(body?.slot_date ?? new Date().toISOString().slice(0, 10));
  const dayPart = body?.day_part === "apres_midi" ? "apres_midi" : "matin";

  /** Normalise HH:mm / ISO → horloge murale `YYYY-MM-DDTHH:mm:ss` (sans Z). */
  const wallClockLocal = (raw: unknown, fallbackHHmm: string): string => {
    const value = String(raw ?? "").trim();
    const fromTime = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value);
    if (fromTime) {
      const hh = fromTime[1].padStart(2, "0");
      const mm = fromTime[2];
      const ss = fromTime[3] ?? "00";
      return `${slotDate}T${hh}:${mm}:${ss}`;
    }
    const fromIso = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
    if (fromIso) {
      return `${fromIso[1]}T${fromIso[2]}:${fromIso[3]}:${fromIso[4] ?? "00"}`;
    }
    const fb = /^(\d{1,2}):(\d{2})/.exec(fallbackHHmm);
    const hh = (fb?.[1] ?? (dayPart === "matin" ? "10" : "14")).padStart(2, "0");
    const mm = fb?.[2] ?? (dayPart === "matin" ? "00" : "30");
    return `${slotDate}T${hh}:${mm}:00`;
  };

  /** Horloge murale Paris → ISO UTC (timestamptz). */
  const parisWallToUtcIso = (wall: string): string => {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(wall);
    if (!m) return wall;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const hh = Number(m[4]);
    const mi = Number(m[5]);
    const ss = Number(m[6]);
    let utc = Date.UTC(y, mo - 1, d, hh, mi, ss);
    for (let i = 0; i < 4; i += 1) {
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).formatToParts(new Date(utc));
      const gotH = Number(fmt.find((p) => p.type === "hour")?.value ?? "0");
      const gotM = Number(fmt.find((p) => p.type === "minute")?.value ?? "0");
      const deltaMin = hh * 60 + mi - (gotH * 60 + gotM);
      if (deltaMin === 0) break;
      utc += deltaMin * 60_000;
    }
    return new Date(utc).toISOString();
  };

  const hasExplicitStart =
    (body?.starts_at != null && String(body.starts_at).trim() !== "") ||
    (body?.start_time != null && String(body.start_time).trim() !== "");
  const hasExplicitEnd =
    (body?.ends_at != null && String(body.ends_at).trim() !== "") ||
    (body?.end_time != null && String(body.end_time).trim() !== "");

  const startsLocal = wallClockLocal(
    body?.starts_at ?? body?.start_time,
    dayPart === "matin" ? "10:00" : "14:30",
  );
  const endsLocal = wallClockLocal(
    body?.ends_at ?? body?.end_time,
    dayPart === "matin" ? "13:30" : "18:00",
  );
  const startsAt = parisWallToUtcIso(startsLocal);
  const endsAt = parisWallToUtcIso(endsLocal);

  const startMs = Date.parse(startsAt);
  const endMs = Date.parse(endsAt);
  const faceMinutes =
    Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
      ? Math.round((endMs - startMs) / 60_000)
      : 210;

  // Fenêtre d’émargement = du début jusqu’à la fin du créneau + 30 min (pas début+30)
  const open = new Date(Number.isFinite(startMs) ? startMs : Date.now());
  const close = new Date(
    (Number.isFinite(endMs) ? endMs : open.getTime() + 210 * 60_000) + 30 * 60_000,
  );

  const { data: existing } = await service
    .from("formation_slots")
    .select("*")
    .eq("session_id", sessionId)
    .eq("slot_date", slotDate)
    .eq("day_part", dayPart)
    .maybeSingle();

  if (existing) {
    // Toujours aligner les horaires saisis (évite de garder les 09:00/17:00 par défaut).
    if (hasExplicitStart || hasExplicitEnd) {
      const { data: updated, error: updErr } = await service
        .from("formation_slots")
        .update({
          starts_at: startsAt,
          ends_at: endsAt,
          face_to_face_minutes: faceMinutes,
          attendance_opens_at: open.toISOString(),
          attendance_closes_at: close.toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (updErr || !updated) {
        return NextResponse.json({ error: updErr?.message || "Mise à jour créneau impossible" }, { status: 400 });
      }
      return NextResponse.json({ session_id: sessionId, slot: updated });
    }
    return NextResponse.json({ session_id: sessionId, slot: existing });
  }

  const { data: slot, error: slotErr } = await service
    .from("formation_slots")
    .insert({
      session_id: sessionId,
      slot_date: slotDate,
      day_part: dayPart,
      starts_at: startsAt,
      ends_at: endsAt,
      face_to_face_minutes: faceMinutes,
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
      const { schedulePositionnementMails, schedulePackFormateurMails } = await import(
        "@/lib/formation-documents/schedule"
      );
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

      const { data: allSlots } = await service
        .from("formation_slots")
        .select("id, slot_date, day_part")
        .eq("session_id", sessionId)
        .order("slot_date", { ascending: true });
      const { data: sessionRow } = await service
        .from("formation_sessions")
        .select("location_label")
        .eq("id", sessionId)
        .maybeSingle();
      await schedulePackFormateurMails(service, {
        dossierId,
        trainerEmail,
        courseTitle: dossierFull.course_title ? String(dossierFull.course_title) : null,
        location: sessionRow?.location_label ? String(sessionRow.location_label) : null,
        slots: (allSlots ?? []).map((s) => ({
          id: String(s.id),
          slot_date: String(s.slot_date),
          day_part: String(s.day_part),
        })),
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
