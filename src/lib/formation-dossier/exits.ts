import type { SupabaseClient } from "@supabase/supabase-js";

export const EXIT_KINDS = ["abandon", "annulation", "report", "autre"] as const;
export type ExitKind = (typeof EXIT_KINDS)[number];

export const EXIT_MOTIF_CODES = [
  "personnel",
  "professionnel",
  "sante",
  "inadequation",
  "financier",
  "demenagement",
  "autre",
] as const;
export type ExitMotifCode = (typeof EXIT_MOTIF_CODES)[number];

export const EXIT_DETECTED_VIA = [
  "absence",
  "inactivite_lms",
  "demande",
  "positionnement",
  "autre",
] as const;
export type ExitDetectedVia = (typeof EXIT_DETECTED_VIA)[number];

export const EXIT_KIND_LABELS: Record<ExitKind, string> = {
  abandon: "Abandon",
  annulation: "Annulation",
  report: "Report",
  autre: "Autre",
};

export const EXIT_MOTIF_LABELS: Record<ExitMotifCode, string> = {
  personnel: "Motif personnel",
  professionnel: "Motif professionnel",
  sante: "Santé",
  inadequation: "Inadéquation du parcours",
  financier: "Motif financier",
  demenagement: "Déménagement",
  autre: "Autre",
};

export type ParticipantExitRow = {
  id: string;
  dossier_id: string;
  participant_id: string;
  exited_at: string;
  kind: ExitKind;
  motif_code: ExitMotifCode;
  motif_detail: string | null;
  detected_via: ExitDetectedVia | null;
  actions_taken: string | null;
  closed_at: string | null;
  learner_name?: string | null;
};

function parseKind(v: unknown): ExitKind {
  const s = String(v ?? "");
  return (EXIT_KINDS as readonly string[]).includes(s) ? (s as ExitKind) : "abandon";
}
function parseMotif(v: unknown): ExitMotifCode {
  const s = String(v ?? "");
  return (EXIT_MOTIF_CODES as readonly string[]).includes(s) ? (s as ExitMotifCode) : "autre";
}
function parseVia(v: unknown): ExitDetectedVia | null {
  if (v == null || v === "") return null;
  const s = String(v);
  return (EXIT_DETECTED_VIA as readonly string[]).includes(s) ? (s as ExitDetectedVia) : "autre";
}

export async function listDossierExits(
  service: SupabaseClient,
  dossierId: string,
): Promise<ParticipantExitRow[]> {
  const { data: rows, error } = await service
    .from("formation_participant_exits")
    .select(
      "id, dossier_id, participant_id, exited_at, kind, motif_code, motif_detail, detected_via, actions_taken, closed_at",
    )
    .eq("dossier_id", dossierId)
    .order("exited_at", { ascending: false });
  if (error) {
    if (/formation_participant_exits|schema cache|does not exist/i.test(error.message)) {
      return [];
    }
    return [];
  }
  if (!rows?.length) return [];

  const partIds = rows.map((r) => String(r.participant_id));
  const { data: parts } = await service
    .from("formation_participants")
    .select("id, profile_id")
    .in("id", partIds);
  const profileIds = (parts ?? []).map((p) => String(p.profile_id));
  const { data: profiles } = profileIds.length
    ? await service
        .from("profiles")
        .select("id, full_name, first_name, last_name, email")
        .in("id", profileIds)
    : { data: [] as Array<Record<string, unknown>> };
  const profileById = new Map((profiles ?? []).map((p) => [String(p.id), p]));
  const partToProfile = new Map(
    (parts ?? []).map((p) => [String(p.id), String(p.profile_id)] as const),
  );

  return rows.map((r) => {
    const profile = profileById.get(partToProfile.get(String(r.participant_id)) ?? "");
    const name = profile
      ? String(profile.full_name ?? "").trim() ||
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        String(profile.email ?? "")
      : null;
    return {
      id: String(r.id),
      dossier_id: String(r.dossier_id),
      participant_id: String(r.participant_id),
      exited_at: String(r.exited_at).slice(0, 10),
      kind: parseKind(r.kind),
      motif_code: parseMotif(r.motif_code),
      motif_detail: r.motif_detail ? String(r.motif_detail) : null,
      detected_via: parseVia(r.detected_via),
      actions_taken: r.actions_taken ? String(r.actions_taken) : null,
      closed_at: r.closed_at ? String(r.closed_at) : null,
      learner_name: name,
    };
  });
}

