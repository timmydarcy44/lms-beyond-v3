import type { SupabaseClient } from "@supabase/supabase-js";

export type SlotContext = {
  slot: {
    id: string;
    session_id: string;
    slot_date: string;
    day_part: string;
    starts_at: string | null;
    ends_at: string | null;
    attendance_opens_at: string | null;
    attendance_closes_at: string | null;
    attendance_close_offset_minutes: number;
  };
  session: {
    id: string;
    title: string | null;
    location_label: string | null;
    visio_url: string | null;
    modality_presence: string | null;
  };
  dossiers: Array<{
    id: string;
    organization_id: string;
    course_title: string | null;
    organization_name: string;
    convention_signed: boolean;
  }>;
  participants: Array<{
    profile_id: string;
    dossier_id: string;
    email: string;
    name: string;
    job_title: string | null;
    needs_specific_support: boolean;
    convention_ok: boolean;
  }>;
};

export async function loadSlotContext(
  service: SupabaseClient,
  slotId: string,
): Promise<SlotContext | null> {
  const { data: slot } = await service
    .from("formation_slots")
    .select("*")
    .eq("id", slotId)
    .maybeSingle();
  if (!slot) return null;

  const { data: session } = await service
    .from("formation_sessions")
    .select("id, title, location_label, visio_url, modality_presence")
    .eq("id", slot.session_id)
    .maybeSingle();
  if (!session) return null;

  const { data: dossiers } = await service
    .from("formation_dossiers")
    .select("id, organization_id, course_title")
    .eq("session_id", session.id);

  const orgIds = Array.from(new Set((dossiers ?? []).map((d) => String(d.organization_id))));
  const { data: orgs } = orgIds.length
    ? await service.from("organizations").select("id, name").in("id", orgIds)
    : { data: [] as Array<{ id: string; name: string }> };
  const orgName = new Map((orgs ?? []).map((o) => [String(o.id), String(o.name)]));

  const dossierIds = (dossiers ?? []).map((d) => String(d.id));
  const { data: docs } = dossierIds.length
    ? await service
        .from("formation_documents")
        .select("dossier_id, kind, status")
        .in("dossier_id", dossierIds)
        .eq("kind", "convention")
    : { data: [] as Array<{ dossier_id: string; status: string }> };
  const conventionSigned = new Set(
    (docs ?? []).filter((d) => d.status === "signed").map((d) => String(d.dossier_id)),
  );

  const dossierRows = (dossiers ?? []).map((d) => ({
    id: String(d.id),
    organization_id: String(d.organization_id),
    course_title: d.course_title ? String(d.course_title) : null,
    organization_name: orgName.get(String(d.organization_id)) ?? "Entreprise",
    convention_signed: conventionSigned.has(String(d.id)),
  }));

  const { data: parts } = dossierIds.length
    ? await service
        .from("formation_participants")
        .select("profile_id, dossier_id, job_title, needs_specific_support")
        .in("dossier_id", dossierIds)
    : { data: [] as Array<Record<string, unknown>> };

  const profileIds = Array.from(new Set((parts ?? []).map((p) => String(p.profile_id))));
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email, reference_email")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };
  const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));

  const participants = (parts ?? []).map((p) => {
    const profile = profileById.get(String(p.profile_id));
    const name =
      String(profile?.full_name ?? "").trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
      String(profile?.email ?? "");
    const email = String(profile?.reference_email || profile?.email || "")
      .trim()
      .toLowerCase();
    const dossierId = String(p.dossier_id);
    return {
      profile_id: String(p.profile_id),
      dossier_id: dossierId,
      email,
      name,
      job_title: p.job_title ? String(p.job_title) : null,
      needs_specific_support: Boolean(p.needs_specific_support),
      convention_ok: conventionSigned.has(dossierId),
    };
  });

  return {
    slot: {
      id: String(slot.id),
      session_id: String(slot.session_id),
      slot_date: String(slot.slot_date),
      day_part: String(slot.day_part),
      starts_at: slot.starts_at ? String(slot.starts_at) : null,
      ends_at: slot.ends_at ? String(slot.ends_at) : null,
      attendance_opens_at: slot.attendance_opens_at ? String(slot.attendance_opens_at) : null,
      attendance_closes_at: slot.attendance_closes_at ? String(slot.attendance_closes_at) : null,
      attendance_close_offset_minutes: Number(slot.attendance_close_offset_minutes ?? 30),
    },
    session: {
      id: String(session.id),
      title: session.title ? String(session.title) : null,
      location_label: session.location_label ? String(session.location_label) : null,
      visio_url: session.visio_url ? String(session.visio_url) : null,
      modality_presence: session.modality_presence ? String(session.modality_presence) : null,
    },
    dossiers: dossierRows,
    participants,
  };
}

/**
 * Calcule une fin de fenêtre d’émargement saine (lancement formateur).
 * Base = fin de créneau + offset, jamais début + 30 min.
 */
export function resolveAttendanceCloseAt(
  slot: Pick<
    SlotContext["slot"],
    "ends_at" | "starts_at" | "attendance_close_offset_minutes"
  >,
  now = Date.now(),
): Date {
  const offsetMs = Math.max(0, Number(slot.attendance_close_offset_minutes ?? 30)) * 60_000;
  const ends = slot.ends_at ? Date.parse(slot.ends_at) : NaN;
  if (Number.isFinite(ends)) {
    return new Date(Math.max(ends + offsetMs, now + 60 * 60_000));
  }
  const starts = slot.starts_at ? Date.parse(slot.starts_at) : NaN;
  if (Number.isFinite(starts)) {
    // Fallback : demi-journée typique (~3h30) + offset
    return new Date(Math.max(starts + 210 * 60_000 + offsetMs, now + 60 * 60_000));
  }
  return new Date(now + 4 * 60 * 60_000);
}

export function isAttendanceWindowOpen(
  slot: SlotContext["slot"],
  now = Date.now(),
): boolean {
  const openAt = slot.attendance_opens_at
    ? Date.parse(slot.attendance_opens_at)
    : slot.starts_at
      ? Date.parse(slot.starts_at)
      : null;
  const closeAt = slot.attendance_closes_at
    ? Date.parse(slot.attendance_closes_at)
    : slot.ends_at
      ? Date.parse(slot.ends_at) +
        Math.max(0, Number(slot.attendance_close_offset_minutes ?? 30)) * 60_000
      : null;

  // Si pas d'horaires : fenêtre ouverte dès lancement formateur (contrôle via launch.revoked)
  if (openAt == null || !Number.isFinite(openAt)) return true;
  if (now < openAt) return false;
  if (closeAt != null && Number.isFinite(closeAt) && now > closeAt) return false;
  return true;
}

/** Lancement formateur actif = émargement ouvert (ignore une ancienne fenêtre slot trop courte). */
export function isActiveLaunchOpen(
  launch: { revoked_at?: string | null; closes_at?: string | null },
  now = Date.now(),
): boolean {
  if (launch.revoked_at) return false;
  if (launch.closes_at) {
    const t = Date.parse(String(launch.closes_at));
    if (Number.isFinite(t) && now > t) return false;
  }
  return true;
}
