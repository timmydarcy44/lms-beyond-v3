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