export async function recordParticipantExit(
  service: SupabaseClient,
  params: {
    dossierId: string;
    participantId: string;
    exitedAt?: string;
    kind?: ExitKind;
    motifCode?: ExitMotifCode;
    motifDetail?: string | null;
    detectedVia?: ExitDetectedVia | null;
    actionsTaken?: string | null;
    actorUserId?: string | null;
    close?: boolean;
  },
): Promise<{ ok: true; exit: ParticipantExitRow } | { ok: false; error: string }> {
  const { data: part } = await service
    .from("formation_participants")
    .select("id, dossier_id")
    .eq("id", params.participantId)
    .eq("dossier_id", params.dossierId)
    .maybeSingle();
  if (!part) return { ok: false, error: "Participant introuvable sur ce dossier" };

  const now = new Date().toISOString();
  const row = {
    dossier_id: params.dossierId,
    participant_id: params.participantId,
    exited_at: (params.exitedAt || now).slice(0, 10),
    kind: params.kind ?? "abandon",
    motif_code: params.motifCode ?? "autre",
    motif_detail: params.motifDetail?.trim() || null,
    detected_via: params.detectedVia ?? null,
    actions_taken: params.actionsTaken?.trim() || null,
    closed_at: params.close === false ? null : now,
    created_by: params.actorUserId ?? null,
    updated_at: now,
  };

  const { data: inserted, error } = await service
    .from("formation_participant_exits")
    .upsert(row, { onConflict: "participant_id" })
    .select(
      "id, dossier_id, participant_id, exited_at, kind, motif_code, motif_detail, detected_via, actions_taken, closed_at",
    )
    .maybeSingle();
  if (error || !inserted) {
    return { ok: false, error: error?.message || "Enregistrement impossible" };
  }

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "participant_exit",
    actor_user_id: params.actorUserId ?? null,
    payload: {
      exit_id: inserted.id,
      participant_id: params.participantId,
      kind: row.kind,
      motif_code: row.motif_code,
    },
  });

  if (row.kind === "abandon") {
    void import("@/lib/entreprise/activation-event-emails")
      .then(({ notifyRhFormationAbandon }) =>
        notifyRhFormationAbandon(service, {
          dossierId: params.dossierId,
          participantId: params.participantId,
          kind: row.kind,
        }),
      )
      .catch((err) => console.error("[exits] activation abandon mail", err));
  }

  // Résoudre les alertes engagement ouvertes pour ce participant
  await service
    .from("formation_engagement_alerts")
    .update({ status: "resolved", resolved_at: now, updated_at: now })
    .eq("dossier_id", params.dossierId)
    .eq("participant_id", params.participantId)
    .in("status", ["open", "in_progress"]);

  const list = await listDossierExits(service, params.dossierId);
  const exit = list.find((e) => e.id === String(inserted.id));
  return {
    ok: true,
    exit: exit ?? {
      id: String(inserted.id),
      dossier_id: String(inserted.dossier_id),
      participant_id: String(inserted.participant_id),
      exited_at: String(inserted.exited_at).slice(0, 10),
      kind: parseKind(inserted.kind),
      motif_code: parseMotif(inserted.motif_code),
      motif_detail: inserted.motif_detail ? String(inserted.motif_detail) : null,
      detected_via: parseVia(inserted.detected_via),
      actions_taken: inserted.actions_taken ? String(inserted.actions_taken) : null,
      closed_at: inserted.closed_at ? String(inserted.closed_at) : null,
    },
  };
}

/** Taux d'abandon (abandons / participants) pour un cours catalogue, période optionnelle. */
export async function computeDropoutRateForCourse(
  service: SupabaseClient,
  trainingCourseId: string,
): Promise<{ rate: number | null; abandons: number; participants: number }> {
  const { data: dossiers } = await service
    .from("formation_dossiers")
    .select("id")
    .eq("training_course_id", trainingCourseId)
    .in("status", ["session", "fin", "cloture"]);
  const dossierIds = (dossiers ?? []).map((d) => String(d.id));
  if (!dossierIds.length) return { rate: null, abandons: 0, participants: 0 };

  const { count: participants } = await service
    .from("formation_participants")
    .select("id", { count: "exact", head: true })
    .in("dossier_id", dossierIds);

  const { count: abandons } = await service
    .from("formation_participant_exits")
    .select("id", { count: "exact", head: true })
    .in("dossier_id", dossierIds)
    .eq("kind", "abandon");

  const p = participants ?? 0;
  const a = abandons ?? 0;
  if (p === 0) return { rate: null, abandons: a, participants: p };
  return { rate: Math.round((a / p) * 1000) / 10, abandons: a, participants: p };
}
