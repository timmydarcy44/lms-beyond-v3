import type { SupabaseClient } from "@supabase/supabase-js";

export type FormationAgendaEvent = {
  id: string;
  slot_id: string;
  session_id: string;
  dossier_id: string | null;
  title: string;
  slot_date: string;
  day_part: string | null;
  starts_at: string;
  ends_at: string | null;
  day_label: string;
  time_label: string;
  trainer_name: string | null;
  trainer_user_id: string | null;
  address: string | null;
  modality: string | null;
  status: string | null;
};

function parisDayLabel(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
}

function parisTimeRange(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return "—";
  const fmt = (value: Date) =>
    value.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });
  if (!endsAt) return fmt(start);
  const end = new Date(endsAt);
  if (Number.isNaN(end.getTime())) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}

function trainerLabel(row: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
} | null): string | null {
  if (!row) return null;
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return name || row.email || null;
}

/** Créneaux formation pour l’agenda Programmation (+ export iCal). */
export async function loadFormationAgenda(
  service: SupabaseClient,
  params?: { from?: string; to?: string; limit?: number },
): Promise<FormationAgendaEvent[]> {
  const from = params?.from || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const to =
    params?.to || new Date(Date.now() + 120 * 86400000).toISOString().slice(0, 10);
  const limit = Math.min(Math.max(params?.limit ?? 400, 1), 1000);

  const { data: slots, error } = await service
    .from("formation_slots")
    .select("id, session_id, slot_date, day_part, starts_at, ends_at")
    .gte("slot_date", from)
    .lte("slot_date", to)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (error || !slots?.length) return [];

  const sessionIds = [...new Set(slots.map((s) => String(s.session_id)).filter(Boolean))];
  const { data: sessions } = await service
    .from("formation_sessions")
    .select("id, title, location_label, modality_presence, status")
    .in("id", sessionIds);
  const sessionById = new Map((sessions ?? []).map((s) => [String(s.id), s]));

  const { data: dossiers } = await service
    .from("formation_dossiers")
    .select("id, course_title, trainer_user_id, session_id, status")
    .in("session_id", sessionIds);
  const dossierBySession = new Map(
    (dossiers ?? []).map((d) => [String(d.session_id), d]),
  );

  const trainerIds = [
    ...new Set(
      (dossiers ?? [])
        .map((d) => (d.trainer_user_id ? String(d.trainer_user_id) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const trainerById = new Map<string, { first_name?: string | null; last_name?: string | null; email?: string | null }>();
  if (trainerIds.length) {
    const { data: experts } = await service
      .from("experts")
      .select("id, first_name, last_name, email")
      .in("id", trainerIds);
    for (const e of experts ?? []) trainerById.set(String(e.id), e);
  }

  return slots.map((slot) => {
    const session = sessionById.get(String(slot.session_id));
    const dossier = dossierBySession.get(String(slot.session_id));
    const trainerId = dossier?.trainer_user_id ? String(dossier.trainer_user_id) : null;
    const startsAt = String(slot.starts_at);
    const endsAt = slot.ends_at ? String(slot.ends_at) : null;
    const slotDate = String(slot.slot_date);
    return {
      id: String(slot.id),
      slot_id: String(slot.id),
      session_id: String(slot.session_id),
      dossier_id: dossier?.id ? String(dossier.id) : null,
      title:
        String(session?.title || dossier?.course_title || "Formation").trim() || "Formation",
      slot_date: slotDate,
      day_part: slot.day_part ? String(slot.day_part) : null,
      starts_at: startsAt,
      ends_at: endsAt,
      day_label: parisDayLabel(slotDate),
      time_label: parisTimeRange(startsAt, endsAt),
      trainer_name: trainerId ? trainerLabel(trainerById.get(trainerId) ?? null) : null,
      trainer_user_id: trainerId,
      address: session?.location_label ? String(session.location_label) : null,
      modality: session?.modality_presence ? String(session.modality_presence) : null,
      status: dossier?.status ? String(dossier.status) : session?.status ? String(session.status) : null,
    };
  });
}

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function toIcsUtc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

export function formationAgendaToIcs(events: FormationAgendaEvent[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Byound//Programmation//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Byound — Programmation formations",
  ];
  for (const event of events) {
    const start = toIcsUtc(event.starts_at);
    const end = toIcsUtc(event.ends_at || event.starts_at);
    if (!start) continue;
    const desc = [
      event.day_label,
      event.time_label,
      event.trainer_name ? `Formateur : ${event.trainer_name}` : null,
      event.address ? `Lieu : ${event.address}` : null,
      event.modality ? `Modalité : ${event.modality}` : null,
    ]
      .filter(Boolean)
      .join("\\n");
    const eventLines = [
      "BEGIN:VEVENT",
      `UID:formation-slot-${event.slot_id}@byound.fr`,
      `DTSTAMP:${toIcsUtc(new Date().toISOString())}`,
      `DTSTART:${start}`,
      `DTEND:${end || start}`,
      `SUMMARY:${icsEscape(event.title)}`,
      `DESCRIPTION:${icsEscape(desc)}`,
      event.address ? `LOCATION:${icsEscape(event.address)}` : "",
      "END:VEVENT",
    ].filter(Boolean);
    lines.push(...eventLines);
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
